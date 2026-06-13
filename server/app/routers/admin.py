from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, Header, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from ..config import settings
from ..db import get_db
from ..deps import get_admin_user, get_current_user
from ..scoring import calculate_points
from ..serializers import match_out, _proxy_avatar
from ..services.sync_service import sync_and_score

router = APIRouter(prefix="/admin", tags=["admin"])


def _check_admin(token: str | None) -> None:
    if not settings.admin_sync_token:
        raise HTTPException(
            status_code=403,
            detail="Admin sync is disabled. Set ADMIN_SYNC_TOKEN to enable.",
        )
    if token != settings.admin_sync_token:
        raise HTTPException(status_code=401, detail="Invalid admin token")


@router.post("/sync")
async def trigger_sync(
    x_admin_token: str | None = Header(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Manually trigger a fetch from the football API and rescore predictions."""
    _check_admin(x_admin_token)
    return await sync_and_score(db)


# ── Admin dashboard endpoints ──────────────────────────────────────────────

@router.get("/users")
async def admin_list_users(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(get_admin_user),
):
    users = []
    async for u in db.users.find({}, {"nickname": 1, "email": 1, "total_points": 1, "avatar_url": 1, "first_name": 1, "last_name": 1}).sort("total_points", -1):
        users.append({
            "id": str(u["_id"]),
            "nickname": u["nickname"],
            "email": u.get("email", ""),
            "first_name": u.get("first_name", ""),
            "last_name": u.get("last_name", ""),
            "total_points": u.get("total_points", 0),
            "avatar_url": _proxy_avatar(u.get("avatar_url")),
        })
    return users


@router.get("/users/{user_id}/predictions")
async def admin_user_predictions(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(get_admin_user),
):
    try:
        user_oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="User not found")

    matches = [m async for m in db.matches.find({}).sort("kickoff", 1)]

    preds: dict = {}
    async for p in db.predictions.find({"user_id": user_oid}):
        preds[p["match_id"]] = p

    result = []
    for m in matches:
        p = preds.get(m["_id"])
        result.append({
            "match": match_out(m),
            "prediction": {
                "home_score": p["home_score"],
                "away_score": p["away_score"],
                "points": p.get("points"),
                "scored": p.get("scored", False),
            } if p else None,
        })
    return result


class PredictionEdit(BaseModel):
    home_score: int
    away_score: int


@router.patch("/predictions/{user_id}/{match_id}")
async def admin_set_prediction(
    user_id: str,
    match_id: str,
    payload: PredictionEdit,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(get_admin_user),
):
    try:
        user_oid = ObjectId(user_id)
        match_oid = ObjectId(match_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Invalid id")

    match = await db.matches.find_one({"_id": match_oid})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    existing = await db.predictions.find_one({"user_id": user_oid, "match_id": match_oid})
    old_points = existing.get("points") or 0 if existing and existing.get("scored") else 0

    new_points = None
    new_scored = False
    if match.get("status") == "finished" and match.get("home_score") is not None:
        new_points = calculate_points(
            payload.home_score, payload.away_score,
            match["home_score"], match["away_score"],
        )
        new_scored = True

    await db.predictions.update_one(
        {"user_id": user_oid, "match_id": match_oid},
        {"$set": {
            "user_id": user_oid,
            "match_id": match_oid,
            "home_score": payload.home_score,
            "away_score": payload.away_score,
            "points": new_points,
            "scored": new_scored,
            "updated_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )

    delta = (new_points or 0) - old_points
    if delta != 0:
        await db.users.update_one({"_id": user_oid}, {"$inc": {"total_points": delta}})

    return {"home_score": payload.home_score, "away_score": payload.away_score, "points": new_points, "scored": new_scored}

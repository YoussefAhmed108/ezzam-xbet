from datetime import datetime, timedelta, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException

from ..config import settings
from ..db import get_db
from ..deps import get_current_user
from ..serializers import match_out, _proxy_avatar

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}/stats")
async def user_stats(user_id: str, db=Depends(get_db), _=Depends(get_current_user)):
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="User not found")

    user = await db.users.find_one(
        {"_id": oid},
        {"nickname": 1, "first_name": 1, "last_name": 1, "avatar_url": 1, "total_points": 1},
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    exact = await db.predictions.count_documents({"user_id": oid, "scored": True, "points": {"$gte": 3}})
    outcome = await db.predictions.count_documents({"user_id": oid, "scored": True, "points": {"$in": [1, 2]}})

    return {
        "user_id": str(user["_id"]),
        "nickname": user["nickname"],
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "avatar_url": _proxy_avatar(user.get("avatar_url")),
        "total_points": user.get("total_points", 0),
        "exact": exact,
        "outcome": outcome,
    }


@router.get("/{user_id}/predictions")
async def user_predictions(user_id: str, db=Depends(get_db), _=Depends(get_current_user)):
    """Return a user's locked predictions (only for matches past the lock threshold)."""
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="User not found")

    if not await db.users.find_one({"_id": oid}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="User not found")

    threshold = datetime.now(timezone.utc) + timedelta(hours=settings.prediction_lock_hours)
    matches = [
        m
        async for m in db.matches.find({"kickoff": {"$lte": threshold}}).sort("kickoff", -1)
    ]
    if not matches:
        return []

    match_ids = [m["_id"] for m in matches]
    preds: dict = {}
    async for p in db.predictions.find({"match_id": {"$in": match_ids}, "user_id": oid}):
        preds[p["match_id"]] = p

    result = []
    for m in matches:
        p = preds.get(m["_id"])
        if p:
            result.append({
                "match": match_out(m),
                "home_score": p["home_score"],
                "away_score": p["away_score"],
                "pen_home": p.get("pen_home"),
                "pen_away": p.get("pen_away"),
                "points": p.get("points"),
                "scored": p.get("scored", False),
            })
    return result

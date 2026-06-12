import secrets
import string
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..config import settings
from ..db import get_db
from ..deps import get_current_user
from ..schemas import (
    GroupCreate,
    GroupJoin,
    GroupOut,
    MatchPredictionsOut,
)
from ..scoring import calculate_points
from ..serializers import match_out, _proxy_avatar

router = APIRouter(prefix="/groups", tags=["groups"])

_CODE_ALPHABET = string.ascii_uppercase + string.digits


async def _unique_invite_code(db: AsyncIOMotorDatabase) -> str:
    for _ in range(10):
        code = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(6))
        if not await db.groups.find_one({"invite_code": code}):
            return code
    raise HTTPException(status_code=500, detail="Could not generate invite code")


async def _live_points_by_user(db: AsyncIOMotorDatabase, member_ids: list) -> dict:
    """Provisional points each member is currently earning from live matches.

    Uses the same scoring rules as final settlement, but against the current
    in-progress score. Not persisted -- computed on demand for the live view.
    """
    totals: dict = {}
    live = [
        m
        async for m in db.matches.find(
            {
                "status": "live",
                "home_score": {"$ne": None},
                "away_score": {"$ne": None},
            }
        )
    ]
    if not live:
        return totals
    scores = {m["_id"]: (m["home_score"], m["away_score"]) for m in live}
    async for p in db.predictions.find(
        {
            "match_id": {"$in": list(scores.keys())},
            "user_id": {"$in": member_ids},
        }
    ):
        actual_home, actual_away = scores[p["match_id"]]
        pts = calculate_points(
            p["home_score"], p["away_score"], actual_home, actual_away
        )
        if pts:
            totals[p["user_id"]] = totals.get(p["user_id"], 0) + pts
    return totals


async def _group_out(db: AsyncIOMotorDatabase, group: dict) -> dict:
    member_ids = group.get("member_ids", [])
    live_extra = await _live_points_by_user(db, member_ids)
    members = []
    async for u in db.users.find({"_id": {"$in": member_ids}}, {"nickname": 1, "total_points": 1, "avatar_url": 1}):
        finished_points = u.get("total_points", 0)
        members.append(
            {
                "user_id": str(u["_id"]),
                "nickname": u["nickname"],
                "avatar_url": _proxy_avatar(u.get("avatar_url")),
                "points": finished_points,
                "live_points": finished_points + live_extra.get(u["_id"], 0),
            }
        )
    members.sort(key=lambda m: m["points"], reverse=True)
    rank = 1
    for i, m in enumerate(members):
        if i > 0 and m["points"] < members[i - 1]["points"]:
            rank = i + 1
        m["rank"] = rank
    return {
        "id": str(group["_id"]),
        "name": group["name"],
        "invite_code": group["invite_code"],
        "owner_id": str(group["owner_id"]),
        "member_count": len(member_ids),
        "members": members,
    }


@router.get("/me", response_model=list[GroupOut])
async def my_groups(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    cursor = db.groups.find({"member_ids": current_user["_id"]})
    return [await _group_out(db, g) async for g in cursor]


@router.post("", response_model=GroupOut, status_code=201)
async def create_group(
    payload: GroupCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    code = await _unique_invite_code(db)
    doc = {
        "name": payload.name.strip(),
        "invite_code": code,
        "owner_id": current_user["_id"],
        "member_ids": [current_user["_id"]],
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.groups.insert_one(doc)
    doc["_id"] = result.inserted_id
    return await _group_out(db, doc)


@router.post("/join", response_model=GroupOut)
async def join_group(
    payload: GroupJoin,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    group = await db.groups.find_one({"invite_code": payload.invite_code.upper()})
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    if current_user["_id"] in group.get("member_ids", []):
        return await _group_out(db, group)
    await db.groups.update_one(
        {"_id": group["_id"]},
        {"$addToSet": {"member_ids": current_user["_id"]}},
    )
    group = await db.groups.find_one({"_id": group["_id"]})
    return await _group_out(db, group)


@router.get("/{group_id}", response_model=GroupOut)
async def get_group(
    group_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        oid = ObjectId(group_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid group id")
    group = await db.groups.find_one({"_id": oid})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if current_user["_id"] not in group.get("member_ids", []):
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    return await _group_out(db, group)


@router.get("/{group_id}/predictions", response_model=list[MatchPredictionsOut])
async def group_predictions(
    group_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Members' predictions, revealed only for matches past their deadline.

    A match's deadline is `PREDICTION_LOCK_HOURS` before kickoff. We never expose
    picks for matches whose deadline hasn't passed yet, so no one can copy.
    """
    try:
        oid = ObjectId(group_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid group id")

    group = await db.groups.find_one({"_id": oid})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    member_ids = group.get("member_ids", [])
    if current_user["_id"] not in member_ids:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    # A match is locked once now >= kickoff - lock_hours, i.e. kickoff <= now + lock_hours.
    threshold = datetime.now(timezone.utc) + timedelta(
        hours=settings.prediction_lock_hours
    )
    matches = [
        m
        async for m in db.matches.find({"kickoff": {"$lte": threshold}}).sort(
            "kickoff", -1
        )
    ]
    if not matches:
        return []

    match_ids = [m["_id"] for m in matches]

    # nickname lookup for members
    nicknames: dict = {}
    async for u in db.users.find({"_id": {"$in": member_ids}}):
        nicknames[u["_id"]] = u["nickname"]

    # predictions for these matches by group members, grouped per match
    preds_by_match: dict = {}
    async for p in db.predictions.find(
        {"match_id": {"$in": match_ids}, "user_id": {"$in": member_ids}}
    ):
        preds_by_match.setdefault(p["match_id"], []).append(p)

    result = []
    for m in matches:
        rows = []
        for p in preds_by_match.get(m["_id"], []):
            rows.append(
                {
                    "user_id": str(p["user_id"]),
                    "nickname": nicknames.get(p["user_id"], "Unknown"),
                    "home_score": p["home_score"],
                    "away_score": p["away_score"],
                    "points": p.get("points"),
                    "scored": p.get("scored", False),
                }
            )
        rows.sort(key=lambda r: (r["points"] or 0), reverse=True)
        result.append({"match": match_out(m), "predictions": rows})
    return result


@router.delete("/{group_id}/leave", status_code=204)
async def leave_group(
    group_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        oid = ObjectId(group_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid group id")
    await db.groups.update_one(
        {"_id": oid}, {"$pull": {"member_ids": current_user["_id"]}}
    )
    return None

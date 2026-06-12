from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..deps import get_current_user
from ..routers.groups import _live_points_by_user
from ..schemas import LeaderboardEntryOut

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardEntryOut])
async def global_leaderboard(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    users = [u async for u in db.users.find({}, {"nickname": 1, "total_points": 1, "first_name": 1, "last_name": 1})]
    all_ids = [u["_id"] for u in users]
    live_extra = await _live_points_by_user(db, all_ids)

    entries = []
    for u in users:
        finished = u.get("total_points", 0)
        entries.append(
            {
                "user_id": str(u["_id"]),
                "nickname": u["nickname"],
                "first_name": u.get("first_name", ""),
                "last_name": u.get("last_name", ""),
                "points": finished,
                "live_points": finished + live_extra.get(u["_id"], 0),
                "rank": 0,
            }
        )

    entries.sort(key=lambda e: e["points"], reverse=True)
    rank = 1
    for i, e in enumerate(entries):
        if i > 0 and e["points"] < entries[i - 1]["points"]:
            rank = i + 1
        e["rank"] = rank
    return entries

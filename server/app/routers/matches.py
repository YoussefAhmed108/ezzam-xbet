from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..deps import get_current_user
from ..schemas import MatchOut
from ..serializers import match_out

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=list[MatchOut])
async def list_matches(
    status: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    query: dict = {}
    if status:
        query["status"] = status
    cursor = db.matches.find(query).sort("kickoff", 1)
    return [match_out(doc) async for doc in cursor]

from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..deps import get_current_user
from ..schemas import PredictionIn, PredictionOut
from ..scoring import is_knockout_stage
from ..serializers import match_is_locked, prediction_out

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/me", response_model=list[PredictionOut])
async def my_predictions(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    cursor = db.predictions.find({"user_id": current_user["_id"]})
    return [prediction_out(doc) async for doc in cursor]


@router.post("", response_model=PredictionOut)
async def submit_prediction(
    payload: PredictionIn,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        match_oid = ObjectId(payload.match_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid match id")

    match = await db.matches.find_one({"_id": match_oid})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match_is_locked(match["kickoff"]):
        raise HTTPException(
            status_code=403,
            detail="Predictions are locked (within 2 hours of kickoff)",
        )

    if payload.joker and not is_knockout_stage(match.get("stage")):
        raise HTTPException(status_code=400, detail="Joker is only available in knockout rounds")

    now = datetime.now(timezone.utc)

    if payload.joker:
        stage = match.get("stage")
        other_ids = [
            m["_id"]
            async for m in db.matches.find({"stage": stage, "_id": {"$ne": match_oid}}, {"_id": 1})
        ]
        if other_ids:
            await db.predictions.update_many(
                {"user_id": current_user["_id"], "match_id": {"$in": other_ids}, "joker": True},
                {"$set": {"joker": False}},
            )

    await db.predictions.update_one(
        {"user_id": current_user["_id"], "match_id": match_oid},
        {
            "$set": {
                "home_score": payload.home_score,
                "away_score": payload.away_score,
                "pen_home": payload.pen_home,
                "pen_away": payload.pen_away,
                "joker": payload.joker,
                "updated_at": now,
            },
            "$setOnInsert": {
                "user_id": current_user["_id"],
                "match_id": match_oid,
                "points": None,
                "scored": False,
                "created_at": now,
            },
        },
        upsert=True,
    )
    doc = await db.predictions.find_one(
        {"user_id": current_user["_id"], "match_id": match_oid}
    )
    return prediction_out(doc)

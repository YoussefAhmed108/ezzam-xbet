from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..deps import get_current_user
from ..schemas import PredictionIn, PredictionOut
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

    now = datetime.now(timezone.utc)
    await db.predictions.update_one(
        {"user_id": current_user["_id"], "match_id": match_oid},
        {
            "$set": {
                "home_score": payload.home_score,
                "away_score": payload.away_score,
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

"""Synchronize matches/results from the football API and (re)score predictions."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from ..config import settings
from ..scoring import calculate_points, calculate_points_knockout, is_knockout_stage
from .football_api import FootballAPIError, NormalizedMatch, football_client

logger = logging.getLogger("sync")


async def _rollback_match_points(db: AsyncIOMotorDatabase, match_id) -> None:
    """Undo any points previously awarded for a match (used when un-finishing it)."""
    async for pred in db.predictions.find({"match_id": match_id, "scored": True}):
        pts = pred.get("points") or 0
        await db.predictions.update_one(
            {"_id": pred["_id"]},
            {"$set": {"points": None, "scored": False}},
        )
        if pts:
            await db.users.update_one(
                {"_id": pred["user_id"]},
                {"$inc": {"total_points": -pts}},
            )


# Match fields the test override mutates; snapshotted so they can be restored.
_OVERRIDE_FIELDS = ("status", "home_score", "away_score", "kickoff")


async def _snapshot_original(db: AsyncIOMotorDatabase, match: dict) -> None:
    """Save a match's real values once, before the override first mutates it."""
    if match.get("test_override"):
        return  # already snapshotted on a previous sync
    original = {k: match.get(k) for k in _OVERRIDE_FIELDS}
    await db.matches.update_one(
        {"_id": match["_id"]},
        {"$set": {"test_override": True, "test_override_original": original}},
    )


async def _clear_test_override(db: AsyncIOMotorDatabase) -> None:
    """Revert every match the override touched back to its real values.

    Restores the snapshotted status/score/kickoff, rolls back any points that
    were awarded off a forced result, and removes the override bookkeeping
    fields. Runs whenever TEST_FORCE_MATCH_RESULT is false.
    """
    now = datetime.now(timezone.utc)
    async for match in db.matches.find({"test_override": True}):
        original = match.get("test_override_original") or {}
        restore = {k: original[k] for k in _OVERRIDE_FIELDS if k in original}
        # Undo points awarded while the match was force-finished.
        await _rollback_match_points(db, match["_id"])
        await db.matches.update_one(
            {"_id": match["_id"]},
            {
                "$set": {**restore, "updated_at": now},
                "$unset": {"test_override": "", "test_override_original": ""},
            },
        )
        logger.warning(
            "TEST override cleared: restored %s vs %s",
            match.get("home_team"),
            match.get("away_team"),
        )


async def _apply_test_override(db: AsyncIOMotorDatabase) -> None:
    """TEST ONLY: stub the three earliest matches into finished + locked + live.

    Enabled via TEST_FORCE_MATCH_RESULT=true. So the Predictions tab shows every
    match state:
      - 1st match  -> FINISHED 3-3 with a past kickoff (history; gets scored).
      - 2nd match  -> SCHEDULED, no score, kickoff in 30 min (past deadline =
                      locked, so picks are revealed but no scoring happens).
      - 3rd match  -> LIVE 2-0, kickoff 30 min ago (in progress, not scored).

    Runs on every sync, directly in the DB and independent of the external API.
    The real values are snapshotted on first apply, so setting the env flag to
    false fully restores them (see _clear_test_override).
    """
    if not settings.test_force_match_result:
        await _clear_test_override(db)
        return
    docs = [m async for m in db.matches.find().sort("kickoff", 1).limit(3)]
    if not docs:
        logger.warning("TEST override skipped: no matches in DB yet")
        return
    now = datetime.now(timezone.utc)

    finished = docs[0]
    await _snapshot_original(db, finished)
    await db.matches.update_one(
        {"_id": finished["_id"]},
        {
            "$set": {
                "status": "finished",
                "home_score": 3,
                "away_score": 3,
                "kickoff": now - timedelta(hours=3),
                "updated_at": now,
            }
        },
    )
    logger.warning(
        "TEST override applied: %s 3 - 3 %s (finished history)",
        finished.get("home_team"),
        finished.get("away_team"),
    )

    if len(docs) > 1:
        locked = docs[1]
        await _snapshot_original(db, locked)
        await db.matches.update_one(
            {"_id": locked["_id"]},
            {
                "$set": {
                    "status": "scheduled",
                    "home_score": None,
                    "away_score": None,
                    "kickoff": now + timedelta(minutes=30),
                    "updated_at": now,
                }
            },
        )
        await _rollback_match_points(db, locked["_id"])
        logger.warning(
            "TEST override applied: %s vs %s kickoff in 30 min (locked, unplayed)",
            locked.get("home_team"),
            locked.get("away_team"),
        )

    if len(docs) > 2:
        live = docs[2]
        await _snapshot_original(db, live)
        await db.matches.update_one(
            {"_id": live["_id"]},
            {
                "$set": {
                    "status": "live",
                    "home_score": 2,
                    "away_score": 0,
                    "kickoff": now - timedelta(minutes=30),
                    "updated_at": now,
                }
            },
        )
        await _rollback_match_points(db, live["_id"])
        logger.warning(
            "TEST override applied: %s 2 - 0 %s (live)",
            live.get("home_team"),
            live.get("away_team"),
        )


async def upsert_matches(
    db: AsyncIOMotorDatabase, matches: list[NormalizedMatch]
) -> int:
    """Insert or update matches; returns number processed."""
    for m in matches:
        await db.matches.update_one(
            {"external_id": m.external_id},
            {
                "$set": {
                    "external_id": m.external_id,
                    "home_team": m.home_team,
                    "away_team": m.away_team,
                    "home_flag": m.home_flag,
                    "away_flag": m.away_flag,
                    "group": m.group,
                    "stage": m.stage,
                    "kickoff": m.kickoff,
                    "status": m.status,
                    "home_score": m.home_score,
                    "away_score": m.away_score,
                    "pen_home": m.pen_home,
                    "pen_away": m.pen_away,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )
    return len(matches)


async def score_finished_matches(db: AsyncIOMotorDatabase) -> int:
    """Score predictions for finished matches with a known result.

    Idempotent: only (re)scores predictions whose stored points differ from the
    freshly computed value, and adjusts the user's running total accordingly.
    Returns the number of predictions updated.
    """
    updated = 0
    cursor = db.matches.find(
        {
            "status": "finished",
            "home_score": {"$ne": None},
            "away_score": {"$ne": None},
        }
    )
    async for match in cursor:
        actual_home = match["home_score"]
        actual_away = match["away_score"]
        match_id = match["_id"]

        knockout = is_knockout_stage(match.get("stage"))
        actual_pen_home = match.get("pen_home")
        actual_pen_away = match.get("pen_away")

        preds = db.predictions.find({"match_id": match_id})
        async for pred in preds:
            if knockout:
                new_points = calculate_points_knockout(
                    pred["home_score"],
                    pred["away_score"],
                    actual_home,
                    actual_away,
                    pred.get("pen_home"),
                    pred.get("pen_away"),
                    actual_pen_home,
                    actual_pen_away,
                )
            else:
                new_points = calculate_points(
                    pred["home_score"],
                    pred["away_score"],
                    actual_home,
                    actual_away,
                )
            if pred.get("joker"):
                new_points *= 2
            old_points = pred.get("points") if pred.get("scored") else None
            if old_points == new_points:
                continue

            delta = new_points - (old_points or 0)
            await db.predictions.update_one(
                {"_id": pred["_id"]},
                {"$set": {"points": new_points, "scored": True}},
            )
            if delta != 0:
                await db.users.update_one(
                    {"_id": pred["user_id"]},
                    {"$inc": {"total_points": delta}},
                )
            updated += 1
    return updated


async def sync_and_score(db: AsyncIOMotorDatabase) -> dict:
    """Full cycle: fetch from API, upsert matches, score finished matches."""
    result = {"matches_synced": 0, "predictions_scored": 0, "error": None}
    try:
        matches = await football_client.fetch_matches()
        result["matches_synced"] = await upsert_matches(db, matches)
    except FootballAPIError as exc:
        # Still score whatever results we already have stored locally.
        logger.warning("Football API sync skipped: %s", exc)
        result["error"] = str(exc)
    await _apply_test_override(db)
    result["predictions_scored"] = await score_finished_matches(db)
    logger.info("Sync complete: %s", result)
    return result

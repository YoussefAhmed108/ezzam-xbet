"""Helpers to convert MongoDB documents into API response dicts."""

from datetime import datetime, timedelta, timezone

from .config import settings


def user_public(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "nickname": doc["nickname"],
        "email": doc["email"],
        "first_name": doc["first_name"],
        "last_name": doc["last_name"],
        "total_points": doc.get("total_points", 0),
        "avatar_url": doc.get("avatar_url"),
    }


def _as_utc(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware in UTC.

    Mongo returns naive datetimes (stored as UTC). Tagging them as UTC makes
    FastAPI serialize them with an offset (e.g. ...+00:00) so the browser can
    convert to the viewer's local timezone correctly.
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def match_is_locked(kickoff: datetime) -> bool:
    lock_at = _as_utc(kickoff) - timedelta(hours=settings.prediction_lock_hours)
    return datetime.now(timezone.utc) >= lock_at


def match_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "external_id": doc["external_id"],
        "home_team": doc["home_team"],
        "away_team": doc["away_team"],
        "home_flag": doc.get("home_flag"),
        "away_flag": doc.get("away_flag"),
        "group": doc.get("group"),
        "stage": doc.get("stage"),
        "kickoff": _as_utc(doc["kickoff"]),
        "status": doc.get("status", "scheduled"),
        "home_score": doc.get("home_score"),
        "away_score": doc.get("away_score"),
        "locked": match_is_locked(doc["kickoff"]),
    }


def prediction_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "match_id": str(doc["match_id"]),
        "home_score": doc["home_score"],
        "away_score": doc["away_score"],
        "points": doc.get("points"),
        "scored": doc.get("scored", False),
        "updated_at": _as_utc(doc["updated_at"]) if doc.get("updated_at") else None,
    }

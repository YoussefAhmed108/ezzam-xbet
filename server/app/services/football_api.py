"""Pluggable football data API client.

Supports two providers out of the box:
  - "football-data" (football-data.org), competition code "WC"
  - "api-football"  (api-football.com), World Cup league id "1"

Both providers are normalized into the same NormalizedMatch shape so the rest of
the application doesn't care which one is configured.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import httpx

from ..config import settings


@dataclass
class NormalizedMatch:
    external_id: str
    home_team: str
    away_team: str
    home_flag: Optional[str]
    away_flag: Optional[str]
    group: Optional[str]
    stage: Optional[str]
    kickoff: datetime
    status: str  # "scheduled" | "live" | "finished"
    home_score: Optional[int]
    away_score: Optional[int]


def _parse_dt(value: str) -> datetime:
    # Handles both "2026-06-11T16:00:00Z" and "+00:00" offsets
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class FootballAPIError(RuntimeError):
    pass


class FootballAPIClient:
    def __init__(self) -> None:
        self.provider = settings.football_api_provider
        self.api_key = settings.football_api_key
        self.competition = settings.football_api_competition
        self.season = settings.football_api_season

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    async def fetch_matches(self) -> list[NormalizedMatch]:
        if not self.configured:
            raise FootballAPIError(
                "No FOOTBALL_API_KEY configured. Set one in .env or seed matches "
                "manually via the admin sync endpoint."
            )
        if self.provider == "football-data":
            return await self._fetch_football_data()
        if self.provider == "api-football":
            return await self._fetch_api_football()
        raise FootballAPIError(f"Unknown provider: {self.provider}")

    async def _fetch_football_data(self) -> list[NormalizedMatch]:
        url = f"https://api.football-data.org/v4/competitions/{self.competition}/matches"
        headers = {"X-Auth-Token": self.api_key}
        params = {"season": self.season}
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url, headers=headers, params=params)
            if resp.status_code >= 400:
                raise FootballAPIError(
                    f"football-data.org error {resp.status_code}: {resp.text[:200]}"
                )
            data = resp.json()

        status_map = {
            "SCHEDULED": "scheduled",
            "TIMED": "scheduled",
            "POSTPONED": "scheduled",
            "SUSPENDED": "scheduled",
            "CANCELLED": "scheduled",
            "IN_PLAY": "live",
            "PAUSED": "live",
            "FINISHED": "finished",
            "AWARDED": "finished",
        }

        out: list[NormalizedMatch] = []
        for m in data.get("matches", []):
            full = (m.get("score") or {}).get("fullTime") or {}
            out.append(
                NormalizedMatch(
                    external_id=str(m["id"]),
                    home_team=(m.get("homeTeam") or {}).get("name") or "TBD",
                    away_team=(m.get("awayTeam") or {}).get("name") or "TBD",
                    home_flag=(m.get("homeTeam") or {}).get("crest"),
                    away_flag=(m.get("awayTeam") or {}).get("crest"),
                    group=m.get("group"),
                    stage=m.get("stage"),
                    kickoff=_parse_dt(m["utcDate"]),
                    status=status_map.get(m.get("status", ""), "scheduled"),
                    home_score=full.get("home"),
                    away_score=full.get("away"),
                )
            )
        return out

    async def _fetch_api_football(self) -> list[NormalizedMatch]:
        url = "https://v3.football.api-sports.io/fixtures"
        headers = {"x-apisports-key": self.api_key}
        params = {"league": self.competition, "season": self.season}
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url, headers=headers, params=params)
            if resp.status_code >= 400:
                raise FootballAPIError(
                    f"api-football error {resp.status_code}: {resp.text[:200]}"
                )
            data = resp.json()

        # api-football returns HTTP 200 with a non-empty "errors" field for
        # plan/parameter problems (e.g. a season your plan can't access).
        errors = data.get("errors")
        if errors:
            if isinstance(errors, dict):
                msg = "; ".join(f"{k}: {v}" for k, v in errors.items())
            else:
                msg = str(errors)
            raise FootballAPIError(f"api-football: {msg}")

        live = {"1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"}
        finished = {"FT", "AET", "PEN"}

        out: list[NormalizedMatch] = []
        for item in data.get("response", []):
            fixture = item.get("fixture") or {}
            teams = item.get("teams") or {}
            goals = item.get("goals") or {}
            league = item.get("league") or {}
            short = (fixture.get("status") or {}).get("short", "NS")
            if short in finished:
                status = "finished"
            elif short in live:
                status = "live"
            else:
                status = "scheduled"
            out.append(
                NormalizedMatch(
                    external_id=str(fixture["id"]),
                    home_team=(teams.get("home") or {}).get("name") or "TBD",
                    away_team=(teams.get("away") or {}).get("name") or "TBD",
                    home_flag=(teams.get("home") or {}).get("logo"),
                    away_flag=(teams.get("away") or {}).get("logo"),
                    group=league.get("round"),
                    stage=league.get("round"),
                    kickoff=_parse_dt(fixture["date"]),
                    status=status,
                    home_score=goals.get("home"),
                    away_score=goals.get("away"),
                )
            )
        return out


football_client = FootballAPIClient()

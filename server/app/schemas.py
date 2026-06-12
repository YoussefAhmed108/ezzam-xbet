from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# --- Auth / Users ---
class UserCreate(BaseModel):
    nickname: str = Field(min_length=2, max_length=30)
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(default=None, min_length=2, max_length=30)
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=50)


class UserPublic(BaseModel):
    id: str
    nickname: str
    email: EmailStr
    first_name: str
    last_name: str
    total_points: int = 0
    avatar_url: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# --- Matches ---
MatchStatus = Literal["scheduled", "live", "finished"]


class MatchOut(BaseModel):
    id: str
    external_id: str
    home_team: str
    away_team: str
    home_flag: Optional[str] = None
    away_flag: Optional[str] = None
    group: Optional[str] = None
    stage: Optional[str] = None
    kickoff: datetime
    status: MatchStatus
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    locked: bool = False  # whether predictions are locked (within the lock window)


# --- Predictions ---
class PredictionIn(BaseModel):
    match_id: str
    home_score: int = Field(ge=0, le=99)
    away_score: int = Field(ge=0, le=99)


class PredictionOut(BaseModel):
    id: str
    match_id: str
    home_score: int
    away_score: int
    points: Optional[int] = None
    scored: bool = False
    updated_at: datetime


# --- Groups ---
class GroupCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)


class GroupJoin(BaseModel):
    invite_code: str = Field(min_length=4, max_length=12)


class GroupMemberOut(BaseModel):
    user_id: str
    nickname: str
    points: int
    live_points: int = 0
    rank: int


class LeaderboardEntryOut(GroupMemberOut):
    first_name: str = ""
    last_name: str = ""
    avatar_url: Optional[str] = None


class GroupOut(BaseModel):
    id: str
    name: str
    invite_code: str
    owner_id: str
    member_count: int
    members: list[GroupMemberOut] = []


class MemberPredictionOut(BaseModel):
    user_id: str
    nickname: str
    home_score: int
    away_score: int
    points: Optional[int] = None
    scored: bool = False


class MatchPredictionsOut(BaseModel):
    match: MatchOut
    predictions: list[MemberPredictionOut] = []

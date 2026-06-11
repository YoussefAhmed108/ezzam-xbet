from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from ..db import get_db
from ..deps import get_current_user
from ..schemas import TokenResponse, UserCreate, UserLogin, UserPublic, UserUpdate
from ..security import create_access_token, hash_password, verify_password
from ..serializers import user_public

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    nickname = payload.nickname.strip()
    email = payload.email.lower()

    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    if await db.users.find_one({"nickname": nickname}):
        raise HTTPException(status_code=409, detail="Nickname already taken")

    doc = {
        "nickname": nickname,
        "email": email,
        "first_name": payload.first_name.strip(),
        "last_name": payload.last_name.strip(),
        "password_hash": hash_password(payload.password),
        "total_points": 0,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = await db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Email or nickname already in use")

    doc["_id"] = result.inserted_id
    token = create_access_token(str(result.inserted_id))
    return {"access_token": token, "user": user_public(doc)}


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]))
    return {"access_token": token, "user": user_public(user)}


@router.get("/me", response_model=UserPublic)
async def me(current_user: dict = Depends(get_current_user)):
    return user_public(current_user)


@router.patch("/me", response_model=UserPublic)
async def update_me(
    payload: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    updates: dict = {}

    if payload.nickname is not None:
        nickname = payload.nickname.strip()
        if nickname != current_user["nickname"]:
            existing = await db.users.find_one({"nickname": nickname})
            if existing and existing["_id"] != current_user["_id"]:
                raise HTTPException(status_code=409, detail="Nickname already taken")
            updates["nickname"] = nickname

    if payload.email is not None:
        email = payload.email.lower()
        if email != current_user["email"]:
            existing = await db.users.find_one({"email": email})
            if existing and existing["_id"] != current_user["_id"]:
                raise HTTPException(status_code=409, detail="Email already registered")
            updates["email"] = email

    if payload.first_name is not None:
        updates["first_name"] = payload.first_name.strip()
    if payload.last_name is not None:
        updates["last_name"] = payload.last_name.strip()

    if updates:
        try:
            await db.users.update_one(
                {"_id": current_user["_id"]}, {"$set": updates}
            )
        except DuplicateKeyError:
            raise HTTPException(status_code=409, detail="Email or nickname already in use")
        current_user = {**current_user, **updates}

    return user_public(current_user)

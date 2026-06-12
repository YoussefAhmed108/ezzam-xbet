from typing import Annotated

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..config import settings
from ..db import get_db
from ..deps import get_current_user
from ..schemas import UserPublic
from ..serializers import user_public

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB
EXT_MAP = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


def _r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


@router.post("/avatar", response_model=UserPublic)
async def upload_avatar(
    file: Annotated[UploadFile, File()],
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are accepted.")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Image must be smaller than 5 MB.")

    if not settings.r2_account_id or not settings.r2_public_url:
        raise HTTPException(status_code=503, detail="Avatar storage is not configured.")

    ext = EXT_MAP[file.content_type]
    user_id = str(current_user["_id"])
    key = f"profile-images/{user_id}.{ext}"

    try:
        _r2_client().put_object(
            Bucket=settings.r2_bucket_name,
            Key=key,
            Body=data,
            ContentType=file.content_type,
        )
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {exc}") from exc

    avatar_url = f"{settings.r2_public_url.rstrip('/')}/{key}"
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": {"avatar_url": avatar_url}})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return user_public(updated)

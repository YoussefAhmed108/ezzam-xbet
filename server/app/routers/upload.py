from typing import Annotated

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response

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


def _avatar_url(key: str) -> str:
    """Return the best public URL for an R2 object key.

    Prefers routing through the API proxy (works globally) over the r2.dev
    public URL (which has geographic access issues in some regions).
    """
    if settings.api_base_url:
        return f"{settings.api_base_url.rstrip('/')}/upload/proxy/{key}"
    return f"{settings.r2_public_url.rstrip('/')}/{key}"


@router.get("/proxy/{path:path}", include_in_schema=False)
async def proxy_r2_image(path: str):
    """Stream an R2 object through the API, bypassing r2.dev geographic restrictions.

    No auth required — images are public resources already visible in the UI.
    Responses are cached for 24 hours at the CDN / browser level.
    """
    if not settings.r2_account_id:
        raise HTTPException(status_code=503, detail="Storage not configured.")
    try:
        obj = _r2_client().get_object(Bucket=settings.r2_bucket_name, Key=path)
        data = obj["Body"].read()
        content_type = obj.get("ContentType", "application/octet-stream")
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        if code in ("NoSuchKey", "404"):
            raise HTTPException(status_code=404, detail="Image not found.") from exc
        raise HTTPException(status_code=502, detail="Storage error.") from exc
    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400, immutable"},
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

    if not settings.r2_account_id:
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

    url = _avatar_url(key)
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": {"avatar_url": url}})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return user_public(updated)

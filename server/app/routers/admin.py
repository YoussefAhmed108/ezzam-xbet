from fastapi import APIRouter, Depends, Header, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..config import settings
from ..db import get_db
from ..services.sync_service import sync_and_score

router = APIRouter(prefix="/admin", tags=["admin"])


def _check_admin(token: str | None) -> None:
    if not settings.admin_sync_token:
        raise HTTPException(
            status_code=403,
            detail="Admin sync is disabled. Set ADMIN_SYNC_TOKEN to enable.",
        )
    if token != settings.admin_sync_token:
        raise HTTPException(status_code=401, detail="Invalid admin token")


@router.post("/sync")
async def trigger_sync(
    x_admin_token: str | None = Header(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Manually trigger a fetch from the football API and rescore predictions."""
    _check_admin(x_admin_token)
    return await sync_and_score(db)

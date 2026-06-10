import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .config import settings
from .db import ensure_indexes, get_db
from .services.sync_service import sync_and_score

logger = logging.getLogger("scheduler")

scheduler = AsyncIOScheduler()


async def _job() -> None:
    try:
        await ensure_indexes()
        db = get_db()
        await sync_and_score(db)
    except Exception:  # noqa: BLE001 - keep the scheduler alive
        logger.exception("Scheduled sync failed")


def start_scheduler() -> None:
    interval = max(1, settings.score_sync_interval_minutes)
    scheduler.add_job(
        _job,
        trigger=IntervalTrigger(minutes=interval),
        id="sync_and_score",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        # Run once right away (don't wait a full interval) so stubs/results are
        # applied immediately after a restart.
        next_run_time=datetime.now(timezone.utc),
    )
    scheduler.start()
    logger.info("Scheduler started: syncing every %s minute(s)", interval)


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .config import settings

logger = logging.getLogger("db")


class Database:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None
    indexes_ready: bool = False


_state = Database()


def get_db() -> AsyncIOMotorDatabase:
    if _state.db is None:
        raise RuntimeError("Database is not initialized. Call connect_to_mongo first.")
    return _state.db


async def connect_to_mongo() -> None:
    # Construct the client (this does not block on the network; pymongo connects
    # lazily). Short timeouts so requests fail fast instead of hanging when the
    # network/DNS is flaky.
    _state.client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=8000,
        connectTimeoutMS=8000,
    )
    _state.db = _state.client[settings.mongodb_db]
    await ensure_indexes()


async def ensure_indexes() -> None:
    """Create indexes if not already done. Safe to call repeatedly.

    Does not raise on failure: if Mongo is unreachable (e.g. flaky DNS at
    startup), the server still boots and this is retried on the next sync.
    """
    if _state.indexes_ready or _state.db is None:
        return
    try:
        await _create_indexes(_state.db)
        _state.indexes_ready = True
        logger.info("Mongo indexes ensured.")
    except Exception as exc:  # noqa: BLE001 - stay up despite transient outages
        logger.warning(
            "Could not reach MongoDB at startup (%s). The server will keep "
            "running and retry on the next sync.",
            exc,
        )


async def close_mongo_connection() -> None:
    if _state.client is not None:
        _state.client.close()
        _state.client = None
        _state.db = None


async def _create_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.users.create_index("email", unique=True)
    await db.users.create_index("nickname", unique=True)
    await db.matches.create_index("external_id", unique=True)
    await db.matches.create_index("kickoff")
    await db.groups.create_index("invite_code", unique=True)
    await db.predictions.create_index(
        [("user_id", 1), ("match_id", 1)], unique=True
    )

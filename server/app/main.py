import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import close_mongo_connection, connect_to_mongo
from .routers import admin, auth, groups, matches, predictions
from .scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    start_scheduler()
    try:
        yield
    finally:
        stop_scheduler()
        await close_mongo_connection()


app = FastAPI(title="World Cup 2026 Predictions API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    # Also allow localhost and any LAN IP (any port) so the dev frontend works
    # regardless of which network/IP the machine is on.
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|(\d{1,3}\.){3}\d{1,3})(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(matches.router)
app.include_router(predictions.router)
app.include_router(groups.router)
app.include_router(admin.router)

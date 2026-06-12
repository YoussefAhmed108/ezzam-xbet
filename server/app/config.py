from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Database
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "worldcup2026"

    # Auth
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days

    # CORS
    cors_origins: str = "http://localhost:5173"

    # Football data API
    football_api_provider: str = "football-data"
    football_api_key: str = ""
    football_api_competition: str = "WC"
    football_api_season: str = "2026"

    # Scoring / scheduling
    score_sync_interval_minutes: int = 15
    prediction_lock_hours: int = 2

    # Cloudflare R2 (S3-compatible) — used for avatar uploads
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "ezzam-xbet"
    r2_public_url: str = ""  # e.g. https://pub-xxxx.r2.dev or custom domain

    # Public base URL of this API server (used to build proxy image URLs).
    # Set to e.g. https://your-api.railway.app — leave blank to fall back to r2_public_url.
    api_base_url: str = ""

    # Admin
    admin_sync_token: str = ""

    # Testing: force the Mexico vs South Africa match to a finished 2-1 result
    # so scoring/settlement can be exercised without a real finished fixture.
    test_force_match_result: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

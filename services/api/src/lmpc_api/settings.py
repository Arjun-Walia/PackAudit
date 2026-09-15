from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://lmpc:lmpc@localhost:5432/lmpc"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-me-in-deploy"
    feature_listings: bool = False
    feature_dashboard: bool = True
    feature_packer_sandbox: bool = False
    feature_watchlist: bool = False
    feature_offline_queue: bool = False
    feature_dual_mrp: bool = False
    feature_vlm_fallback: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()

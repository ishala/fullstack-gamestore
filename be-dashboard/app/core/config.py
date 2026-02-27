from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    PROJECT_NAME: str = "Game Store API"
    DESCRIPTION: str = "Backend for Game Store Dashboard"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    RAWG_BASE: str = "https://api.rawg.io/api"
    RAWG_API_KEY: str
    CHEAPSHARK_BASE: str = "https://www.cheapshark.com/api/1.0"
    DATABASE_URL: str

    REDIS_URL: str

    ENVIRONMENT: str = "dev"
    class Config:
        env_file = (
            Path(__file__).resolve().parents[3] / ".env",
            Path(__file__).resolve().parents[2] / ".env",
        )
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
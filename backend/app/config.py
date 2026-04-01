import logging
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

_cfg_logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mysql+aiomysql://aaie_user:aaie_pass@db:3306/aaie"
    DATABASE_SSL_REQUIRED: bool = False
    DATABASE_SSL_CA_PATH: Optional[str] = None

    # JWT
    SECRET_KEY: str = "changeme-strong-random-secret-key-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Gemini
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # App
    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    CORS_ORIGIN_REGEX: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    s = Settings()
    if s.SECRET_KEY == "changeme-strong-random-secret-key-32chars":
        _cfg_logger.warning(
            "SECURITY WARNING: Using the default SECRET_KEY. "
            "Set a strong SECRET_KEY in your .env file before deploying to production!"
        )
    return s

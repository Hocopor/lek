from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_PASSWORD: str = "changeme"
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DATABASE_URL: str = "sqlite:///./data.db"
    UPLOAD_DIR: str = "./uploads"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

# Find the root .env file (one level up from agents/)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    # API Configuration
    api_base_url: str = "http://localhost:3001"
    api_token: str = ""

    # AI Model Configuration
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # Default model for each agent
    ocr_model: str = "claude-3-5-sonnet-20241022"  # Vision capable
    communication_model: str = "gpt-4o"
    status_model: str = "claude-3-5-haiku-20241022"  # Fast and cheap

    # Firebase Configuration
    firebase_project_id: str = ""
    google_application_credentials: str = ""

    # Document processing
    max_file_size_mb: int = 10
    supported_formats: list[str] = ["pdf", "jpg", "jpeg", "png"]

    # Communication settings
    email_sender: str = "noreply@gordonullencpa.com"
    sms_sender: str = ""

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

"""
SpecForge AI — 統一設定管理
使用 pydantic-settings 從 .env 讀取所有環境變數
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """應用程式設定，自動從 .env 讀取"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # === JWT 認證 ===
    jwt_secret_key: str = "your-secret-key-change-this"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 小時

    # === SQLite 資料庫 ===
    database_url: str = "sqlite+aiosqlite:///./data/specforge.db"

    # === LLM 供應商設定 ===
    llm_provider: str = "ollama"
    llm_model: str = "gemma4:31b-cloud"

    # Ollama
    ollama_base_url: str = "http://localhost:11434/v1"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4"

    # Google Gemini
    google_api_key: str = ""
    google_model: str = "gemini-pro"

    # OpenRouter
    openrouter_api_key: str = ""
    openrouter_model: str = ""

    # Nvidia
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = ""

    # Custom (公司內部 / 自訂 LLM Server)
    custom_llm_name: str = "Custom-LLM"
    custom_llm_base_url: str = ""
    custom_llm_api_key: str = ""
    custom_llm_model: str = ""

    # === 應用設定 ===
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_debug: bool = True
    default_language: str = "zh-TW"


@lru_cache()
def get_settings() -> Settings:
    """取得設定實例（快取，整個應用生命週期只建立一次）"""
    return Settings()

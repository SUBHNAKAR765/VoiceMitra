from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    tts_engine: str = "gtts"
    whisper_model: str = "base"
    audio_dir: str = "audio_files"

    @property
    def audio_dir_abs(self) -> str:
        import os
        return os.path.abspath(self.audio_dir)
    max_history: int = 50
    ffmpeg_dir: str = ""

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

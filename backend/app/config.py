from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    tts_engine: str = "gtts"
    whisper_model: str = "base"
    audio_dir: str = "audio_files"
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "EXAVITQu4vr4xnSDxMaL"
    max_history: int = 50
    ffmpeg_dir: str = ""

    # Database — individual vars (local / Aiven / PlanetScale)
    db_host: str = "localhost"
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "voicemitra"
    db_port: int = 3306

    # Railway injects this automatically when MySQL plugin is added
    database_url: str = ""
    mysql_url: str = ""  # Railway also injects as MYSQL_URL

    @property
    def resolved_database_url(self) -> str:
        return self.database_url or self.mysql_url

    @property
    def audio_dir_abs(self) -> str:
        import os
        return os.path.abspath(self.audio_dir)

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

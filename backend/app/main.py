import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes.assistant import router
from app.routes.youtube import router as youtube_router
from app.routes.auth import router as auth_router
from app.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(title="VoiceMitra AI Voice Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure audio directory exists
os.makedirs(settings.audio_dir_abs, exist_ok=True)
app.mount("/audio", StaticFiles(directory=settings.audio_dir_abs), name="audio")

app.include_router(router, prefix="/api")
app.include_router(youtube_router, prefix="/api")
app.include_router(auth_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Welcome to VoiceMitra API",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

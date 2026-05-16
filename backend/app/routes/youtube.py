import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.youtube_service import transcribe_youtube, validate_youtube_url

router = APIRouter()
logger = logging.getLogger(__name__)


class YoutubeRequest(BaseModel):
    url: str


@router.post("/youtube/transcribe")
async def youtube_transcribe(req: YoutubeRequest):
    url = req.url.strip()

    if not validate_youtube_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.")

    try:
        segments = transcribe_youtube(url)
        full_text = " ".join(s["text"] for s in segments)
        return {
            "segments": segments,
            "full_text": full_text,
            "segment_count": len(segments),
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        logger.error(f"YouTube transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Transcription failed. Please try again.")

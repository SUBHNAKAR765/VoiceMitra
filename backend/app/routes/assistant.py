import os
import uuid
import tempfile
import logging
from collections import deque
from datetime import datetime
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import get_settings
from app.models.schemas import ChatMessage, VoiceQueryResponse, TextQueryRequest
from app.services.stt_service import transcribe_audio
from app.services.tts_service import synthesize_speech
from app.services.moderation_service import is_safe, get_refusal
from app.services.intent_service import classify_intent
from app.services.weather_service import get_weather
from app.services.news_service import get_news
from app.services.wiki_service import get_wiki_summary
from app.services.search_service import web_search
from app.services.groq_service import ask_groq

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

_history: deque = deque(maxlen=settings.max_history)


async def _process_text_query(transcript: str) -> VoiceQueryResponse:
    # 2. Moderation
    moderated = not is_safe(transcript)
    if moderated:
        response_text = get_refusal()
        intent = "blocked"
    else:
        # 3. Classify intent
        intent = classify_intent(transcript)

        # 4. Fetch raw context data for structured intents
        context = _fetch_context(intent, transcript)

        # 5. Build conversation history for Groq (user/assistant pairs only)
        history = _build_groq_history()

        # 6. Groq generates the final natural response
        response_text = ask_groq(
            user_query=transcript,
            context=context,
            conversation_history=history,
        )

    # 7. TTS
    audio_filename = await synthesize_speech(response_text)
    audio_url = f"/audio/{audio_filename}"

    # 8. Save to history
    now = datetime.utcnow()
    _history.append(ChatMessage(
        id=uuid.uuid4().hex, role="user", content=transcript, timestamp=now
    ))
    _history.append(ChatMessage(
        id=uuid.uuid4().hex, role="assistant", content=response_text,
        timestamp=now, audio_url=audio_url
    ))

    return VoiceQueryResponse(
        transcript=transcript,
        response=response_text,
        audio_url=audio_url,
        intent=intent,
        moderated=moderated,
    )


@router.post("/voice-query", response_model=VoiceQueryResponse)
async def voice_query(audio: UploadFile = File(...)):
    suffix = _get_suffix(audio.filename or "audio.webm")
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        # 1. Speech-to-text
        try:
            transcript = transcribe_audio(tmp_path, settings.whisper_model)
        except (ValueError, RuntimeError) as e:
            raise HTTPException(status_code=422, detail=str(e))

        return await _process_text_query(transcript)
    finally:
        os.unlink(tmp_path)


@router.post("/text-query", response_model=VoiceQueryResponse)
async def text_query(req: TextQueryRequest):
    return await _process_text_query(req.text)


@router.get("/history", response_model=List[ChatMessage])
async def get_history():
    return list(_history)


@router.delete("/history")
async def clear_history():
    _history.clear()
    return {"message": "History cleared"}


def _fetch_context(intent: str, query: str) -> str:
    """
    Fetch raw factual data for structured intents.
    For general queries, search the web + Wikipedia.
    Returns empty string for greetings/time/date (Groq handles those from knowledge).
    """
    try:
        if intent == "weather":
            return get_weather(query)
        if intent == "news":
            return get_news(query)
        if intent in ("time", "date", "greeting"):
            # Provide current time/date as context so Groq answers accurately
            now = datetime.now()
            return f"Current date and time: {now.strftime('%A, %B %d, %Y at %I:%M %p')}"
        if intent == "search":
            # Try Wikipedia first, supplement with web search
            wiki = get_wiki_summary(query)
            wiki_ok = wiki and not wiki.startswith("I couldn't") and not wiki.startswith("I'm not sure")
            web = web_search(query)
            if wiki_ok:
                return f"Wikipedia: {wiki}\n\nWeb search: {web}"
            return f"Web search results: {web}"
    except Exception as e:
        logger.error(f"Context fetch error for intent={intent}: {e}")
    return ""


def _build_groq_history() -> list[dict]:
    """Convert stored ChatMessage history to Groq message format."""
    return [
        {"role": msg.role, "content": msg.content}
        for msg in _history
        if msg.role in ("user", "assistant")
    ]


def _get_suffix(filename: str) -> str:
    ext = os.path.splitext(filename)[-1].lower()
    return ext if ext else ".webm"

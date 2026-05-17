import os
import uuid
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def synthesize_speech(text: str, language: str = "en") -> str:
    """Generate TTS audio, return filename (not full path)."""
    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(settings.audio_dir_abs, filename)

    engine = settings.tts_engine.lower()

    if engine == "elevenlabs":
        return await _elevenlabs_synthesize(text, filepath, filename)
    elif engine == "edge":
        return await _edge_synthesize(text, filepath, filename, language)
    elif engine == "gtts":
        return _gtts_synthesize(text, filepath, filename, language)
    return _pyttsx3_synthesize(text, filepath, filename)


async def _elevenlabs_synthesize(text: str, filepath: str, filename: str) -> str:
    import httpx
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}"
    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.30, "similarity_boost": 0.95, "style": 0.60, "use_speaker_boost": True},
        "speed": 0.60,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
    with open(filepath, "wb") as f:
        f.write(response.content)
    return filename


def _gtts_synthesize(text: str, filepath: str, filename: str, language: str = "en") -> str:
    from gtts import gTTS
    tts = gTTS(text=text, lang=language, slow=False)
    tts.save(filepath)
    return filename


def _pyttsx3_synthesize(text: str, filepath: str, filename: str, language: str = "en") -> str:
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty("rate", 175)
        engine.setProperty("volume", 1.0)
        engine.save_to_file(text, filepath)
        engine.runAndWait()
        return filename
    except Exception:
        return _gtts_synthesize(text, filepath, filename, language)


EDGE_VOICES = {
    "en": "en-IN-NeerjaNeural",
    "hi": "hi-IN-SwaraNeural",
    "es": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "de": "de-DE-KatjaNeural",
    "ar": "ar-SA-ZariyahNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
    "pt": "pt-BR-FranciscaNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "it": "it-IT-ElsaNeural",
    "gu": "gu-IN-DhwaniNeural",
    "ta": "ta-IN-PallaviNeural",
    "te": "te-IN-ShrutiNeural",
    "bn": "bn-IN-TanishaaNeural",
}


async def _edge_synthesize(text: str, filepath: str, filename: str, language: str = "en") -> str:
    import edge_tts
    voice = EDGE_VOICES.get(language, EDGE_VOICES["en"])
    communicate = edge_tts.Communicate(text, voice, rate="-5%", pitch="+0Hz", volume="+0%")
    await communicate.save(filepath)
    return filename


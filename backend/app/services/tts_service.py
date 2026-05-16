import os
import uuid
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def synthesize_speech(text: str) -> str:
    """Generate TTS audio, return filename (not full path)."""
    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(settings.audio_dir_abs, filename)

    engine = settings.tts_engine.lower()

    if engine == "gtts":
        return _gtts_synthesize(text, filepath, filename)
    return _pyttsx3_synthesize(text, filepath, filename)


def _gtts_synthesize(text: str, filepath: str, filename: str) -> str:
    from gtts import gTTS
    tts = gTTS(text=text, lang="en", slow=False)
    tts.save(filepath)
    return filename


def _pyttsx3_synthesize(text: str, filepath: str, filename: str) -> str:
    import pyttsx3
    engine = pyttsx3.init()
    engine.setProperty("rate", 175)
    engine.setProperty("volume", 1.0)
    engine.save_to_file(text, filepath)
    engine.runAndWait()
    return filename

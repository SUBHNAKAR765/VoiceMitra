import logging
from faster_whisper import WhisperModel
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_whisper_model: WhisperModel = None


def _get_whisper_model(model_name: str = "base") -> WhisperModel:
    global _whisper_model
    if _whisper_model is None:
        logger.info(f"Loading faster-whisper model ({model_name})...")
        _whisper_model = WhisperModel(model_name, device="cpu", compute_type="int8")
    return _whisper_model


def transcribe_audio(audio_path: str, model_name: str = "base") -> str:
    return _transcribe_whisper(audio_path, model_name)


def _transcribe_whisper(audio_path: str, model_name: str) -> str:
    model = _get_whisper_model(model_name)
    segments, _ = model.transcribe(audio_path, beam_size=5, vad_filter=True)
    text = " ".join(seg.text.strip() for seg in segments).strip()
    if not text:
        raise ValueError("No speech detected in audio")
    return text


import os
import re
import tempfile
import logging
import subprocess
from typing import List
from faster_whisper import WhisperModel
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

FFMPEG_DIR = settings.ffmpeg_dir or ""

_model: WhisperModel = None


def _get_model() -> WhisperModel:
    global _model
    if _model is None:
        logger.info("Loading faster-whisper model (tiny)...")
        _model = WhisperModel("tiny", device="cpu", compute_type="int8")
    return _model


def validate_youtube_url(url: str) -> bool:
    pattern = r"(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[\w\-]+"
    return bool(re.match(pattern, url.strip()))


def download_audio(url: str, output_dir: str) -> str:
    out_template = os.path.join(output_dir, "audio.%(ext)s")
    cmd = [
        "yt-dlp",
        "--no-playlist",
        "--extract-audio",
        "--audio-format", "wav",
        "--audio-quality", "0",
        "--output", out_template,
        "--no-warnings",
        url,
    ]
    if FFMPEG_DIR:
        cmd += ["--ffmpeg-location", FFMPEG_DIR]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp failed: {result.stderr.strip()}")

    wav_path = os.path.join(output_dir, "audio.wav")
    if os.path.exists(wav_path):
        return wav_path

    # Find whatever audio file was created
    for f in os.listdir(output_dir):
        if f.startswith("audio."):
            return os.path.join(output_dir, f)

    raise RuntimeError("Audio file not found after download")


def transcribe_youtube(url: str) -> List[dict]:
    if not validate_youtube_url(url):
        raise ValueError("Invalid YouTube URL")

    with tempfile.TemporaryDirectory() as tmpdir:
        logger.info(f"Downloading audio: {url}")
        audio_path = download_audio(url, tmpdir)

        logger.info("Transcribing with faster-whisper...")
        model = _get_model()
        segments, _ = model.transcribe(
            audio_path,
            beam_size=5,
            word_timestamps=False,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500},
        )

        result = [
            {"start": round(seg.start, 2), "end": round(seg.end, 2), "text": seg.text.strip()}
            for seg in segments
        ]

        if not result:
            raise ValueError("No speech detected in the video")

        return result

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ChatMessage(BaseModel):
    id: str
    role: str  # "user" | "assistant"
    content: str
    timestamp: datetime
    audio_url: Optional[str] = None
    video_url: Optional[str] = None


class VoiceQueryResponse(BaseModel):
    transcript: str
    response: str
    audio_url: str
    video_url: Optional[str] = None
    intent: str
    moderated: bool = False

class TextQueryRequest(BaseModel):
    text: str
    language: str = "en"

class YoutubeTranscriptRequest(BaseModel):
    url: str

class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str

class YoutubeTranscriptResponse(BaseModel):
    title: str
    segments: list[TranscriptSegment]
    full_text: str

class LoginRequest(BaseModel):
    username: str # Can be username or roll number
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    email: str
    roll_number: Optional[str] = None

class RegisterRequest(BaseModel):
    name: str
    email: str
    username: str
    roll_number: Optional[str] = None
    password: str



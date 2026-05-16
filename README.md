# VoiceMitra — AI Voice Assistant

A full-stack AI-powered voice assistant web application built for CGU students. Users can speak or type queries and receive intelligent, spoken responses powered by Groq LLM, with features like weather lookup, news, web search, YouTube transcription, and student authentication.

---

## Table of Contents

1. [What the App Does](#what-the-app-does)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Backend — Deep Dive](#backend--deep-dive)
6. [Frontend — Deep Dive](#frontend--deep-dive)
7. [Database](#database)
8. [How a Voice Query Works (End-to-End Flow)](#how-a-voice-query-works-end-to-end-flow)
9. [API Reference](#api-reference)
10. [Environment Variables](#environment-variables)
11. [Running the App Locally](#running-the-app-locally)
12. [Key Design Decisions](#key-design-decisions)

---

## What the App Does

VoiceMitra lets a user:

- **Speak into the microphone** — the browser captures speech in real time using the Web Speech API
- **Ask questions by text** — a text input fallback is also available
- **Get an AI-generated spoken response** — Groq LLM (LLaMA 3.3 70B) generates a natural, conversational answer
- **Hear the response played back** — gTTS or pyttsx3 converts the answer to an MP3 and plays it in the browser
- **Transcribe any YouTube video** — paste a URL and get a full timestamped transcript
- **Log in / Register** — CGU student accounts stored in MySQL, authenticated with bcrypt-hashed passwords

---

## Tech Stack

| Layer        | Technology                                                   |
|--------------|--------------------------------------------------------------|
| Frontend     | React 18, Vite, TailwindCSS, Framer Motion                   |
| State Mgmt   | Zustand (with localStorage persistence)                      |
| Backend      | FastAPI, Uvicorn, Python 3.11                                |
| LLM          | Groq API — LLaMA 3.3 70B Versatile                          |
| STT          | faster-whisper (OpenAI Whisper, runs locally on CPU)         |
| Browser STT  | Web Speech API (SpeechRecognition)                           |
| TTS          | gTTS (Google Text-to-Speech) / pyttsx3 (offline fallback)   |
| Web Search   | DuckDuckGo Search (no API key needed)                        |
| YouTube      | yt-dlp (audio download) + faster-whisper (transcription)    |
| Database     | MySQL 8.4 (schema: `voicemitra`, table: `students`)          |
| Auth         | bcrypt password hashing                                      |
| HTTP Client  | Axios                                                        |

---

## Architecture Overview

```
Browser (React)
    │
    │  HTTP / multipart form
    ▼
FastAPI Backend (port 8000)
    │
    ├── /api/voice-query   ← audio file upload
    ├── /api/text-query    ← plain text
    ├── /api/history       ← conversation history
    ├── /api/login         ← student auth
    ├── /api/register      ← student registration
    └── /api/youtube/transcribe ← YouTube URL
    │
    ├── faster-whisper     (local STT — audio → text)
    ├── Intent Classifier  (regex-based routing)
    ├── Moderation         (keyword blocklist)
    ├── Context Fetchers   (weather, news, wiki, web search)
    ├── Groq LLM           (generates final natural response)
    ├── gTTS / pyttsx3     (text → MP3 file)
    └── MySQL              (student accounts)
```

---

## Project Structure

```
VoiceMitra/
├── backend/
│   ├── app/
│   │   ├── main.py                  ← FastAPI app, CORS, routes registration
│   │   ├── config.py                ← Settings loaded from .env via pydantic-settings
│   │   ├── models/
│   │   │   └── schemas.py           ← Pydantic request/response models
│   │   ├── routes/
│   │   │   ├── assistant.py         ← /voice-query, /text-query, /history
│   │   │   ├── auth.py              ← /login, /register
│   │   │   └── youtube.py           ← /youtube/transcribe
│   │   └── services/
│   │       ├── stt_service.py       ← faster-whisper transcription
│   │       ├── tts_service.py       ← gTTS / pyttsx3 speech synthesis
│   │       ├── groq_service.py      ← Groq LLM API calls
│   │       ├── intent_service.py    ← regex intent classifier
│   │       ├── moderation_service.py← keyword-based content filter
│   │       ├── weather_service.py   ← weather via DuckDuckGo search
│   │       ├── news_service.py      ← news via DuckDuckGo search
│   │       ├── wiki_service.py      ← Wikipedia REST API
│   │       ├── search_service.py    ← DuckDuckGo web search
│   │       ├── youtube_service.py   ← yt-dlp + faster-whisper
│   │       └── db_service.py        ← MySQL connection
│   ├── audio_files/                 ← generated MP3 responses (served as static files)
│   ├── seed_students.py             ← one-time script to populate DB from CGUStudentsData.txt
│   ├── CGUStudentsData.txt          ← tab-separated student data (Name, Roll Number, Email)
│   ├── requirements.txt
│   ├── .env                         ← secrets (not committed)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  ← route definitions
│   │   ├── api/client.js            ← all Axios API calls
│   │   ├── store/useAppStore.js     ← Zustand global state
│   │   ├── hooks/useSpeech.js       ← Web Speech API + silence detection
│   │   ├── components/
│   │   │   ├── Layout.jsx           ← sidebar + main content wrapper
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ChatPanel.jsx        ← renders message bubbles
│   │   │   ├── MicButton.jsx        ← animated record button
│   │   │   ├── PlayPauseButton.jsx  ← audio playback control
│   │   │   ├── Waveform.jsx         ← WaveSurfer.js audio visualizer
│   │   │   ├── Toast.jsx            ← notification toasts
│   │   │   └── ParticleBackground.jsx
│   │   └── pages/
│   │       ├── Home.jsx             ← landing / quick-start page
│   │       ├── Assistant.jsx        ← main voice/text chat interface
│   │       ├── Youtube.jsx          ← YouTube transcriber
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Profile.jsx
│   │       └── Settings.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── docker-compose.yml
```

---

## Backend — Deep Dive

### `main.py`
- Creates the FastAPI app titled **"VoiceMitra AI Voice Assistant API"**
- Adds CORS middleware (allows all origins — suitable for development)
- Mounts the `audio_files/` directory as a static file server at `/audio` so the frontend can stream MP3s
- Registers three routers under the `/api` prefix: `assistant`, `youtube`, `auth`
- Exposes a `GET /health` endpoint returning `{ "status": "ok", "version": "1.0.0" }`

### `config.py`
- Uses `pydantic-settings` to load all config from `.env`
- Key settings: `GROQ_API_KEY`, `GROQ_MODEL`, `TTS_ENGINE`, `WHISPER_MODEL`, `AUDIO_DIR`, `MAX_HISTORY`, `FFMPEG_DIR`
- Cached with `@lru_cache()` so the `.env` file is only read once

### `routes/assistant.py` — Core Logic
Handles the main query pipeline:

1. **`POST /api/voice-query`** — accepts an audio file upload (webm/wav/mp3), saves it to a temp file, runs STT, then calls `_process_text_query`
2. **`POST /api/text-query`** — accepts `{ "text": "..." }` directly, skips STT
3. **`GET /api/history`** — returns the in-memory conversation deque (max 50 messages)
4. **`DELETE /api/history`** — clears the deque

The `_process_text_query` pipeline:
```
transcript → moderation check → intent classification → context fetch → Groq LLM → TTS → save to history
```

### `routes/auth.py`
- **`POST /api/login`** — accepts `username` (can be username, roll number, or email), verifies bcrypt hash, returns user object
- **`POST /api/register`** — checks for duplicate username/email/roll number, hashes password with bcrypt, inserts new student

### `routes/youtube.py`
- **`POST /api/youtube/transcribe`** — validates the YouTube URL, calls `transcribe_youtube()`, returns segments with timestamps + full text

---

### Services

#### `stt_service.py` — Speech-to-Text
- Uses **faster-whisper** (optimized Whisper running on CPU with int8 quantization)
- Model is lazy-loaded once and reused (singleton pattern with a global variable)
- `beam_size=5` and `vad_filter=True` (Voice Activity Detection filters out silence)
- Raises `ValueError` if no speech is detected

#### `tts_service.py` — Text-to-Speech
- Generates a UUID-named `.mp3` file in `audio_files/`
- **gTTS** (default): calls Google's TTS API, saves MP3
- **pyttsx3** (offline fallback): uses system TTS engine, speech rate 175 wpm
- Returns just the filename; the URL is constructed as `/audio/<filename>`

#### `groq_service.py` — LLM
- Calls **Groq API** with model `llama-3.3-70b-versatile`
- System prompt instructs the model to respond like a voice assistant: concise, no markdown, plain spoken text, under 3 sentences
- Injects up to the last 6 conversation turns for context continuity
- If factual context (weather data, search results) is available, it's prepended to the user message
- `max_tokens=300`, `temperature=0.7`
- Falls back to returning the raw context snippet if Groq is unavailable

#### `intent_service.py` — Intent Classification
- Pure regex-based classifier (no ML model needed, fast and deterministic)
- Intents: `greeting`, `weather`, `news`, `time`, `date`, `search` (default/fallback)
- Everything that doesn't match a specific pattern routes to `search`

#### `moderation_service.py` — Content Filter
- Keyword blocklist approach — checks for harmful/inappropriate words
- `is_safe()` returns `False` if any blocked keyword is found in the cleaned text
- Blocked queries get a polite refusal response without calling Groq

#### `weather_service.py`
- Extracts city name from the query using regex patterns
- Constructs a search query like `"current weather London temperature today"`
- Delegates to `search_service.py` (DuckDuckGo) — no OpenWeatherMap API key needed

#### `news_service.py`
- Constructs `"latest news <topic>"` or `"top news headlines today"`
- Delegates to `search_service.py`

#### `search_service.py` — Web Search
- Uses **DuckDuckGo Search** (`duckduckgo-search` library) — completely free, no API key
- Fetches top 5 results, picks the longest snippet from the top 3
- Trims to 450 characters at a natural sentence boundary

#### `youtube_service.py`
- Validates YouTube URL with regex
- Uses **yt-dlp** to download audio as WAV to a temp directory
- Runs **faster-whisper** (tiny model for speed) with `word_timestamps=False` and VAD
- Returns list of `{ start, end, text }` segment dicts

#### `db_service.py`
- Simple MySQL connector wrapper
- `get_db_connection()` returns a connection or `None` on failure
- Connects to `voicemitra` database on `localhost` as `root`

---

## Frontend — Deep Dive

### `App.jsx` — Routing
- Uses React Router v6
- Public routes: `/login`, `/register`
- Protected routes wrapped in `<Layout>`: `/` (Home), `/assistant`, `/youtube`, `/settings`, `/profile`
- `<AnimatePresence>` from Framer Motion enables page transition animations

### `store/useAppStore.js` — Global State (Zustand)
Persisted to `localStorage` under key `voicemitra-store`:
- `user` — logged-in student object (`id`, `name`, `username`, `email`, `roll_number`)
- `messages` — full chat history array
- `settings` — TTS engine, Whisper model, Groq API key, Groq model

Not persisted (runtime only):
- `isRecording`, `isLoading` — UI state flags
- `toasts` — notification queue (auto-dismissed after 4 seconds)

### `api/client.js` — API Layer
All backend calls go through a single Axios instance with `baseURL: '/api'`:
- `sendVoiceQuery(audioBlob)` — multipart form POST with audio file
- `sendTextQuery(text)` — POST `{ text }`
- `fetchHistory()` / `clearHistory()`
- `transcribeYoutube(url)`
- `login(username, password)` / `register(userData)`

### `hooks/useSpeech.js` — Voice Recording
- Uses the browser's **Web Speech API** (`SpeechRecognition`) for live transcription
- Captures the microphone stream via `getUserMedia` for silence detection
- **Silence detection**: uses `AudioContext` + `AnalyserNode` to monitor audio amplitude every animation frame. If amplitude stays below threshold (10/255) for 2 seconds, recording auto-stops
- Returns `{ start, stop, liveText }` — `liveText` updates in real time as the user speaks

### `pages/Assistant.jsx` — Main Chat Interface
The core page of the app:
- **Mic button** → calls `useSpeech.start()` → on silence or manual stop → calls `useSpeech.stop()` → gets transcript → calls `sendTextQuery()`
- Displays live transcript while recording
- Auto-plays the MP3 response from the backend
- **Waveform** (WaveSurfer.js) visualizes the audio response
- **Play/Pause button** to replay the last response
- **Clear** button wipes local messages + calls `DELETE /api/history`
- **Download** button exports the full conversation as a `.txt` file

### `pages/Youtube.jsx` — YouTube Transcriber
- User pastes a YouTube URL and clicks Transcribe
- Shows animated loading steps: "Downloading audio...", "Processing with Faster-Whisper...", "Generating timestamps..."
- Displays results as a scrollable list of timestamped segments
- Search bar to filter segments by keyword
- Export options: Copy All, Download as TXT, Download as SRT subtitle file

### `pages/Login.jsx` / `Register.jsx`
- Login accepts username, roll number, or email
- On success, stores user object in Zustand store (persisted to localStorage)
- Glassmorphism card UI with animated background blobs

---

## Database

**Schema:** `voicemitra`  
**Table:** `students`

| Column       | Type          | Notes                          |
|--------------|---------------|--------------------------------|
| `id`         | INT PK AI     | Auto-increment                 |
| `name`       | VARCHAR(150)  | Full name                      |
| `roll_number`| VARCHAR(20)   | Unique, used as login ID       |
| `username`   | VARCHAR(20)   | Unique (defaults to roll number)|
| `email`      | VARCHAR(150)  | Unique                         |
| `password`   | VARCHAR(255)  | bcrypt hash                    |
| `created_at` | TIMESTAMP     | Auto-set on insert             |

**Seeding:** `seed_students.py` reads `CGUStudentsData.txt` (tab-separated: Name, Roll Number, Email), hashes a default password (`Student@123`), and bulk-inserts all 493 CGU students.

---

## How a Voice Query Works (End-to-End Flow)

```
1. User clicks mic button in browser
2. Web Speech API starts capturing speech → live transcript shown on screen
3. After 2 seconds of silence, recording auto-stops
4. Frontend calls POST /api/text-query with the transcript text
5. Backend: moderation check (keyword filter)
   └── if unsafe → return polite refusal
6. Backend: intent classification (regex)
   └── greeting / weather / news / time / date / search
7. Backend: fetch context data
   └── weather → DuckDuckGo search "current weather <city>"
   └── news    → DuckDuckGo search "latest news"
   └── search  → Wikipedia + DuckDuckGo top snippets
   └── time/date → current datetime string
8. Backend: call Groq LLM (LLaMA 3.3 70B)
   └── system prompt + last 6 conversation turns + context + user query
   └── returns concise spoken-style response (max 300 tokens)
9. Backend: gTTS converts response text → UUID.mp3 saved to audio_files/
10. Backend: returns { transcript, response, audio_url, intent, moderated }
11. Frontend: adds messages to chat, auto-plays the MP3
12. WaveSurfer.js renders the audio waveform
```

---

## API Reference

### `POST /api/voice-query`
Upload audio file, get AI response.

**Request:** `multipart/form-data` — field `audio` (webm/wav/mp3)

**Response:**
```json
{
  "transcript": "What is the weather in Mumbai?",
  "response": "It's currently 32°C and partly cloudy in Mumbai.",
  "audio_url": "/audio/abc123.mp3",
  "intent": "weather",
  "moderated": false
}
```

### `POST /api/text-query`
Same as voice-query but accepts text directly.

**Request:** `{ "text": "What time is it?" }`

### `GET /api/history`
Returns array of `ChatMessage` objects (up to 50).

### `DELETE /api/history`
Clears conversation history. Returns `{ "message": "History cleared" }`.

### `POST /api/login`
**Request:** `{ "username": "CGU001", "password": "Student@123" }`  
Username can be roll number, username, or email.

**Response:** `{ "id": 1, "name": "...", "username": "...", "email": "...", "roll_number": "..." }`

### `POST /api/register`
**Request:** `{ "name": "...", "email": "...", "username": "...", "roll_number": "...", "password": "..." }`

### `POST /api/youtube/transcribe`
**Request:** `{ "url": "https://www.youtube.com/watch?v=..." }`

**Response:**
```json
{
  "segments": [{ "start": 0.0, "end": 3.5, "text": "Hello everyone..." }],
  "full_text": "Hello everyone...",
  "segment_count": 42
}
```

### `GET /health`
Returns `{ "status": "ok", "version": "1.0.0" }`.

---

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

| Variable          | Description                                   | Default                    |
|-------------------|-----------------------------------------------|----------------------------|
| `GROQ_API_KEY`    | Groq API key (get from console.groq.com)      | required                   |
| `GROQ_MODEL`      | Groq model name                               | `llama-3.3-70b-versatile`  |
| `TTS_ENGINE`      | `gtts` (online) or `pyttsx3` (offline)        | `gtts`                     |
| `WHISPER_MODEL`   | `tiny`, `base`, `small`, `medium`             | `base`                     |
| `AUDIO_DIR`       | Folder for generated MP3 files                | `audio_files`              |
| `MAX_HISTORY`     | Max messages kept in memory                   | `50`                       |
| `FFMPEG_DIR`      | Path to ffmpeg bin (required for yt-dlp)      | (auto-detected if on PATH) |

---

## Running the App Locally

### Prerequisites
- Python 3.11+
- Node.js 20+
- MySQL 8.x running locally
- ffmpeg installed (required by yt-dlp for YouTube feature)

### 1. Backend Setup

```bash
cd backend

python -m venv venv
venv\Scripts\activate          # Windows

pip install -r requirements.txt

copy .env.example .env
# Edit .env — add your GROQ_API_KEY and FFMPEG_DIR
```

### 2. Database Setup

```bash
# Run once to create the voicemitra DB and seed all 493 students
python seed_students.py
```

### 3. Run Backend

```bash
uvicorn app.main:app --reload --port 8000
```

API available at: http://localhost:8000  
Swagger docs at: http://localhost:8000/docs

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend at: http://localhost:5173

> Vite proxies `/api` and `/audio` requests to `http://localhost:8000` automatically.

---

## Key Design Decisions

**Why Groq instead of OpenAI?**  
Groq provides extremely fast inference (LLaMA 3.3 70B) with a generous free tier — ideal for a real-time voice assistant where response latency matters.

**Why faster-whisper instead of the original Whisper?**  
faster-whisper uses CTranslate2 under the hood, making it 4x faster and using less memory than the original OpenAI Whisper while producing identical accuracy. It runs on CPU with int8 quantization.

**Why DuckDuckGo for weather/news instead of dedicated APIs?**  
No API key required, no rate limits for moderate usage, and the results are current. The Groq LLM then synthesizes the raw search snippets into a natural spoken response.

**Why Web Speech API for browser STT instead of sending audio to Whisper?**  
The Web Speech API gives instant live transcription with zero latency — the user sees their words appear as they speak. Whisper is used for the YouTube transcription feature where accuracy and timestamps matter more than speed.

**Why in-memory history instead of a database?**  
Conversation history is session-scoped and doesn't need to persist across server restarts. A `deque(maxlen=50)` is simple, fast, and sufficient. The frontend also persists messages in localStorage via Zustand.

**Why bcrypt for passwords?**  
bcrypt is the industry standard for password hashing — it's slow by design (making brute-force attacks impractical) and includes a salt automatically.

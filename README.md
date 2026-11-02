# Video Caption Translator (MERN Stack Edition)

A full-stack **MERN (MongoDB, Express.js, React.js, Node.js)** application for automated video audio extraction, AI speech recognition, neural translation, synchronized video caption previewing, and subtitle export (SRT, VTT, TXT, JSON).

Converts and modernizes the original Python desktop application (`moviepy`, `speech_recognition`, `googletrans`, `tkinter`) into a high-performance, web-based JavaScript & TypeScript architecture with persistent database storage in MongoDB.

---

## 🌟 Key Features

- **Video Ingestion & Playback**:
  - Drag-and-drop or file picker supporting MP4, MKV, MOV, WebM, and AVI formats.
  - HTML5 video player with real-time synchronized caption overlay (Original, Translated, or Dual subtitles).
  - Click any subtitle timestamp to seek playback directly to that moment.

- **Audio Extraction & Segmentation (FFmpeg & Node.js)**:
  - High-fidelity 16kHz mono audio extraction using `fluent-ffmpeg` and bundled `ffmpeg-static`.
  - Overlapping audio chunking algorithm (5s chunks with 2s overlap) replicating Python's exact speech boundary recognition logic.

- **AI Speech-to-Text Recognition**:
  - Direct JavaScript port of Python's `speech_recognition.Recognizer.recognize_google` using Chromium Google Speech API v2 with 16kHz FLAC streams.
  - Dynamic retry resilience and silence detection.
  - Optional extensible Whisper API support.

- **Neural Translation Engine**:
  - Full-transcript and segment-level translation porting Python's `googletrans.Translator`.
  - Over 108 supported world languages with fast-search dropdown and language code entry (defaulting to `"es"` Spanish).
  - One-click re-translation into different languages without re-uploading or re-extracting audio.

- **AI Voice Generation & Speech Audio Dubbing (TTS)**:
  - Synthesizes fluent, natural speech audio (.mp3) of the translated captions in the target language.
  - Listen to live voice audio for any single subtitle segment with an inline speaker button.
  - Video Dubbing: Combines the original video visual with the AI-translated speech audio track into a dubbed video (.mp4).
  - Download synthesized audio files directly or preview them in the built-in media player.

- **MongoDB Persistence & Project Management**:
  - Saves full transcription projects, segment timestamps, translations, and metadata in MongoDB.
  - Project history drawer to reload, review, edit, or delete previous jobs.

- **Dual Text Editor & Subtitle Timelines**:
  - Dual side-by-side text view mirroring Python's ScrolledText widgets (Original Text vs. Translated Text).
  - Interactive timestamped segment editor with inline text editing and clipboard copying.

- **Multi-Format Export**:
  - Export subtitles in **SubRip (.srt)**, **WebVTT (.vtt)**, **Plain Text (.txt)**, and **Structured Data (.json)** for both original and translated tracks.

- **Real-Time Progress Streaming (SSE)**:
  - Server-Sent Events (SSE) streaming live progress updates, percentage, and terminal activity logs to the frontend without polling.

---

## 🏗️ Architecture: Python vs. MERN Stack

| Feature | Original Python Implementation | MERN Stack Implementation |
| :--- | :--- | :--- |
| **User Interface** | Python Tkinter (`main.py`) | React.js 18 + Bootstrap 5 + TypeScript (`client/`) |
| **Backend / Server** | Local Python script execution | Node.js 24 + Express.js REST API (`server/`) |
| **Database** | None (in-memory during session) | MongoDB (Mongoose ODM) with persistent schemas |
| **Audio Extraction** | `moviepy.editor.VideoFileClip` | `fluent-ffmpeg` + `ffmpeg-static` (cross-platform) |
| **Speech Recognition** | `speech_recognition.Recognizer` | `SpeechRecognitionService` (port of Chromium API) |
| **Translation** | `googletrans.Translator` | `TranslatorService` (Google Neural API / 108+ langs) |
| **Progress Reporting** | `threading.Thread` + `root.after()` | Server-Sent Events (SSE) + Live Activity Console |
| **Subtitles / Export** | Raw text box | Subtitle Generator (.srt, .vtt, .txt, .json) |

---

## 📁 Project Structure

```
video tool from scratch/
├── server/                         # Backend (Node.js, Express, MongoDB, FFmpeg)
│   ├── src/
│   │   ├── config/
│   │   │   ├── config.js           # Server configuration & environment variables
│   │   │   └── db.js               # MongoDB connection setup via Mongoose
│   │   ├── controllers/
│   │   │   ├── videoController.js  # Video upload, chunked processing, SSE streaming
│   │   │   ├── projectController.js# CRUD, retranslation, subtitle export
│   │   │   └── translationController.js # Standalone translation & language list
│   │   ├── models/
│   │   │   └── VideoProject.js     # Mongoose Schema for video projects & segments
│   │   ├── routes/
│   │   │   ├── videoRoutes.js      # Video routes (/api/videos)
│   │   │   ├── projectRoutes.js    # Project routes (/api/projects)
│   │   │   └── translationRoutes.js# Translation routes (/api/translate)
│   │   ├── services/
│   │   │   ├── audioExtractor.js   # FFmpeg audio extractor & chunking
│   │   │   ├── speechRecognition.js# Google Speech API port of Python sr
│   │   │   ├── translator.js       # Google Translate port of Python googletrans
│   │   │   └── subtitleGenerator.js# SRT, VTT, TXT, JSON generation
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces & types
│   │   └── server.js               # Express application entrypoint
│   ├── uploads/                    # Directory for uploaded videos & temp audio
│   ├── test-api.js                 # Automated backend test suite
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── client/                         # Frontend (React.js, Bootstrap, TypeScript, Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Navigation, status indicators, triggers
│   │   │   ├── VideoUploader.tsx   # File picker & drag-and-drop zone
│   │   │   ├── LanguageSelector.tsx# 108+ languages selector & generate button
│   │   │   ├── ProgressBar.tsx     # Animated progress bar & live log terminal
│   │   │   ├── VideoPlayer.tsx     # Video preview with synchronized captions
│   │   │   ├── CaptionDisplay.tsx  # Dual scrolled text areas & segment timeline
│   │   │   ├── ExportControls.tsx  # Subtitle export (SRT, VTT, TXT, JSON)
│   │   │   ├── ProjectHistoryModal.tsx # MongoDB saved projects manager
│   │   │   └── AIToolsModal.tsx    # AI engine documentation modal
│   │   ├── services/
│   │   │   └── api.ts              # Axios REST client & SSE event source
│   │   ├── types/
│   │   │   └── index.ts            # Client TypeScript interfaces
│   │   ├── App.tsx                 # Main application dashboard
│   │   ├── App.css                 # Custom styles, dark theme, and typography
│   │   └── main.tsx                # Client React entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.js
├── package.json                    # Root scripts for concurrently running full stack
├── PROJECT_SETUP.md                # Project setup and verification guide
└── README.md                       # Complete documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js**: v18.0 or higher (v24+ recommended)
- **MongoDB**: Installed locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### 1. Install Dependencies

You can install all dependencies across the root, server, and client with one command:

```bash
npm run install-all
```

Or manually:
```bash
# Server
cd server && npm install && cd ..

# Client
cd client && npm install && cd ..
```

### 2. Configure Environment

The backend includes a pre-configured `.env` in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/video_caption_translator
NODE_ENV=development
UPLOAD_DIR=uploads
```

### 3. Start the Application

#### Development Mode (Concurrent React HMR + Express):
```bash
npm run dev
```
- **React Frontend**: `http://localhost:3000` (with live reload)
- **Express Backend API**: `http://localhost:5000`

#### Production Single-Port Mode:
Build the client and serve both frontend and backend on port 5000:
```bash
npm run build
npm start
```
- Open `http://localhost:5000` in your browser.

---

## 📡 REST API Reference

### Video Endpoints (`/api/videos`)
- `POST /api/videos/upload` - Upload video file via `multipart/form-data`.
- `POST /api/videos/:id/process` - Start audio extraction, transcription, and translation pipeline.
- `GET /api/videos/:id/stream` - Server-Sent Events (SSE) stream for live progress updates.

### Project Endpoints (`/api/projects`)
- `GET /api/projects` - List all saved projects from MongoDB.
- `GET /api/projects/:id` - Get specific project by ID with all segments.
- `PUT /api/projects/:id` - Update captions, title, or segments.
- `DELETE /api/projects/:id` - Delete project from MongoDB and remove file from disk.
- `POST /api/projects/:id/retranslate` - Retranslate existing captions into a new target language.
- `POST /api/projects/:id/generate-audio` - Synthesize AI speech audio (.mp3) from translated captions.
- `POST /api/projects/:id/generate-dubbed-video` - Mux translated voice audio with video into dubbed video (.mp4).
- `GET /api/projects/tts/speak?text=...&lang=...` - Stream live audio speech for any segment or phrase.
- `GET /api/projects/:id/export/:format` - Download subtitles (`srt`, `vtt`, `txt`, `json`). Pass `?useTranslation=true` or `false`.

### Translation & AI Endpoints (`/api/translate`)
- `POST /api/translate` - Standalone translation for arbitrary text.
- `GET /api/translate/languages` - Get list of 108+ supported languages.

### Health Check
- `GET /api/health` - Check API server uptime and MongoDB connection status.

---

## 🧪 Testing

Run the automated MERN stack test suite:
```bash
node server/test-api.js
```
The test verifies:
1. Health check & MongoDB connectivity
2. Language catalog retrieval
3. Neural translation output
4. MongoDB project creation, query, and cleanup
5. Single-port SPA HTML delivery
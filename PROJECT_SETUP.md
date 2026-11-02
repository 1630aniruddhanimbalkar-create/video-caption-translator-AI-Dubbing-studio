# Video Caption Translator - MERN Stack Setup Guide

## Project Overview
This project is a complete conversion of the original Python desktop application into a modern **MERN (MongoDB, Express.js, React.js, Node.js)** full-stack architecture with TypeScript, Bootstrap 5, AI speech recognition algorithms, neural translation, and subtitle exports.

---

## 🛠️ Stack Conversion Status

### 1. Backend & Server Setup (100% Complete)
- [x] Node.js 24 & Express.js REST API server
- [x] MongoDB database connection via Mongoose
- [x] Multer file upload storage handler
- [x] Cross-origin resource sharing (`cors`) and security middleware
- [x] Static video streaming endpoint with HTTP Range header support

### 2. Audio & AI Algorithms (100% Complete)
- [x] **Audio Extraction**: Ported MoviePy `VideoFileClip` to `fluent-ffmpeg` + `ffmpeg-static`
- [x] **Speech Recognition Algorithm**: Ported Python `speech_recognition.Recognizer.recognize_google` to `SpeechRecognitionService`
  - 16kHz mono FLAC streaming
  - 5-second chunking with 2-second overlap
  - Dynamic retry mechanism
- [x] **Translation Service**: Ported Python `googletrans.Translator` to `TranslatorService`
  - 108+ world language catalogue
  - Full-text & segment-by-segment translation
  - Fallback engine support
- [x] **Subtitle Generator**: SubRip (.srt), WebVTT (.vtt), Plain Text (.txt), and JSON (.json)
- [x] **AI Text-To-Speech (TTS) Voice Synthesis**: Ported neural voice synthesis to `TTSService` (.mp3 speech audio)
- [x] **AI Video Dubbing Engine**: FFmpeg audio/video muxing into dubbed MP4 video with translated speech track
- [x] **Interactive Segment Speech Player**: Live speech streaming per subtitle segment with speaker button

### 3. Frontend Implementation (100% Complete)
- [x] React 18 + TypeScript + Vite build configuration
- [x] Bootstrap 5 styling with responsive dark theme
- [x] **Video Uploader**: Drag & drop zone + file browser (replaces Tkinter Browse button)
- [x] **Language Selector**: Searchable 108+ languages + direct code input (defaulting to `"es"`)
- [x] **Action Control**: "Generate Captions" with loading state management
- [x] **Real-Time Progress**: Animated progress bar + live activity terminal (replaces Tkinter log updates)
- [x] **Video Preview Player**: HTML5 video player with synchronized caption overlay (Original, Translated, Dual)
- [x] **Dual Caption Area**: Side-by-side original & translated text boxes (replaces Tkinter ScrolledText)
- [x] **Segment Timeline Editor**: Interactive timestamped segment list with click-to-seek video sync
- [x] **Subtitle Export Bar**: One-click download for SRT, VTT, TXT, JSON
- [x] **MongoDB History Manager**: Modal to view, reload, and delete saved projects
- [x] **AI Tools Documentation**: Interactive modal explaining the speech & translation pipeline

### 4. Verification & Testing (100% Complete)
- [x] Verified MongoDB connection (`mongodb://127.0.0.1:27017`)
- [x] Verified Node.js & npm package installation
- [x] Verified Vite client compilation (`npm --prefix client run build`)
- [x] Verified automated end-to-end test suite (`node server/test-api.js`):
  - Health check: 200 OK
  - Languages list: 108 languages
  - Spanish translation: Accurate
  - MongoDB CRUD: Passed
  - Frontend SPA serving: Passed

---

## 🏃 Running the Application

### Development Mode (Concurrent Frontend & Backend):
```bash
npm run dev
```
- Client runs on `http://localhost:3000`
- Server runs on `http://localhost:5000`

### Production Mode:
```bash
npm run build
npm start
```
- Open `http://localhost:5000` in your web browser.

### Run Automated Tests:
```bash
node server/test-api.js
```
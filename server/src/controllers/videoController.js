const path = require('path');
const fs = require('fs');
const VideoProject = require('../models/VideoProject');
const AudioExtractor = require('../services/audioExtractor');
const SpeechRecognitionService = require('../services/speechRecognition');
const TranslatorService = require('../services/translator');
const config = require('../config/config');

// In-memory active SSE clients map
const sseClients = new Map();

function sendSseEvent(projectId, data) {
  const clients = sseClients.get(projectId);
  if (clients && clients.length > 0) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(res => res.write(payload));
  }
}

/**
 * Upload Video Controller
 */
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const file = req.file;
    const originalFileName = file.originalname;
    const videoFilePath = file.path;
    const videoPath = `/uploads/${path.basename(videoFilePath)}`;
    const title = req.body.title || path.parse(originalFileName).name;
    const targetLanguage = req.body.targetLanguage || 'es';
    const sourceLanguage = req.body.sourceLanguage || 'en-US';

    // Probe duration using ffmpeg
    let duration = 0;
    try {
      duration = await AudioExtractor.getMediaDuration(videoFilePath);
    } catch (err) {
      console.warn('[VideoController] Could not probe video duration:', err.message);
    }

    // Create project in MongoDB
    const project = new VideoProject({
      title,
      originalFileName,
      videoPath,
      videoFilePath,
      fileSize: file.size,
      duration,
      targetLanguage,
      sourceLanguage,
      status: 'idle',
      progress: 0,
      statusMessage: 'File uploaded successfully. Ready to generate captions.'
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      project
    });
  } catch (error) {
    console.error('[VideoController] Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video', details: error.message });
  }
};

/**
 * Process Video: Extract Audio -> Transcribe Chunks -> Translate -> Save to MongoDB
 */
exports.processVideo = async (req, res) => {
  const { id } = req.params;
  const { targetLanguage, sourceLanguage } = req.body;

  try {
    const project = await VideoProject.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status === 'transcribing' || project.status === 'extracting_audio') {
      return res.status(400).json({ error: 'Project is already being processed' });
    }

    if (targetLanguage) project.targetLanguage = targetLanguage;
    if (sourceLanguage) project.sourceLanguage = sourceLanguage;

    project.status = 'queued';
    project.progress = 5;
    project.statusMessage = 'Starting video transcription pipeline...';
    project.errorMessage = null;
    await project.save();

    // Respond immediately to client so processing runs asynchronously
    res.json({
      success: true,
      message: 'Video processing started',
      project
    });

    // Start background processing pipeline
    (async () => {
      const tempAudioWav = path.join(config.uploadDir, `temp_audio_${project._id}.wav`);

      try {
        // Step 1: Extract Audio
        project.status = 'extracting_audio';
        project.progress = 10;
        project.statusMessage = 'Extracting audio from video file...';
        await project.save();
        sendSseEvent(id, { status: project.status, progress: project.progress, message: project.statusMessage });

        await AudioExtractor.extractAudioToWav(project.videoFilePath, tempAudioWav);

        // Step 2: Speech Recognition
        project.status = 'transcribing';
        project.progress = 20;
        project.statusMessage = 'Transcribing audio speech chunks...';
        await project.save();
        sendSseEvent(id, { status: project.status, progress: project.progress, message: project.statusMessage });

        const transcriptionResult = await SpeechRecognitionService.transcribeAudioChunks(tempAudioWav, {
          chunkDuration: 5,
          overlap: 2,
          maxRetries: 3,
          language: project.sourceLanguage,
          onProgress: (prog) => {
            sendSseEvent(id, {
              status: 'transcribing',
              progress: prog.percent,
              message: prog.message
            });
          }
        });

        project.originalText = transcriptionResult.fullText;
        project.segments = transcriptionResult.segments;

        if (!project.originalText || project.originalText.trim().length === 0) {
          project.status = 'completed';
          project.progress = 100;
          project.statusMessage = 'No speech detected in the video.';
          await project.save();
          sendSseEvent(id, { status: project.status, progress: project.progress, message: project.statusMessage, project });
          return;
        }

        // Step 3: Translation
        project.status = 'translating';
        project.progress = 85;
        project.statusMessage = `Translating captions to ${project.targetLanguage}...`;
        await project.save();
        sendSseEvent(id, { status: project.status, progress: project.progress, message: project.statusMessage });

        // Translate full text
        const translatedResult = await TranslatorService.translateText(
          project.originalText,
          project.targetLanguage,
          project.sourceLanguage === 'en-US' ? 'en' : 'auto'
        );
        project.translatedText = translatedResult.translatedText;

        // Translate individual segments for synchronized subtitles
        const translatedSegments = await TranslatorService.translateSegments(
          project.segments,
          project.targetLanguage,
          project.sourceLanguage === 'en-US' ? 'en' : 'auto'
        );
        project.segments = translatedSegments;

        // Step 4: Complete
        project.status = 'completed';
        project.progress = 100;
        project.statusMessage = 'Captions successfully generated and translated!';
        await project.save();

        sendSseEvent(id, {
          status: project.status,
          progress: project.progress,
          message: project.statusMessage,
          project
        });
      } catch (err) {
        console.error(`[VideoController] Processing error for project ${id}:`, err);
        project.status = 'failed';
        project.progress = 0;
        project.errorMessage = err.message || 'An error occurred during processing';
        project.statusMessage = `Error: ${project.errorMessage}`;
        await project.save();

        sendSseEvent(id, {
          status: project.status,
          progress: 0,
          message: project.statusMessage,
          error: project.errorMessage
        });
      } finally {
        // Cleanup temp audio file
        try {
          if (fs.existsSync(tempAudioWav)) {
            fs.unlinkSync(tempAudioWav);
          }
        } catch {}
      }
    })();
  } catch (error) {
    console.error('[VideoController] Process request error:', error);
    res.status(500).json({ error: 'Failed to initiate video processing', details: error.message });
  }
};

/**
 * Real-time SSE progress stream
 */
exports.streamProgress = (req, res) => {
  const { id } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(id)) {
    sseClients.set(id, []);
  }
  sseClients.get(id).push(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', projectId: id })}\n\n`);

  req.on('close', () => {
    const clients = sseClients.get(id) || [];
    const remaining = clients.filter(client => client !== res);
    if (remaining.length > 0) {
      sseClients.set(id, remaining);
    } else {
      sseClients.delete(id);
    }
  });
};

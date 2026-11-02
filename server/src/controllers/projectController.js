const fs = require('fs');
const path = require('path');
const VideoProject = require('../models/VideoProject');
const SubtitleGenerator = require('../services/subtitleGenerator');
const TranslatorService = require('../services/translator');
const TTSService = require('../services/ttsService');
const config = require('../config/config');

/**
 * List all projects
 */
exports.getProjects = async (req, res) => {
  try {
    const projects = await VideoProject.find()
      .select('-segments') // omit heavy segments for listing
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve projects', details: error.message });
  }
};

/**
 * Get project by ID
 */
exports.getProjectById = async (req, res) => {
  try {
    const project = await VideoProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve project', details: error.message });
  }
};

/**
 * Update project (captions, title, segments)
 */
exports.updateProject = async (req, res) => {
  try {
    const { title, originalText, translatedText, segments, targetLanguage } = req.body;
    const project = await VideoProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (title !== undefined) project.title = title;
    if (originalText !== undefined) project.originalText = originalText;
    if (translatedText !== undefined) project.translatedText = translatedText;
    if (segments !== undefined) project.segments = segments;
    if (targetLanguage !== undefined) project.targetLanguage = targetLanguage;

    await project.save();
    res.json({ success: true, message: 'Project updated successfully', project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
};

/**
 * Retranslate an existing project to a new target language
 */
exports.retranslateProject = async (req, res) => {
  try {
    const { targetLanguage } = req.body;
    if (!targetLanguage) {
      return res.status(400).json({ error: 'targetLanguage is required' });
    }

    const project = await VideoProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.originalText) {
      return res.status(400).json({ error: 'No original text available to translate' });
    }

    project.targetLanguage = targetLanguage;

    // Translate full text
    const fullTrans = await TranslatorService.translateText(
      project.originalText,
      targetLanguage,
      project.sourceLanguage === 'en-US' ? 'en' : 'auto'
    );
    project.translatedText = fullTrans.translatedText;

    // Translate segments
    if (project.segments && project.segments.length > 0) {
      project.segments = await TranslatorService.translateSegments(
        project.segments,
        targetLanguage,
        project.sourceLanguage === 'en-US' ? 'en' : 'auto'
      );
    }

    await project.save();
    res.json({ success: true, message: 'Project re-translated successfully', project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retranslate project', details: error.message });
  }
};

/**
 * Delete project
 */
exports.deleteProject = async (req, res) => {
  try {
    const project = await VideoProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Try deleting video file from disk
    if (project.videoFilePath && fs.existsSync(project.videoFilePath)) {
      try {
        fs.unlinkSync(project.videoFilePath);
      } catch (e) {
        console.warn('[ProjectController] Could not delete video file:', e.message);
      }
    }

    await VideoProject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
};

/**
 * Export subtitles (SRT, VTT, TXT, JSON)
 */
exports.exportSubtitles = async (req, res) => {
  try {
    const { id, format } = req.params;
    const { useTranslation } = req.query; // 'true' or 'false'
    const isTranslated = useTranslation === 'true';

    const project = await VideoProject.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const safeTitle = (project.title || 'subtitles').replace(/[^a-zA-Z0-9_-]/g, '_');
    const suffix = isTranslated ? `_${project.targetLanguage}` : '_original';

    switch (format.toLowerCase()) {
      case 'srt': {
        const content = SubtitleGenerator.toSRT(project.segments, isTranslated);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}${suffix}.srt"`);
        return res.send(content);
      }
      case 'vtt': {
        const content = SubtitleGenerator.toVTT(project.segments, isTranslated);
        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}${suffix}.vtt"`);
        return res.send(content);
      }
      case 'txt': {
        const content = isTranslated ? project.translatedText : project.originalText;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}${suffix}.txt"`);
        return res.send(content || SubtitleGenerator.toTXT(project.segments, isTranslated));
      }
      case 'json': {
        const content = SubtitleGenerator.toJSON(project);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}${suffix}.json"`);
        return res.send(content);
      }
      default:
        return res.status(400).json({ error: `Unsupported export format: ${format}` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to export subtitles', details: error.message });
  }
};

/**
 * Generate AI Audio (TTS) for translated text
 */
exports.generateAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await VideoProject.findById(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.translatedText || !project.translatedText.trim()) {
      return res.status(400).json({ error: 'No translated text available to generate speech audio' });
    }

    project.audioVoiceStatus = 'generating';
    await project.save();

    const outputFileName = `audio-translated-${project._id}.mp3`;
    const outputFilePath = path.join(config.uploadDir, outputFileName);
    const outputWebPath = `/uploads/${outputFileName}`;

    // Synthesize speech using TTSService
    await TTSService.synthesizeSpeech(project.translatedText, project.targetLanguage, outputFilePath);

    project.translatedAudioPath = outputWebPath;
    project.translatedAudioFilePath = outputFilePath;
    project.audioVoiceStatus = 'ready';
    await project.save();

    res.json({
      success: true,
      message: 'AI translated speech audio generated successfully',
      audioUrl: outputWebPath,
      project
    });
  } catch (error) {
    console.error('[ProjectController] Error generating TTS audio:', error);
    try {
      await VideoProject.findByIdAndUpdate(req.params.id, { audioVoiceStatus: 'failed' });
    } catch {}
    res.status(500).json({ error: 'Failed to generate speech audio', details: error.message });
  }
};

/**
 * Generate Dubbed Video (Video + Translated Audio Track)
 */
exports.generateDubbedVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await VideoProject.findById(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.translatedAudioFilePath || !fs.existsSync(project.translatedAudioFilePath)) {
      // If audio not generated yet, generate it first
      const outputAudioName = `audio-translated-${project._id}.mp3`;
      const outputAudioPath = path.join(config.uploadDir, outputAudioName);
      await TTSService.synthesizeSpeech(project.translatedText, project.targetLanguage, outputAudioPath);
      project.translatedAudioPath = `/uploads/${outputAudioName}`;
      project.translatedAudioFilePath = outputAudioPath;
      project.audioVoiceStatus = 'ready';
    }

    const outputVideoName = `video-dubbed-${project._id}.mp4`;
    const outputVideoPath = path.join(config.uploadDir, outputVideoName);
    const outputWebPath = `/uploads/${outputVideoName}`;

    await TTSService.generateDubbedVideo(project.videoFilePath, project.translatedAudioFilePath, outputVideoPath);

    project.dubbedVideoPath = outputWebPath;
    project.dubbedVideoFilePath = outputVideoPath;
    await project.save();

    res.json({
      success: true,
      message: 'Dubbed video generated successfully',
      videoUrl: outputWebPath,
      project
    });
  } catch (error) {
    console.error('[ProjectController] Error generating dubbed video:', error);
    res.status(500).json({ error: 'Failed to generate dubbed video', details: error.message });
  }
};

/**
 * Stream Live TTS audio for single phrases / segments
 */
exports.streamLiveTTS = async (req, res) => {
  try {
    const { text, lang = 'es' } = req.query;
    if (!text) {
      return res.status(400).send('Text is required');
    }

    const audioBuffer = await TTSService.fetchTTSChunk(text, lang);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(audioBuffer);
  } catch (error) {
    console.error('[ProjectController] Live TTS error:', error);
    res.status(500).send('Failed to synthesize speech');
  }
};

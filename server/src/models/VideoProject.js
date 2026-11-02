const mongoose = require('mongoose');

const SubtitleSegmentSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true
  },
  start: {
    type: Number,
    required: true,
    default: 0
  },
  end: {
    type: Number,
    required: true,
    default: 0
  },
  text: {
    type: String,
    required: true,
    default: ''
  },
  translatedText: {
    type: String,
    default: ''
  }
}, { _id: false });

const VideoProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Untitled Video Project'
  },
  originalFileName: {
    type: String,
    required: true
  },
  videoPath: {
    type: String,
    required: true
  },
  videoFilePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  sourceLanguage: {
    type: String,
    default: 'en-US'
  },
  targetLanguage: {
    type: String,
    default: 'es'
  },
  status: {
    type: String,
    enum: ['idle', 'queued', 'extracting_audio', 'transcribing', 'translating', 'completed', 'failed'],
    default: 'idle'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  statusMessage: {
    type: String,
    default: 'Ready to process'
  },
  originalText: {
    type: String,
    default: ''
  },
  translatedText: {
    type: String,
    default: ''
  },
  segments: {
    type: [SubtitleSegmentSchema],
    default: []
  },
  errorMessage: {
    type: String,
    default: null
  },
  translatedAudioPath: {
    type: String,
    default: null
  },
  translatedAudioFilePath: {
    type: String,
    default: null
  },
  dubbedVideoPath: {
    type: String,
    default: null
  },
  dubbedVideoFilePath: {
    type: String,
    default: null
  },
  audioVoiceStatus: {
    type: String,
    enum: ['none', 'generating', 'ready', 'failed'],
    default: 'none'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VideoProject', VideoProjectSchema);

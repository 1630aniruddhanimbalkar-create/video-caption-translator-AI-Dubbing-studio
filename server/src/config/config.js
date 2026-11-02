const path = require('path');
require('dotenv').config();

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/video_caption_translator',
  nodeEnv: process.env.NODE_ENV || 'development',
  uploadDir: path.resolve(__dirname, '../../uploads'),
  tempDir: path.resolve(__dirname, '../../uploads/temp'),
  maxFileSize: 500 * 1024 * 1024, // 500MB
  allowedFormats: ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv']
};

module.exports = config;

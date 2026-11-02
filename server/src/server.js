const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const connectDB = require('./config/db');

// Import routes
const videoRoutes = require('./routes/videoRoutes');
const projectRoutes = require('./routes/projectRoutes');
const translationRoutes = require('./routes/translationRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploaded video files (supports video streaming / range requests)
app.use('/uploads', express.static(config.uploadDir));

// API Routes
app.use('/api/videos', videoRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/translate', translationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState
    },
    version: '1.0.0'
  });
});

// Serve frontend build if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: config.nodeEnv === 'development' ? err.stack : undefined
  });
});

// Start Server
const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Video Caption Translator Server running on port ${config.port}`);
  console.log(`📡 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`📁 Uploads Directory: ${config.uploadDir}`);
  console.log(`====================================================`);
});

module.exports = app;

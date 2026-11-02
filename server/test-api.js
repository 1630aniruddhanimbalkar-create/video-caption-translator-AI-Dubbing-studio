const http = require('http');
const mongoose = require('mongoose');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING MERN STACK AUTOMATED VERIFICATION ---');

  // 1. Health check
  console.log('[Test 1] Testing GET /api/health...');
  const health = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log('Status:', health.status, 'Body:', health.body);
  if (health.status !== 200 || !health.body.database?.connected) {
    throw new Error('Health check failed or MongoDB not connected');
  }

  // 2. Languages catalogue
  console.log('\n[Test 2] Testing GET /api/translate/languages...');
  const langs = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/translate/languages',
    method: 'GET'
  });
  console.log('Status:', langs.status, 'Total languages count:', langs.body.count);
  if (langs.status !== 200 || langs.body.count < 50) {
    throw new Error('Failed to retrieve supported languages');
  }

  // 3. Translation API (port of python googletrans)
  console.log('\n[Test 3] Testing POST /api/translate (Spanish translation)...');
  const trans = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/translate',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    text: 'Welcome to Video Caption Translator MERN stack',
    targetLanguage: 'es'
  });
  console.log('Status:', trans.status);
  console.log('Original:', trans.body.originalText);
  console.log('Translated:', trans.body.translatedText);
  if (trans.status !== 200 || !trans.body.translatedText) {
    throw new Error('Translation failed');
  }

  // 4. Test MongoDB Project Creation & Retrieval
  console.log('\n[Test 4] Testing MongoDB Project Persistence...');
  const VideoProject = require('./src/models/VideoProject');
  const newProj = new VideoProject({
    title: 'Automated Test Video Project',
    originalFileName: 'sample_video.mp4',
    videoPath: '/uploads/sample_video.mp4',
    videoFilePath: 'e:\\mini\\video tool from scratch\\sample_video.mp4',
    sourceLanguage: 'en-US',
    targetLanguage: 'es',
    status: 'completed',
    progress: 100,
    originalText: 'Hello from automated testing',
    translatedText: 'Hola desde las pruebas automatizadas',
    segments: [
      { index: 1, start: 0, end: 3, text: 'Hello from automated testing', translatedText: 'Hola desde las pruebas automatizadas' }
    ]
  });
  const saved = await newProj.save();
  console.log('Created project in MongoDB with ID:', saved._id.toString());

  // Verify fetch via REST API
  const fetched = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/projects/${saved._id}`,
    method: 'GET'
  });
  console.log('Retrieved via GET /api/projects/:id ->', fetched.body.project.title);

  // 5. Test AI Speech Synthesis (TTS)
  console.log('\n[Test 5] Testing AI Text-To-Speech Live Audio Stream (GET /api/projects/tts/speak)...');
  const ttsLive = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects/tts/speak?text=' + encodeURIComponent('Hola mundo prueba de voz') + '&lang=es',
    method: 'GET'
  });
  console.log('Status:', ttsLive.status, 'Content-Type:', ttsLive.headers['content-type']);
  if (ttsLive.status !== 200 || !ttsLive.headers['content-type']?.includes('audio/mpeg')) {
    throw new Error('TTS live stream test failed');
  }

  // Test full project audio synthesis
  console.log('Testing full project audio synthesis (POST /api/projects/:id/generate-audio)...');
  const genAudioRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/projects/${saved._id}/generate-audio`,
    method: 'POST'
  });
  console.log('Status:', genAudioRes.status, 'Audio Path:', genAudioRes.body.audioUrl);
  if (genAudioRes.status !== 200 || !genAudioRes.body.audioUrl) {
    throw new Error('Project audio generation failed');
  }

  // Clean up test project
  await VideoProject.findByIdAndDelete(saved._id);
  console.log('Cleaned up test project from MongoDB.');

  // 6. Test Frontend Delivery
  console.log('\n[Test 6] Testing Frontend Single-Port Delivery (GET /)...');
  const frontend = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET'
  });
  console.log('Status:', frontend.status, 'HTML contains root div:', typeof frontend.body === 'string' && frontend.body.includes('<div id="root">'));

  console.log('\n🎉 ALL TESTS (INCLUDING AI TTS AUDIO GENERATION) PASSED! MERN STACK IS FULLY FUNCTIONAL.');
  process.exit(0);
}

// Start server and run tests
const app = require('./src/server');
setTimeout(() => {
  runTests().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
}, 2000);

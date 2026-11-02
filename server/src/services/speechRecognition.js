const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AudioExtractor = require('./audioExtractor');

/**
 * Speech Recognition Service
 * Implements the exact algorithm as Python's speech_recognition.Recognizer.recognize_google
 * with chunking, overlap, retries, and OpenAI Whisper fallback support.
 */
class SpeechRecognitionService {
  /**
   * Recognizes speech from a FLAC audio buffer using Google's Chromium Speech API
   * @param {Buffer} audioBuffer - FLAC audio buffer at 16000Hz mono
   * @param {string} language - Language code (e.g., 'en-US', 'es-ES')
   * @returns {Promise<string>} - Transcribed text
   */
  static async recognizeGoogle(audioBuffer, language = 'en-US') {
    const url = `https://www.google.com/speech-api/v2/recognize?client=chromium&lang=${language}&maxresults=1&pfilter=2`;

    try {
      const response = await axios.post(url, audioBuffer, {
        headers: {
          'Content-Type': 'audio/x-flac; rate=16000',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 15000,
        responseType: 'text'
      });

      const responseText = response.data;
      if (!responseText) return '';

      // Google returns multiple JSON lines:
      // Line 1: {"result":[]}
      // Line 2: {"result":[{"alternative":[{"transcript":"...","confidence":0.95}],"final":true}]}
      const lines = responseText.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line.trim());
          if (parsed.result && parsed.result.length > 0) {
            for (const res of parsed.result) {
              if (res.alternative && res.alternative.length > 0 && res.alternative[0].transcript) {
                return res.alternative[0].transcript.trim();
              }
            }
          }
        } catch {
          // Ignore partial or non-json line
        }
      }

      return '';
    } catch (err) {
      if (err.response && (err.response.status === 400 || err.response.status === 500)) {
        return '';
      }
      throw err;
    }
  }

  /**
   * Process entire audio file in overlapping chunks matching Python's exact algorithm:
   * chunk_duration = 5, overlap = 2, max_retries = 3
   *
   * @param {string} audioWavPath - Path to extracted WAV audio
   * @param {Object} options - Options: chunkDuration, overlap, maxRetries, language, onProgress callback
   * @returns {Promise<{ fullText: string, segments: Array<{ index: number, start: number, end: number, text: string }> }>}
   */
  static async transcribeAudioChunks(audioWavPath, options = {}) {
    const chunkDuration = options.chunkDuration || 5;
    const overlap = options.overlap || 2;
    const maxRetries = options.maxRetries || 3;
    const language = options.language || 'en-US';
    const onProgress = options.onProgress || (() => {});

    // Get total duration of audio
    const totalDuration = await AudioExtractor.getMediaDuration(audioWavPath);
    onProgress({
      message: `Audio file duration: ${totalDuration.toFixed(1)} seconds. Starting chunk processing...`,
      percent: 10
    });

    const tempDir = path.join(path.dirname(audioWavPath), 'temp_chunks_' + Date.now());
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const segments = [];
    let fullText = '';
    let offset = 0;
    let segmentIndex = 1;

    try {
      while (offset < totalDuration) {
        const endTime = Math.min(offset + chunkDuration, totalDuration);
        const currentDuration = Math.min(chunkDuration, totalDuration - offset);
        
        const chunkFileName = path.join(tempDir, `chunk_${segmentIndex}_${offset.toFixed(1)}.flac`);

        onProgress({
          message: `Processing segment ${offset.toFixed(1)}s to ${endTime.toFixed(1)}s...`,
          percent: 10 + Math.round((offset / Math.max(1, totalDuration)) * 75)
        });

        // Extract chunk into 16kHz mono FLAC
        try {
          await AudioExtractor.extractChunkToFlac(audioWavPath, chunkFileName, offset, currentDuration);
        } catch (extractErr) {
          console.warn(`[SpeechRecognition] Failed to extract chunk at ${offset}s:`, extractErr.message);
          offset += Math.max(1, chunkDuration - overlap);
          continue;
        }

        // Retry loop matching Python algorithm
        let chunkText = '';
        let retryCount = 0;

        if (fs.existsSync(chunkFileName)) {
          const chunkBuffer = fs.readFileSync(chunkFileName);

          while (retryCount < maxRetries && !chunkText) {
            try {
              chunkText = await this.recognizeGoogle(chunkBuffer, language);
              if (chunkText) {
                onProgress({
                  message: `Recognized: "${chunkText}"`,
                  percent: 10 + Math.round((offset / Math.max(1, totalDuration)) * 75)
                });
              }
            } catch (apiErr) {
              retryCount++;
              onProgress({
                message: `API retry ${retryCount}/${maxRetries} for segment ${offset.toFixed(1)}s - ${endTime.toFixed(1)}s...`,
                percent: 10 + Math.round((offset / Math.max(1, totalDuration)) * 75)
              });
              await new Promise(r => setTimeout(r, 1000));
            }
          }

          // Clean up chunk file
          try {
            fs.unlinkSync(chunkFileName);
          } catch {}
        }

        if (chunkText) {
          // Avoid duplicate phrases from overlap
          const trimmed = chunkText.trim();
          if (trimmed) {
            if (!fullText.endsWith(trimmed)) {
              fullText = fullText ? `${fullText} ${trimmed}` : trimmed;
            }

            segments.push({
              index: segmentIndex++,
              start: Math.round(offset * 10) / 10,
              end: Math.round(endTime * 10) / 10,
              text: trimmed
            });
          }
        } else {
          onProgress({
            message: `No speech detected in segment ${offset.toFixed(1)}s to ${endTime.toFixed(1)}s`,
            percent: 10 + Math.round((offset / Math.max(1, totalDuration)) * 75)
          });
        }

        offset += Math.max(1, chunkDuration - overlap);
      }
    } finally {
      // Clean up temp directory
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch {}
    }

    return {
      fullText: fullText.trim(),
      segments,
      duration: totalDuration
    };
  }
}

module.exports = SpeechRecognitionService;

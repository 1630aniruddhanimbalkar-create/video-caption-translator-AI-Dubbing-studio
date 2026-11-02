const https = require('https');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

class TTSService {
  /**
   * Split text into speech-friendly chunks (< 180 characters)
   * Splits on sentence endings, commas, or words
   * @param {string} text
   * @param {number} maxLen
   * @returns {string[]}
   */
  static splitTextIntoChunks(text, maxLen = 180) {
    if (!text || !text.trim()) return [];
    const trimmed = text.trim();
    if (trimmed.length <= maxLen) return [trimmed];

    const chunks = [];
    // Split by punctuation first
    const sentences = trimmed.match(/[^.!?;\n]+[.!?;\n]+|[^.!?;\n]+$/g) || [trimmed];

    let currentChunk = '';
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      if (!cleanSentence) continue;

      if ((currentChunk + ' ' + cleanSentence).trim().length <= maxLen) {
        currentChunk = currentChunk ? `${currentChunk} ${cleanSentence}` : cleanSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }

        // If a single sentence is longer than maxLen, split by words
        if (cleanSentence.length > maxLen) {
          const words = cleanSentence.split(/\s+/);
          let wordChunk = '';
          for (const word of words) {
            if ((wordChunk + ' ' + word).trim().length <= maxLen) {
              wordChunk = wordChunk ? `${wordChunk} ${word}` : word;
            } else {
              if (wordChunk) chunks.push(wordChunk);
              wordChunk = word;
            }
          }
          if (wordChunk) chunks.push(wordChunk);
        } else {
          currentChunk = cleanSentence;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Download a single TTS MP3 audio chunk
   * @param {string} text - Chunk text (max 200 chars)
   * @param {string} lang - Language code (e.g., 'es', 'fr', 'en')
   * @returns {Promise<Buffer>}
   */
  static fetchTTSChunk(text, lang = 'es') {
    return new Promise((resolve, reject) => {
      // Map regional language codes if needed (e.g. en-US -> en, zh-CN -> zh-CN)
      let cleanLang = lang.split('-')[0].toLowerCase();
      if (lang === 'zh-CN' || lang === 'zh-TW') cleanLang = lang;

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${cleanLang}&client=tw-ob`;

      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`TTS request failed with status: ${res.statusCode}`));
        }

        const data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => resolve(Buffer.concat(data)));
      }).on('error', (err) => reject(err));
    });
  }

  /**
   * Synthesize full audio for given text and save to MP3 file
   * @param {string} text - Full text to synthesize
   * @param {string} lang - Language code
   * @param {string} outputPath - Output file path (.mp3)
   * @returns {Promise<string>} - Resolves with outputPath
   */
  static async synthesizeSpeech(text, lang, outputPath) {
    if (!text || !text.trim()) {
      throw new Error('No text provided for speech synthesis');
    }

    const chunks = this.splitTextIntoChunks(text);
    if (chunks.length === 0) {
      throw new Error('Could not split text into valid speech chunks');
    }

    console.log(`[TTS] Synthesizing speech for ${chunks.length} chunks in language '${lang}'...`);

    const audioBuffers = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const buf = await this.fetchTTSChunk(chunk, lang);
        audioBuffers.push(buf);
        // Small friendly delay to prevent rate limits
        if (chunks.length > 1) {
          await new Promise(r => setTimeout(r, 120));
        }
      } catch (err) {
        console.warn(`[TTS] Warning: Failed chunk ${i + 1}/${chunks.length}:`, err.message);
      }
    }

    if (audioBuffers.length === 0) {
      throw new Error('Failed to generate any speech audio chunks');
    }

    // Combine all MP3 buffers
    const combinedBuffer = Buffer.concat(audioBuffers);
    fs.writeFileSync(outputPath, combinedBuffer);

    console.log(`[TTS] Generated speech audio successfully: ${outputPath} (${combinedBuffer.length} bytes)`);
    return outputPath;
  }

  /**
   * Create dubbed video: replaces/merges translated audio track into original video
   * @param {string} videoPath - Input video path
   * @param {string} audioPath - Input translated audio path (.mp3)
   * @param {string} outputPath - Destination dubbed video path (.mp4)
   * @returns {Promise<string>}
   */
  static generateDubbedVideo(videoPath, audioPath, outputPath) {
    return new Promise((resolve, reject) => {
      console.log(`[FFmpeg] Dubbing video with translated audio track...`);

      ffmpeg(videoPath)
        .input(audioPath)
        .outputOptions([
          '-map 0:v:0', // video from original video
          '-map 1:a:0', // audio from generated speech
          '-c:v copy',  // stream copy video (instant, no re-encoding quality loss)
          '-c:a aac',   // AAC audio
          '-b:a 192k',
          '-shortest'
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log(`[FFmpeg Dub] Started: ${cmd}`);
        })
        .on('end', () => {
          console.log(`[FFmpeg Dub] Completed: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error(`[FFmpeg Dub] Error:`, err);
          reject(err);
        })
        .run();
    });
  }
}

module.exports = TTSService;

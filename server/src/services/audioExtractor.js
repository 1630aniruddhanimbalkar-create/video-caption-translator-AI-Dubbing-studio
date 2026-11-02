const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * Audio Extractor service mimicking MoviePy's VideoFileClip audio extraction
 */
class AudioExtractor {
  /**
   * Get audio/video duration using ffprobe or ffmpeg
   * @param {string} filePath - Path to video or audio file
   * @returns {Promise<number>} - Duration in seconds
   */
  static getMediaDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (!err && metadata && metadata.format && metadata.format.duration) {
          return resolve(parseFloat(metadata.format.duration));
        }

        // Fallback: run ffmpeg -i to parse duration from output
        let duration = 0;
        ffmpeg(filePath)
          .on('codecData', (data) => {
            if (data && data.duration) {
              const parts = data.duration.split(':');
              if (parts.length === 3) {
                duration = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
              }
            }
          })
          .on('end', () => resolve(duration))
          .on('error', () => resolve(duration || 0))
          .format('null')
          .save('/dev/null');
      });
    });
  }

  /**
   * Extracts clean 16kHz mono audio (WAV) from video file
   * @param {string} videoPath - Input video path
   * @param {string} outputWavPath - Destination WAV file path
   * @returns {Promise<string>} - Resolves with output path
   */
  static extractAudioToWav(videoPath, outputWavPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .output(outputWavPath)
        .on('start', (commandLine) => {
          console.log(`[FFmpeg] Started: ${commandLine}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`[FFmpeg] Extracting audio: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log(`[FFmpeg] Audio extraction completed: ${outputWavPath}`);
          resolve(outputWavPath);
        })
        .on('error', (err) => {
          console.error(`[FFmpeg] Error extracting audio:`, err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Extracts audio chunk into FLAC format (optimal for Google Speech API)
   * @param {string} audioWavPath - Input WAV path
   * @param {string} outputFlacPath - Destination FLAC chunk path
   * @param {number} startTime - Start time in seconds
   * @param {number} duration - Duration in seconds
   * @returns {Promise<string>}
   */
  static extractChunkToFlac(audioWavPath, outputFlacPath, startTime, duration) {
    return new Promise((resolve, reject) => {
      ffmpeg(audioWavPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .audioCodec('flac')
        .audioChannels(1)
        .audioFrequency(16000)
        .output(outputFlacPath)
        .on('end', () => resolve(outputFlacPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }
}

module.exports = AudioExtractor;

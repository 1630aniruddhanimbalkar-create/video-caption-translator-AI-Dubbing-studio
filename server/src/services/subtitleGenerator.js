/**
 * Helper to format seconds to SRT timestamp: 00:00:05,000
 */
function formatSRTTime(seconds) {
  const pad = (num, size = 2) => String(num).padStart(size, '0');
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(millis, 3)}`;
}

/**
 * Helper to format seconds to WebVTT timestamp: 00:00:05.000
 */
function formatVTTTime(seconds) {
  const pad = (num, size = 2) => String(num).padStart(size, '0');
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(millis, 3)}`;
}

class SubtitleGenerator {
  /**
   * Convert segments to SubRip (.srt) format
   * @param {Array} segments
   * @param {boolean} useTranslation - If true, export translated text, else original
   * @returns {string}
   */
  static toSRT(segments = [], useTranslation = false) {
    if (!segments || segments.length === 0) return '';

    return segments.map((seg, i) => {
      const text = useTranslation ? (seg.translatedText || seg.text) : seg.text;
      return `${i + 1}\n${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}\n${text}\n`;
    }).join('\n');
  }

  /**
   * Convert segments to WebVTT (.vtt) format
   * @param {Array} segments
   * @param {boolean} useTranslation
   * @returns {string}
   */
  static toVTT(segments = [], useTranslation = false) {
    let output = 'WEBVTT\n\n';
    if (!segments || segments.length === 0) return output;

    output += segments.map((seg, i) => {
      const text = useTranslation ? (seg.translatedText || seg.text) : seg.text;
      return `${i + 1}\n${formatVTTTime(seg.start)} --> ${formatVTTTime(seg.end)}\n${text}\n`;
    }).join('\n');

    return output;
  }

  /**
   * Plain text export
   * @param {Array} segments
   * @param {boolean} useTranslation
   * @returns {string}
   */
  static toTXT(segments = [], useTranslation = false) {
    if (!segments || segments.length === 0) return '';
    return segments.map(seg => useTranslation ? (seg.translatedText || seg.text) : seg.text).join('\n');
  }

  /**
   * Structured JSON export
   * @param {Object} project
   * @returns {string}
   */
  static toJSON(project) {
    return JSON.stringify({
      title: project.title,
      fileName: project.originalFileName,
      duration: project.duration,
      sourceLanguage: project.sourceLanguage,
      targetLanguage: project.targetLanguage,
      originalText: project.originalText,
      translatedText: project.translatedText,
      segments: project.segments
    }, null, 2);
  }
}

module.exports = SubtitleGenerator;

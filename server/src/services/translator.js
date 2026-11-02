const axios = require('axios');

/**
 * Supported Languages map
 */
const SUPPORTED_LANGUAGES = {
  'af': 'Afrikaans',
  'sq': 'Albanian',
  'am': 'Amharic',
  'ar': 'Arabic',
  'hy': 'Armenian',
  'az': 'Azerbaijani',
  'eu': 'Basque',
  'be': 'Belarusian',
  'bn': 'Bengali',
  'bs': 'Bosnian',
  'bg': 'Bulgarian',
  'ca': 'Catalan',
  'ceb': 'Cebuano',
  'ny': 'Chichewa',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'co': 'Corsican',
  'hr': 'Croatian',
  'cs': 'Czech',
  'da': 'Danish',
  'nl': 'Dutch',
  'en': 'English',
  'eo': 'Esperanto',
  'et': 'Estonian',
  'tl': 'Filipino',
  'fi': 'Finnish',
  'fr': 'French',
  'fy': 'Frisian',
  'gl': 'Galician',
  'ka': 'Georgian',
  'de': 'German',
  'el': 'Greek',
  'gu': 'Gujarati',
  'ht': 'Haitian Creole',
  'ha': 'Hausa',
  'haw': 'Hawaiian',
  'he': 'Hebrew',
  'hi': 'Hindi',
  'hmn': 'Hmong',
  'hu': 'Hungarian',
  'is': 'Icelandic',
  'ig': 'Igbo',
  'id': 'Indonesian',
  'ga': 'Irish',
  'it': 'Italian',
  'ja': 'Japanese',
  'jw': 'Javanese',
  'kn': 'Kannada',
  'kk': 'Kazakh',
  'km': 'Khmer',
  'ko': 'Korean',
  'ku': 'Kurdish (Kurmanji)',
  'ky': 'Kyrgyz',
  'lo': 'Lao',
  'la': 'Latin',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'lb': 'Luxembourgish',
  'mk': 'Macedonian',
  'mg': 'Malagasy',
  'ms': 'Malay',
  'ml': 'Malayalam',
  'mt': 'Maltese',
  'mi': 'Maori',
  'mr': 'Marathi',
  'mn': 'Mongolian',
  'my': 'Myanmar (Burmese)',
  'ne': 'Nepali',
  'no': 'Norwegian',
  'or': 'Odia',
  'ps': 'Pashto',
  'fa': 'Persian',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'pa': 'Punjabi',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sm': 'Samoan',
  'gd': 'Scots Gaelic',
  'sr': 'Serbian',
  'st': 'Sesotho',
  'sn': 'Shona',
  'sd': 'Sindhi',
  'si': 'Sinhala',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'so': 'Somali',
  'es': 'Spanish',
  'su': 'Sundanese',
  'sw': 'Swahili',
  'sv': 'Swedish',
  'tg': 'Tajik',
  'ta': 'Tamil',
  'tt': 'Tatar',
  'te': 'Telugu',
  'th': 'Thai',
  'tr': 'Turkish',
  'tk': 'Turkmen',
  'uk': 'Ukrainian',
  'ur': 'Urdu',
  'ug': 'Uyghur',
  'uz': 'Uzbek',
  'vi': 'Vietnamese',
  'cy': 'Welsh',
  'xh': 'Xhosa',
  'yi': 'Yiddish',
  'yo': 'Yoruba',
  'zu': 'Zulu'
};

/**
 * Port of Python googletrans.Translator in Node.js
 */
class TranslatorService {
  /**
   * Get supported languages list
   */
  static getSupportedLanguages() {
    return Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
      code,
      name
    }));
  }

  /**
   * Translate text to target language
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code (e.g. 'es')
   * @param {string} sourceLang - Source language code (default 'auto')
   * @returns {Promise<{ translatedText: string, detectedSourceLang: string }>}
   */
  static async translateText(text, targetLang = 'es', sourceLang = 'auto') {
    if (!text || !text.trim()) {
      return { translatedText: '', detectedSourceLang: sourceLang };
    }

    const cleanTargetLang = targetLang.trim().toLowerCase();

    // 1. Primary Engine: Google Translate API (dict-chrome-ex client)
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=${sourceLang}&tl=${cleanTargetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      if (response.data && response.data[0]) {
        const translatedChunks = response.data[0].map(item => item[0]).filter(Boolean);
        const translatedText = translatedChunks.join('');
        const detectedSourceLang = response.data[2] || sourceLang;
        return { translatedText, detectedSourceLang };
      }
    } catch (googleErr) {
      console.warn(`[Translator] Primary Google endpoint failed: ${googleErr.message}. Trying secondary...`);
    }

    // 2. Secondary Engine: MyMemory free translation API fallback
    try {
      const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${sourceLang === 'auto' ? 'en' : sourceLang}|${cleanTargetLang}`;
      const memRes = await axios.get(memUrl, { timeout: 8000 });
      if (memRes.data && memRes.data.responseData && memRes.data.responseData.translatedText) {
        return {
          translatedText: memRes.data.responseData.translatedText,
          detectedSourceLang: sourceLang
        };
      }
    } catch (memErr) {
      console.warn(`[Translator] Secondary fallback failed: ${memErr.message}`);
    }

    // If both failed, return original with note
    return {
      translatedText: text,
      detectedSourceLang: sourceLang
    };
  }

  /**
   * Translate array of segments
   * @param {Array<{ index: number, start: number, end: number, text: string }>} segments
   * @param {string} targetLang
   * @param {string} sourceLang
   * @returns {Promise<Array<{ index: number, start: number, end: number, text: string, translatedText: string }>>}
   */
  static async translateSegments(segments, targetLang = 'es', sourceLang = 'auto') {
    if (!segments || segments.length === 0) return [];

    const translatedSegments = [];

    for (const seg of segments) {
      if (!seg.text || !seg.text.trim()) {
        translatedSegments.push({
          ...seg,
          translatedText: ''
        });
        continue;
      }

      try {
        const res = await this.translateText(seg.text, targetLang, sourceLang);
        translatedSegments.push({
          ...seg,
          translatedText: res.translatedText
        });
      } catch (err) {
        console.error(`[Translator] Error translating segment ${seg.index}:`, err.message);
        translatedSegments.push({
          ...seg,
          translatedText: seg.text
        });
      }
    }

    return translatedSegments;
  }
}

module.exports = TranslatorService;

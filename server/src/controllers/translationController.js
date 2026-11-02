const TranslatorService = require('../services/translator');

/**
 * Standalone Translation Controller
 */
exports.translateText = async (req, res) => {
  try {
    const { text, targetLanguage = 'es', sourceLanguage = 'auto' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for translation' });
    }

    const result = await TranslatorService.translateText(text, targetLanguage, sourceLanguage);
    res.json({
      success: true,
      originalText: text,
      targetLanguage,
      sourceLanguage: result.detectedSourceLang,
      translatedText: result.translatedText
    });
  } catch (error) {
    res.status(500).json({ error: 'Translation failed', details: error.message });
  }
};

/**
 * Get all supported languages
 */
exports.getSupportedLanguages = (req, res) => {
  try {
    const languages = TranslatorService.getSupportedLanguages();
    res.json({ success: true, count: languages.length, languages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve languages', details: error.message });
  }
};

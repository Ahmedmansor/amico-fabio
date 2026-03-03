/**
 * I18nService - Internationalization Service
 * Handles language loading and translation retrieval
 */
export class I18nService {
  static currentLang = 'it'; // Default language
  static translations = {};
  static supportedLanguages = ['en', 'it'];

  /**
   * Load language data from JSON file
   * @param {string} lang - Language code ('en' or 'it')
   * @returns {Promise<Object>} The loaded translations
   */
  static async loadLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.warn(`Language '${lang}' not supported. Falling back to 'it'`);
      lang = 'it';
    }

    try {
      // Dynamic import for Vite compatibility
      const response = await fetch(`/assets/js/data/i18n/${lang}.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to load language file: ${response.statusText}`);
      }

      this.translations = await response.json();
      this.currentLang = lang;
      
      console.log(`✓ Language '${lang}' loaded successfully`);
      return this.translations;
    } catch (error) {
      console.error(`Error loading language '${lang}':`, error);
      
      // Fallback to default language if not already trying it
      if (lang !== 'it') {
        console.log('Attempting to load fallback language (it)...');
        return this.loadLanguage('it');
      }
      
      throw error;
    }
  }

  /**
   * Get translation for a given key (supports nested keys)
   * @param {string} key - Translation key (e.g., 'menu.home' or 'global.brand_title')
   * @returns {string|Object} The translation value or the key itself if not found
   */
  static translate(key) {
    if (!key) return '';

    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: '${key}'`);
        return key; // Return the key itself if translation not found
      }
    }

    return value;
  }

  /**
   * Alias for translate method (shorter syntax)
   * @param {string} key - Translation key
   * @returns {string|Object} The translation value
   */
  static t(key) {
    return this.translate(key);
  }

  /**
   * Get current language code
   * @returns {string} Current language code
   */
  static getCurrentLanguage() {
    return this.currentLang;
  }

  /**
   * Check if a language is supported
   * @param {string} lang - Language code to check
   * @returns {boolean} True if supported
   */
  static isSupported(lang) {
    return this.supportedLanguages.includes(lang);
  }

  /**
   * Get all translations for current language
   * @returns {Object} All translations
   */
  static getAll() {
    return this.translations;
  }

  /**
   * Switch language and reload translations
   * @param {string} lang - New language code
   * @returns {Promise<Object>} The loaded translations
   */
  static async switchLanguage(lang) {
    if (lang === this.currentLang) {
      console.log(`Already using language '${lang}'`);
      return this.translations;
    }

    return this.loadLanguage(lang);
  }
}

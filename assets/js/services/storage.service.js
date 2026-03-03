/**
 * StorageService - Local Storage Management Service
 * Wrapper for localStorage and sessionStorage with error handling
 */
export class StorageService {
  static STORAGE_PREFIX = 'fabio_';

  /**
   * Get prefixed key
   * @param {string} key - Storage key
   * @returns {string} Prefixed key
   */
  static getPrefixedKey(key) {
    return this.STORAGE_PREFIX + key;
  }

  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   * @returns {boolean} Success status
   */
  static setLocal(key, value) {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serialized = JSON.stringify(value);
      localStorage.setItem(prefixedKey, serialized);
      return true;
    } catch (error) {
      console.error(`Error setting localStorage item '${key}':`, error);
      return false;
    }
  }

  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Stored value or default
   */
  static getLocal(key, defaultValue = null) {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = localStorage.getItem(prefixedKey);
      
      if (item === null) {
        return defaultValue;
      }

      // Try to parse as JSON, but if it fails, return the raw string
      // This handles both JSON objects and simple strings like "it" or "en"
      try {
        return JSON.parse(item);
      } catch (parseError) {
        // If JSON.parse fails, it's likely a simple string - return as-is
        return item;
      }
    } catch (error) {
      console.error(`Error getting localStorage item '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  static removeLocal(key) {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      localStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage item '${key}':`, error);
      return false;
    }
  }

  /**
   * Clear all prefixed items from localStorage
   * @returns {boolean} Success status
   */
  static clearLocal() {
    try {
      const keys = Object.keys(localStorage);
      const prefixedKeys = keys.filter(k => k.startsWith(this.STORAGE_PREFIX));
      
      prefixedKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`Cleared ${prefixedKeys.length} localStorage items`);
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Set item in sessionStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   * @returns {boolean} Success status
   */
  static setSession(key, value) {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(prefixedKey, serialized);
      return true;
    } catch (error) {
      console.error(`Error setting sessionStorage item '${key}':`, error);
      return false;
    }
  }

  /**
   * Get item from sessionStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Stored value or default
   */
  static getSession(key, defaultValue = null) {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = sessionStorage.getItem(prefixedKey);
      
      if (item === null) {
        return defaultValue;
      }

      // Try to parse as JSON, but if it fails, return the raw string
      try {
        return JSON.parse(item);
      } catch (parseError) {
        // If JSON.parse fails, it's likely a simple string - return as-is
        return item;
      }
    } catch (error) {
      console.error(`Error getting sessionStorage item '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * Remove item from sessionStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  static removeSession(key) {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      sessionStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error(`Error removing sessionStorage item '${key}':`, error);
      return false;
    }
  }

  /**
   * Clear all prefixed items from sessionStorage
   * @returns {boolean} Success status
   */
  static clearSession() {
    try {
      const keys = Object.keys(sessionStorage);
      const prefixedKeys = keys.filter(k => k.startsWith(this.STORAGE_PREFIX));
      
      prefixedKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });

      console.log(`Cleared ${prefixedKeys.length} sessionStorage items`);
      return true;
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if available
   */
  static isLocalStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if sessionStorage is available
   * @returns {boolean} True if available
   */
  static isSessionStorageAvailable() {
    try {
      const test = '__storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get or set user language preference
   * @param {string} lang - Language code (optional, if provided will set)
   * @returns {string} Current language preference
   */
  static language(lang = null) {
    const LANG_KEY = 'user_language';
    
    if (lang !== null) {
      this.setLocal(LANG_KEY, lang);
      return lang;
    }

    return this.getLocal(LANG_KEY, 'it'); // Default to Italian
  }

  /**
   * Get all stored keys (both local and session)
   * @returns {Object} Object with local and session keys
   */
  static getAllKeys() {
    const localKeys = Object.keys(localStorage)
      .filter(k => k.startsWith(this.STORAGE_PREFIX))
      .map(k => k.replace(this.STORAGE_PREFIX, ''));

    const sessionKeys = Object.keys(sessionStorage)
      .filter(k => k.startsWith(this.STORAGE_PREFIX))
      .map(k => k.replace(this.STORAGE_PREFIX, ''));

    return {
      local: localKeys,
      session: sessionKeys
    };
  }

  /**
   * Clear all storage (both local and session)
   * @returns {boolean} Success status
   */
  static clearAll() {
    const localCleared = this.clearLocal();
    const sessionCleared = this.clearSession();
    return localCleared && sessionCleared;
  }
}

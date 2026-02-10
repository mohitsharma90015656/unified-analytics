/**
 * BaseProvider - Abstract base class for analytics providers
 */

/**
 * Abstract base class that all analytics providers must extend
 */
export class BaseProvider {
  initialized = false;
  debug = false;

  /**
   * Check if provider is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Logger helper
   */
  log(...args) {
    if (this.debug) {
      console.log(`[Analytics:${this.name}]`, ...args);
    }
  }

  /**
   * Warning logger helper
   */
  warn(...args) {
    console.warn(`[Analytics:${this.name}]`, ...args);
  }

  /**
   * Error logger helper
   */
  error(...args) {
    console.error(`[Analytics:${this.name}]`, ...args);
  }

  /**
   * Ensure provider is initialized before operations
   */
  ensureInitialized() {
    if (!this.initialized) {
      this.warn('Provider not initialized. Call init() first.');
      return false;
    }
    return true;
  }

  /**
   * Safe string conversion for segments
   */
  safeString(value) {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Convert properties to string values (required by some SDKs)
   */
  stringifyProperties(properties) {
    if (!properties) return {};

    const result = {};
    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined) {
        result[key] = this.safeString(value);
      }
    }
    return result;
  }

}

/**
 * Helper utilities for Unified Analytics
 */

/**
 * Create a logger with debug flag
 */
export function createLogger(debug) {
  return {
    log: (...args) => {
      if (debug) {
        console.log('[UnifiedAnalytics]', ...args);
      }
    },
    warn: (...args) => {
      console.warn('[UnifiedAnalytics]', ...args);
    },
    error: (...args) => {
      console.error('[UnifiedAnalytics]', ...args);
    },
  };
}

/**
 * Safe string conversion
 */
export function safeString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Validate configuration
 */
export function validateConfig(config) {
  const errors = [];

  // At least one provider must be configured
  if (!config.countly && !config.posthog) {
    errors.push('At least one provider (countly or posthog) must be configured');
  }

  // Validate Countly config
  if (config.countly) {
    if (!config.countly.serverUrl) {
      errors.push('countly.serverUrl is required');
    }
    if (!config.countly.appKey) {
      errors.push('countly.appKey is required');
    }
  }

  // Validate PostHog config
  if (config.posthog) {
    if (!config.posthog.apiKey) {
      errors.push('posthog.apiKey is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Deep merge objects
 */
export function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout = null;

  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

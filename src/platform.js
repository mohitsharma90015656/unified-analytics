/**
 * Platform configuration for unified-analytics
 *
 * Platform is determined by:
 * 1. Explicit config passed to analytics.init({ platform: 'web' | 'native' })
 * 2. Auto-detection fallback
 */

let currentPlatform = null;

/**
 * Detect platform automatically as a fallback
 */
function autoDetectPlatform() {
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.product === 'ReactNative'
    ) {
      return 'native';
    }
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return 'web';
    }
  } catch (e) {
    // Fallback
  }
  return 'native';
}

/**
 * Set the platform explicitly
 * @param {'web' | 'native'} platform
 */
export function setPlatform(platform) {
  if (platform !== 'web' && platform !== 'native') {
    throw new Error(
      `Invalid platform: "${platform}". Must be "web" or "native".`,
    );
  }
  currentPlatform = platform;
}

/**
 * Get the current platform (auto-detects if not set)
 * @returns {'web' | 'native'}
 */
export function getPlatform() {
  if (!currentPlatform) {
    currentPlatform = autoDetectPlatform();
  }
  return currentPlatform;
}

/**
 * Check if current platform is web
 * @returns {boolean}
 */
export function isWeb() {
  return getPlatform() === 'web';
}

/**
 * Check if current platform is native (React Native)
 * @returns {boolean}
 */
export function isNative() {
  return getPlatform() === 'native';
}

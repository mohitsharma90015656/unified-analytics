/**
 * Unified Analytics Library
 *
 * A unified analytics library that supports multiple providers
 * (Countly, PostHog, etc.) with a single API.
 */

// Main analytics instance and class
export { analytics, UnifiedAnalytics } from './UnifiedAnalytics';

// React integration
export { AnalyticsProvider, useAnalyticsContext } from './context/AnalyticsProvider';
export { useAnalytics } from './hooks/useAnalytics';

// Providers (for advanced usage)
export { BaseProvider } from './providers/BaseProvider';
export { CountlyProvider } from './providers/CountlyProvider';
export { PostHogProvider } from './providers/PostHogProvider';

// Platform utilities
export { setPlatform, getPlatform, isWeb, isNative } from './platform';

// Utilities (for advanced usage)
export {
  createLogger,
  validateConfig,
} from './utils/helpers';

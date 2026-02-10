/**
 * useAnalytics - React hook for accessing analytics
 */

import { useCallback } from 'react';
import { useAnalyticsContext } from '../context/AnalyticsProvider';
import { analytics } from '../UnifiedAnalytics';

/**
 * useAnalytics hook
 * Provides access to all analytics methods
 *
 * Usage:
 * ```jsx
 * function MyComponent() {
 *   const { trackEvent, countly, posthog } = useAnalytics();
 *
 *   // Core events
 *   trackEvent('button_click', { button: 'submit' });
 *
 *   // Countly-specific
 *   if (countly) {
 *     countly.startTimedEvent('form_fill');
 *   }
 *
 *   // PostHog-specific
 *   if (posthog) {
 *     const flag = posthog.getFeatureFlag('new_feature');
 *   }
 * }
 * ```
 */
export function useAnalytics() {
  const { isInitialized } = useAnalyticsContext();

  // Core methods - memoized for performance
  const trackEvent = useCallback((name, properties) => {
    analytics.trackEvent(name, properties);
  }, []);

  const trackView = useCallback((viewName, properties) => {
    analytics.trackView(viewName, properties);
  }, []);

  const setScreenViewOverride = useCallback((screenName, customName) => {
    analytics.setScreenViewOverride(screenName, customName);
  }, []);

  const clearScreenViewOverride = useCallback((screenName) => {
    analytics.clearScreenViewOverride(screenName);
  }, []);

  const identify = useCallback((userId, properties) => {
    analytics.identify(userId, properties);
  }, []);

  const setUserProperties = useCallback((properties) => {
    analytics.setUserProperties(properties);
  }, []);

  const reset = useCallback(() => {
    analytics.reset();
  }, []);

  // Provider info
  const getEnabledProviders = useCallback(() => {
    return analytics.getEnabledProviders();
  }, []);

  const hasProvider = useCallback((name) => {
    return analytics.hasProvider(name);
  }, []);

  // Global properties (unified)
  const setGlobalProperties = useCallback((properties) => {
    analytics.setGlobalProperties(properties);
  }, []);

  const getGlobalProperties = useCallback(() => {
    return analytics.getGlobalProperties();
  }, []);

  const clearGlobalProperties = useCallback(() => {
    analytics.clearGlobalProperties();
  }, []);

  const removeGlobalProperty = useCallback((key) => {
    analytics.removeGlobalProperty(key);
  }, []);

  // Timed events (unified)
  const startTimer = useCallback((eventName) => {
    analytics.startTimer(eventName);
  }, []);

  const endTimer = useCallback((eventName, properties) => {
    analytics.endTimer(eventName, properties);
  }, []);

  // Error tracking (unified)
  const trackError = useCallback((error, metadata) => {
    analytics.trackError(error, metadata);
  }, []);

  // Session management (deprecated - auto-managed by Countly SDK)
  /** @deprecated Sessions are now auto-managed. This is a no-op. */
  const startSession = useCallback(() => {
    analytics.startSession();
  }, []);

  /** @deprecated Sessions are now auto-managed. This is a no-op. */
  const endSession = useCallback(() => {
    analytics.endSession();
  }, []);

  // Feature flags (unified)
  const getFeatureFlag = useCallback((key) => {
    return analytics.getFeatureFlag(key);
  }, []);

  const isFeatureEnabled = useCallback((key) => {
    return analytics.isFeatureEnabled(key);
  }, []);

  const getAllFeatureFlags = useCallback(() => {
    return analytics.getAllFeatureFlags();
  }, []);

  const onFeatureFlagsChange = useCallback((callback) => {
    return analytics.onFeatureFlagsChange(callback);
  }, []);

  return {
    isInitialized,

    // Core methods
    trackEvent,
    trackView,
    identify,
    setUserProperties,
    reset,

    // Global properties (unified)
    setGlobalProperties,
    getGlobalProperties,
    clearGlobalProperties,
    removeGlobalProperty,

    // Timed events (unified)
    startTimer,
    endTimer,

    // Error tracking (unified)
    trackError,

    // Session management (unified)
    startSession,
    endSession,

    // Feature flags (unified)
    getFeatureFlag,
    isFeatureEnabled,
    getAllFeatureFlags,
    onFeatureFlagsChange,

    // Screen view overrides
    setScreenViewOverride,
    clearScreenViewOverride,

    // Provider info
    getEnabledProviders,
    hasProvider,

    // ❌ NO countly: object
    // ❌ NO posthog: object
  };
}

export default useAnalytics;

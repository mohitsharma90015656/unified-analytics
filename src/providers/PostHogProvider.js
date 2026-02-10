/**
 * PostHogProvider - Platform-aware factory
 *
 * Delegates to native (React Native) or web implementation
 * based on the platform configuration.
 */

import { getPlatform } from '../platform';

/**
 * PostHog analytics provider - platform proxy
 */
export class PostHogProvider {
  constructor() {
    this._impl = null;
    this._debug = false;
  }

  async init(config) {
    const platform = getPlatform();

    let ProviderClass;
    if (platform === 'web') {
      const mod = await import('./PostHogProvider.web.js');
      ProviderClass = mod.PostHogProviderWeb;
    } else {
      // webpackIgnore prevents webpack from bundling the native file on web
      const mod = await import(/* webpackIgnore: true */ './PostHogProvider.native.js');
      ProviderClass = mod.PostHogProviderNative;
    }

    this._impl = new ProviderClass();
    this._impl.setDebug(this._debug);
    return this._impl.init(config);
  }

  setDebug(enabled) {
    this._debug = enabled;
    if (this._impl) this._impl.setDebug(enabled);
  }

  // ==========================================
  // DELEGATED METHODS
  // ==========================================

  isInitialized() {
    return this._impl?.isInitialized() ?? false;
  }

  trackEvent(name, properties) {
    this._impl?.trackEvent(name, properties);
  }

  trackView(viewName, properties) {
    this._impl?.trackView(viewName, properties);
  }

  identify(userId, properties, propertiesSetOnce) {
    this._impl?.identify(userId, properties, propertiesSetOnce);
  }

  setUserProperties(properties, propertiesSetOnce) {
    this._impl?.setUserProperties(properties, propertiesSetOnce);
  }

  reset(resetDeviceId) {
    this._impl?.reset(resetDeviceId);
  }

  // Session recording
  startSessionRecording() {
    this._impl?.startSessionRecording();
  }

  stopSessionRecording() {
    this._impl?.stopSessionRecording();
  }

  isSessionRecordingActive() {
    return this._impl?.isSessionRecordingActive() ?? false;
  }

  getSessionReplayUrl(options) {
    return this._impl?.getSessionReplayUrl?.(options) ?? null;
  }

  getSessionId() {
    return this._impl?.getSessionId?.() ?? null;
  }

  // Feature flags
  getFeatureFlag(key) {
    return this._impl?.getFeatureFlag(key) ?? undefined;
  }

  getFeatureFlagPayload(key) {
    return this._impl?.getFeatureFlagPayload?.(key) ?? undefined;
  }

  isFeatureEnabled(key) {
    return this._impl?.isFeatureEnabled(key) ?? false;
  }

  async reloadFeatureFlags() {
    return this._impl?.reloadFeatureFlags();
  }

  onFeatureFlags(callback) {
    this._impl?.onFeatureFlags(callback);
  }

  getAllFeatureFlags() {
    return this._impl?.getAllFeatureFlags() ?? {};
  }

  setPersonPropertiesForFlags(properties, reloadFeatureFlags) {
    this._impl?.setPersonPropertiesForFlags?.(properties, reloadFeatureFlags);
  }

  // Group analytics
  group(type, key, properties) {
    this._impl?.group(type, key, properties);
  }

  getGroups() {
    return this._impl?.getGroups?.() ?? {};
  }

  resetGroups() {
    this._impl?.resetGroups?.();
  }

  // Surveys
  async getSurveys(forceReload) {
    return this._impl?.getSurveys?.(forceReload) ?? [];
  }

  async getActiveMatchingSurveys(forceReload) {
    return this._impl?.getActiveMatchingSurveys?.(forceReload) ?? [];
  }

  // Event aliases
  capture(eventName, properties) {
    this._impl?.capture?.(eventName, properties) ?? this._impl?.trackEvent(eventName, properties);
  }

  screen(screenName, properties) {
    this._impl?.screen?.(screenName, properties) ?? this._impl?.trackView(screenName, properties);
  }

  // Data management
  async flush() {
    return this._impl?.flush();
  }

  async shutdown() {
    return this._impl?.shutdown();
  }

  // Tracking control
  setDisabled(disabled) {
    this._impl?.setDisabled(disabled);
  }

  isDisabled() {
    return this._impl?.isDisabled() ?? true;
  }

  optIn() {
    this._impl?.optIn();
  }

  optOut() {
    this._impl?.optOut();
  }

  hasOptedOut() {
    return this._impl?.hasOptedOut() ?? false;
  }

  // Distinct ID
  getDistinctId() {
    return this._impl?.getDistinctId() ?? null;
  }

  alias(alias, distinctId) {
    this._impl?.alias(alias, distinctId);
  }

  // Super properties
  register(properties, days) {
    this._impl?.register(properties, days);
  }

  registerOnce(properties, defaultValue, days) {
    this._impl?.registerOnce?.(properties, defaultValue, days);
  }

  registerForSession(properties) {
    this._impl?.registerForSession?.(properties);
  }

  getRegisteredProperties() {
    return this._impl?.getRegisteredProperties() ?? {};
  }

  clearRegisteredProperties() {
    this._impl?.clearRegisteredProperties();
  }

  unregister(propertyName) {
    this._impl?.unregister(propertyName);
  }
}

/**
 * CountlyProvider - Platform-aware factory
 *
 * Delegates to native (React Native) or web implementation
 * based on the platform configuration.
 */

import { getPlatform } from '../platform';

/**
 * Countly analytics provider - platform proxy
 */
export class CountlyProvider {
  constructor() {
    this._impl = null;
    this._debug = false;
  }

  async init(config) {
    const platform = getPlatform();

    let ProviderClass;
    if (platform === 'web') {
      const mod = await import('./CountlyProvider.web.js');
      ProviderClass = mod.CountlyProviderWeb;
    } else {
      // webpackIgnore prevents webpack from bundling the native file on web
      const mod = await import(/* webpackIgnore: true */ './CountlyProvider.native.js');
      ProviderClass = mod.CountlyProviderNative;
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

  identify(userId, properties) {
    this._impl?.identify(userId, properties);
  }

  setUserProperties(properties) {
    this._impl?.setUserProperties(properties);
  }

  reset() {
    this._impl?.reset();
  }

  // User context
  setUserContext(properties) {
    this._impl?.setUserContext(properties);
  }

  getUserContext() {
    return this._impl?.getUserContext() ?? {};
  }

  clearUserContext() {
    this._impl?.clearUserContext();
  }

  // Timed events
  startTimedEvent(name) {
    this._impl?.startTimedEvent(name);
  }

  endTimedEvent(name, segments) {
    this._impl?.endTimedEvent(name, segments);
  }

  cancelTimedEvent(name) {
    this._impl?.cancelTimedEvent?.(name);
  }

  // Error tracking
  trackError(options) {
    this._impl?.trackError(options);
  }

  addCrashLog(message) {
    this._impl?.addCrashLog(message);
  }

  // Session management
  startSession() {
    this._impl?.startSession();
  }

  endSession() {
    this._impl?.endSession();
  }

  // User data operations
  incrementUserProperty(key, value) {
    this._impl?.incrementUserProperty(key, value);
  }

  addToCohort(name) {
    this._impl?.addToCohort(name);
  }

  removeFromCohort(name) {
    this._impl?.removeFromCohort(name);
  }

  setUserProfile(profile) {
    this._impl?.setUserProfile(profile);
  }

  // Device ID
  changeDeviceId(newDeviceId, mergeOnServer) {
    this._impl?.changeDeviceId(newDeviceId, mergeOnServer);
  }

  async getDeviceId() {
    return this._impl?.getDeviceId() ?? null;
  }

  enableTemporaryDeviceIdMode() {
    this._impl?.enableTemporaryDeviceIdMode();
  }

  // Location
  setLocation(countryCode, city, gpsCoordinates, ipAddress) {
    this._impl?.setLocation(countryCode, city, gpsCoordinates, ipAddress);
  }

  disableLocation() {
    this._impl?.disableLocation();
  }

  // Consent
  giveConsent(features) {
    this._impl?.giveConsent(features);
  }

  removeConsent(features) {
    this._impl?.removeConsent(features);
  }

  giveAllConsent() {
    this._impl?.giveAllConsent();
  }

  removeAllConsent() {
    this._impl?.removeAllConsent();
  }

  // Web-only (no-op on native)
  trackScrolls() {
    this._impl?.trackScrolls?.();
  }

  trackLinks() {
    this._impl?.trackLinks?.();
  }

  trackForms() {
    this._impl?.trackForms?.();
  }
}

/**
 * PostHogProvider Web - PostHog SDK wrapper for Web (React.js/Next.js)
 *
 * Uses posthog-js for browser-based analytics.
 */

import { BaseProvider } from "./BaseProvider";

let posthog = null;

export class PostHogProviderWeb extends BaseProvider {
  name = "posthog";
  config = null;
  posthogClient = null;
  sessionRecordingActive = false;
  featureFlagsCallback = null;
  registeredProperties = {};

  async init(config) {
    if (this.initialized) {
      this.warn("Already initialized");
      return;
    }

    this.config = config;
    this.debug = config.debug ?? false;

    try {
      const PostHogModule = await import("posthog-js");
      posthog = PostHogModule.default || PostHogModule;

      // Web SDK initialization
      posthog.init(config.apiKey, {
        api_host: config.host || "https://us.i.posthog.com",
        debug: config.debug || false,
        disable_session_recording: !config.enableSessionReplay,
        autocapture: config.autocapture?.captureClicks ?? false,
        capture_pageview: config.autocapture?.capturePageviews ?? false,
        capture_pageleave: config.autocapture?.capturePageleave ?? true,
        persistence: config.persistence || "localStorage+cookie",

        // Session replay config for web
        ...(config.enableSessionReplay && config.sessionReplay
          ? {
              session_recording: {
                maskAllInputs: config.sessionReplay.maskAllTextInputs ?? false,
                maskTextContent: config.sessionReplay.maskAllImages ?? false,
              },
            }
          : {}),

        // Bootstrap
        ...(config.bootstrap
          ? {
              bootstrap: {
                distinctID: config.bootstrap.distinctId,
                featureFlags: config.bootstrap.featureFlags,
              },
            }
          : {}),

        // Feature flags timeout
        ...(config.featureFlagsRequestTimeoutMs
          ? {
              feature_flag_request_timeout_ms:
                config.featureFlagsRequestTimeoutMs,
            }
          : {}),

        loaded: (ph) => {
          this.log("PostHog web SDK loaded");
        },
      });

      this.posthogClient = posthog;
      this.initialized = true;
      this.log("Initialized successfully (web)");
    } catch (error) {
      this.error("Initialization failed:", error);
      throw error;
    }
  }

  setDebug(enabled) {
    this.debug = enabled;
  }

  trackEvent(name, properties) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.capture(name, properties || {});
      this.log("Event tracked:", name, properties);
    } catch (error) {
      this.error("trackEvent error:", error);
    }
  }

  trackView(viewName, properties) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.capture("$pageview", {
        $current_url: viewName,
        ...(properties || {}),
      });
      this.log("View tracked:", viewName);
    } catch (error) {
      this.error("trackView error:", error);
    }
  }

  identify(userId, properties, propertiesSetOnce) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.identify(userId, properties || {}, propertiesSetOnce);
      this.log("User identified:", userId);
    } catch (error) {
      this.error("identify error:", error);
    }
  }

  setUserProperties(properties, propertiesSetOnce) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.setPersonProperties(properties, propertiesSetOnce);
      this.log("User properties set");
    } catch (error) {
      this.error("setUserProperties error:", error);
    }
  }

  reset(resetDeviceId) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.reset(resetDeviceId);
      this.log("User reset");
    } catch (error) {
      this.error("reset error:", error);
    }
  }

  // ==========================================
  // SESSION RECORDING
  // ==========================================

  startSessionRecording() {
    if (!this.ensureInitialized()) return;

    try {
      if (this.posthogClient.startSessionRecording) {
        this.posthogClient.startSessionRecording();
        this.sessionRecordingActive = true;
        this.log("Session recording started");
      }
    } catch (error) {
      this.error("startSessionRecording error:", error);
    }
  }

  stopSessionRecording() {
    if (!this.ensureInitialized()) return;

    try {
      if (this.posthogClient.stopSessionRecording) {
        this.posthogClient.stopSessionRecording();
        this.sessionRecordingActive = false;
        this.log("Session recording stopped");
      }
    } catch (error) {
      this.error("stopSessionRecording error:", error);
    }
  }

  isSessionRecordingActive() {
    return this.sessionRecordingActive;
  }

  getSessionReplayUrl(options) {
    if (!this.ensureInitialized()) return null;

    try {
      return this.posthogClient.get_session_replay_url?.(options) || null;
    } catch (error) {
      this.error("getSessionReplayUrl error:", error);
      return null;
    }
  }

  getSessionId() {
    if (!this.ensureInitialized()) return null;

    try {
      return this.posthogClient.get_session_id?.() || null;
    } catch (error) {
      this.error("getSessionId error:", error);
      return null;
    }
  }

  // ==========================================
  // FEATURE FLAGS
  // ==========================================

  getFeatureFlag(key) {
    if (!this.ensureInitialized()) return undefined;

    try {
      return this.posthogClient.getFeatureFlag(key);
    } catch (error) {
      this.error("getFeatureFlag error:", error);
      return undefined;
    }
  }

  getFeatureFlagPayload(key) {
    if (!this.ensureInitialized()) return undefined;

    try {
      return this.posthogClient.getFeatureFlagPayload?.(key);
    } catch (error) {
      this.error("getFeatureFlagPayload error:", error);
      return undefined;
    }
  }

  isFeatureEnabled(key) {
    if (!this.ensureInitialized()) return false;

    try {
      return this.posthogClient.isFeatureEnabled?.(key) ?? false;
    } catch (error) {
      this.error("isFeatureEnabled error:", error);
      return false;
    }
  }

  async reloadFeatureFlags() {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.reloadFeatureFlags();
      this.log("Feature flags reloaded");

      if (this.featureFlagsCallback) {
        const flags = this.getAllFeatureFlags();
        this.featureFlagsCallback(flags);
      }
    } catch (error) {
      this.error("reloadFeatureFlags error:", error);
    }
  }

  onFeatureFlags(callback) {
    if (!this.ensureInitialized()) return;

    this.featureFlagsCallback = callback;
    this.posthogClient.onFeatureFlags?.(callback);
  }

  getAllFeatureFlags() {
    try {
      // Web SDK: use getFeatureFlags or internal method
      if (this.posthogClient.getFeatureFlags) {
        return this.posthogClient.getFeatureFlags();
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  setPersonPropertiesForFlags(properties, reloadFeatureFlags) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.setPersonPropertiesForFlags?.(
        properties,
        reloadFeatureFlags,
      );
      this.log("Person properties for flags set");
    } catch (error) {
      this.error("setPersonPropertiesForFlags error:", error);
    }
  }

  // ==========================================
  // GROUP ANALYTICS
  // ==========================================

  group(type, key, properties) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.group(type, key, properties || {});
      this.log("Group set:", type, key);
    } catch (error) {
      this.error("group error:", error);
    }
  }

  getGroups() {
    if (!this.ensureInitialized()) return {};

    try {
      return this.posthogClient.getGroups?.() || {};
    } catch (error) {
      return {};
    }
  }

  resetGroups() {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.resetGroups?.();
      this.log("Groups reset");
    } catch (error) {
      this.error("resetGroups error:", error);
    }
  }

  // ==========================================
  // SURVEYS
  // ==========================================

  async getSurveys(forceReload) {
    if (!this.ensureInitialized()) return [];

    try {
      return new Promise((resolve) => {
        this.posthogClient.getSurveys?.((surveys) => {
          resolve(surveys || []);
        }, forceReload);
      });
    } catch (error) {
      this.error("getSurveys error:", error);
      return [];
    }
  }

  async getActiveMatchingSurveys(forceReload) {
    if (!this.ensureInitialized()) return [];

    try {
      return new Promise((resolve) => {
        this.posthogClient.getActiveMatchingSurveys?.((surveys) => {
          resolve(surveys || []);
        }, forceReload);
      });
    } catch (error) {
      this.error("getActiveMatchingSurveys error:", error);
      return [];
    }
  }

  // ==========================================
  // EVENT ALIASES
  // ==========================================

  capture(eventName, properties) {
    this.trackEvent(eventName, properties);
  }

  screen(screenName, properties) {
    this.trackView(screenName, properties);
  }

  // ==========================================
  // DATA MANAGEMENT
  // ==========================================

  async flush() {
    if (!this.ensureInitialized()) return;

    try {
      // Web SDK auto-flushes, but call if available
      if (this.posthogClient.flush) {
        this.posthogClient.flush();
        this.log("Events flushed");
      }
    } catch (error) {
      this.error("flush error:", error);
    }
  }

  async shutdown() {
    if (!this.ensureInitialized()) return;

    try {
      if (this.posthogClient.shutdown) {
        this.posthogClient.shutdown();
        this.initialized = false;
        this.log("Shutdown complete");
      }
    } catch (error) {
      this.error("shutdown error:", error);
    }
  }

  // ==========================================
  // TRACKING CONTROL
  // ==========================================

  setDisabled(disabled) {
    if (!this.posthogClient) {
      this.warn("PostHog not initialized");
      return;
    }

    try {
      this.posthogClient.disabled = disabled;
      this.log(disabled ? "Tracking disabled" : "Tracking enabled");
    } catch (error) {
      this.error("setDisabled error:", error);
    }
  }

  isDisabled() {
    if (!this.posthogClient) return true;
    return this.posthogClient.disabled ?? false;
  }

  optIn() {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.opt_in_capturing();
      this.log("Opted in to tracking");
    } catch (error) {
      this.error("optIn error:", error);
    }
  }

  optOut() {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.opt_out_capturing();
      this.log("Opted out of tracking");
    } catch (error) {
      this.error("optOut error:", error);
    }
  }

  hasOptedOut() {
    if (!this.posthogClient) return false;
    try {
      return this.posthogClient.has_opted_out_capturing?.() ?? false;
    } catch (error) {
      return false;
    }
  }

  // ==========================================
  // DISTINCT ID
  // ==========================================

  getDistinctId() {
    if (!this.ensureInitialized()) return null;

    try {
      return this.posthogClient.get_distinct_id?.() || null;
    } catch (error) {
      this.error("getDistinctId error:", error);
      return null;
    }
  }

  alias(alias, distinctId) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.alias(alias, distinctId);
      this.log("Alias created:", alias);
    } catch (error) {
      this.error("alias error:", error);
    }
  }

  // ==========================================
  // SUPER PROPERTIES
  // ==========================================

  register(properties, days) {
    if (!this.ensureInitialized()) return;

    try {
      this.registeredProperties = {
        ...this.registeredProperties,
        ...properties,
      };

      this.posthogClient.register(properties, days);
      this.log("Super properties registered:", properties);
    } catch (error) {
      this.error("register error:", error);
    }
  }

  registerOnce(properties, defaultValue, days) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.register_once(properties, defaultValue, days);
      this.registeredProperties = {
        ...this.registeredProperties,
        ...properties,
      };
      this.log("Super properties registered once:", properties);
    } catch (error) {
      this.error("registerOnce error:", error);
    }
  }

  registerForSession(properties) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.register_for_session(properties);
      this.log("Session super properties registered:", properties);
    } catch (error) {
      this.error("registerForSession error:", error);
    }
  }

  getRegisteredProperties() {
    return { ...this.registeredProperties };
  }

  clearRegisteredProperties() {
    if (!this.ensureInitialized()) return;

    try {
      for (const key of Object.keys(this.registeredProperties)) {
        this.posthogClient.unregister(key);
      }
      this.registeredProperties = {};
      this.log("All super properties cleared");
    } catch (error) {
      this.error("clearRegisteredProperties error:", error);
    }
  }

  unregister(propertyName) {
    if (!this.ensureInitialized()) return;

    try {
      delete this.registeredProperties[propertyName];
      this.posthogClient.unregister(propertyName);
      this.log("Super property unregistered:", propertyName);
    } catch (error) {
      this.error("unregister error:", error);
    }
  }
}

// Alias export so Metro's platform resolution (which picks .web.js on web)
// provides the expected named export for consumers importing { PostHogProvider }
export { PostHogProviderWeb as PostHogProvider };

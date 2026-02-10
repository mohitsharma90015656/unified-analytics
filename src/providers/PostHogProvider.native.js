/**
 * PostHogProvider Native - PostHog SDK wrapper for React Native
 *
 * Uses posthog-react-native for mobile analytics.
 */

import { BaseProvider } from './BaseProvider';

let PostHog = null;

export class PostHogProviderNative extends BaseProvider {
  name = 'posthog';
  config = null;
  posthogClient = null;
  sessionRecordingActive = false;
  featureFlagsCallback = null;
  registeredProperties = {};

  async init(config) {
    if (this.initialized) {
      this.warn('Already initialized');
      return;
    }

    this.config = config;
    this.debug = config.debug ?? false;

    try {
      const PostHogModule = await import('posthog-react-native');
      PostHog = PostHogModule.default || PostHogModule.PostHog;

      const options = {
        host: config.host || 'https://us.i.posthog.com',
        debug: config.debug || false,
        disabled: config.disabled || false,
      };

      if (config.flushInterval !== undefined) {
        options.flushInterval = config.flushInterval;
      }
      if (config.flushAt !== undefined) {
        options.flushAt = config.flushAt;
      }

      if (config.captureNativeAppLifecycleEvents !== undefined) {
        options.captureNativeAppLifecycleEvents =
          config.captureNativeAppLifecycleEvents;
      }

      if (config.featureFlagsRequestTimeoutMs !== undefined) {
        options.featureFlagsRequestTimeoutMs =
          config.featureFlagsRequestTimeoutMs;
      }

      if (config.enableSessionReplay) {
        options.enableSessionReplay = true;

        if (config.sessionReplay) {
          options.sessionReplayConfig = {
            maskAllTextInputs: config.sessionReplay.maskAllTextInputs ?? true,
            maskAllImages: config.sessionReplay.maskAllImages ?? true,
            captureLog: config.sessionReplay.captureLog ?? true,
            captureNetworkTelemetry:
              config.sessionReplay.captureNetworkTelemetry ?? true,
          };

          if (config.sessionReplay.androidDebouncerDelayMs !== undefined) {
            options.sessionReplayConfig.androidDebouncerDelayMs =
              config.sessionReplay.androidDebouncerDelayMs;
          }
          if (config.sessionReplay.iOSdebouncerDelayMs !== undefined) {
            options.sessionReplayConfig.iOSdebouncerDelayMs =
              config.sessionReplay.iOSdebouncerDelayMs;
          }
        }

        this.log('Session replay enabled with config:', options.sessionReplayConfig);
      }

      if (config.autocapture) {
        options.autocapture = {
          captureScreens: config.autocapture.captureScreens ?? true,
        };

        if (config.autocapture.captureTouches !== undefined) {
          options.autocapture.captureTouches = config.autocapture.captureTouches;
        }
        if (config.autocapture.maxElementsCaptured !== undefined) {
          options.autocapture.maxElementsCaptured =
            config.autocapture.maxElementsCaptured;
        }

        this.log('Autocapture enabled with config:', options.autocapture);
      } else if (config.enableAutocapture !== undefined) {
        options.autocapture = config.enableAutocapture;
      }

      if (config.bootstrap) {
        options.bootstrap = {};
        if (config.bootstrap.distinctId) {
          options.bootstrap.distinctId = config.bootstrap.distinctId;
        }
        if (config.bootstrap.featureFlags) {
          options.bootstrap.featureFlags = config.bootstrap.featureFlags;
        }
        this.log('Bootstrap configured:', options.bootstrap);
      }

      this.posthogClient = new PostHog(config.apiKey, options);

      if (config.enableSessionReplay && !options.enableSessionReplay) {
        this.startSessionRecording();
      }

      this.initialized = true;
      this.log('Initialized successfully');
    } catch (error) {
      this.error('Initialization failed:', error);
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
      this.log('Event tracked:', name, properties);
    } catch (error) {
      this.error('trackEvent error:', error);
    }
  }

  trackView(viewName, properties) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.screen(viewName, properties || {});
      this.log('View tracked:', viewName);
    } catch (error) {
      this.error('trackView error:', error);
    }
  }

  identify(userId, properties) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.identify(userId, properties || {});
      this.log('User identified:', userId);
    } catch (error) {
      this.error('identify error:', error);
    }
  }

  setUserProperties(properties, propertiesSetOnce) {
    if (!this.ensureInitialized()) return;

    try {
      if (this.posthogClient.setPersonProperties) {
        this.posthogClient.setPersonProperties(properties, propertiesSetOnce);
        this.log('User properties set via setPersonProperties');
      } else {
        this.posthogClient.capture('$set', {
          $set: properties,
          ...(propertiesSetOnce ? { $set_once: propertiesSetOnce } : {}),
        });
        this.log('User properties set via $set capture');
      }
    } catch (error) {
      this.error('setUserProperties error:', error);
    }
  }

  reset() {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.reset();
      this.log('User reset');
    } catch (error) {
      this.error('reset error:', error);
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
        this.log('Session recording started');
      } else {
        this.warn('Session recording not available in this SDK version');
      }
    } catch (error) {
      this.error('startSessionRecording error:', error);
    }
  }

  stopSessionRecording() {
    if (!this.ensureInitialized()) return;

    try {
      if (this.posthogClient.stopSessionRecording) {
        this.posthogClient.stopSessionRecording();
        this.sessionRecordingActive = false;
        this.log('Session recording stopped');
      }
    } catch (error) {
      this.error('stopSessionRecording error:', error);
    }
  }

  isSessionRecordingActive() {
    return this.sessionRecordingActive;
  }

  // ==========================================
  // FEATURE FLAGS
  // ==========================================

  getFeatureFlag(key) {
    if (!this.ensureInitialized()) return undefined;

    try {
      return this.posthogClient.getFeatureFlag(key);
    } catch (error) {
      this.error('getFeatureFlag error:', error);
      return undefined;
    }
  }

  isFeatureEnabled(key) {
    if (!this.ensureInitialized()) return false;

    try {
      const flag = this.posthogClient.getFeatureFlag(key);
      return flag === true || flag === 'true';
    } catch (error) {
      this.error('isFeatureEnabled error:', error);
      return false;
    }
  }

  async reloadFeatureFlags() {
    if (!this.ensureInitialized()) return;

    try {
      await this.posthogClient.reloadFeatureFlags();
      this.log('Feature flags reloaded');

      if (this.featureFlagsCallback) {
        const flags = this.getAllFeatureFlags();
        this.featureFlagsCallback(flags);
      }
    } catch (error) {
      this.error('reloadFeatureFlags error:', error);
    }
  }

  onFeatureFlags(callback) {
    this.featureFlagsCallback = callback;

    if (this.initialized) {
      const flags = this.getAllFeatureFlags();
      callback(flags);
    }
  }

  getAllFeatureFlags() {
    try {
      return this.posthogClient.getFeatureFlags?.() || {};
    } catch (error) {
      return {};
    }
  }

  // ==========================================
  // GROUP ANALYTICS
  // ==========================================

  group(type, key, properties) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.group(type, key, properties || {});
      this.log('Group set:', type, key);
    } catch (error) {
      this.error('group error:', error);
    }
  }

  // ==========================================
  // SURVEYS
  // ==========================================

  async getSurveys() {
    if (!this.ensureInitialized()) return [];

    try {
      if (this.posthogClient.getSurveys) {
        return await this.posthogClient.getSurveys();
      }
      return [];
    } catch (error) {
      this.error('getSurveys error:', error);
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
      if (this.posthogClient.flush) {
        await this.posthogClient.flush();
        this.log('Events flushed');
      }
    } catch (error) {
      this.error('flush error:', error);
    }
  }

  async shutdown() {
    if (!this.ensureInitialized()) return;

    try {
      if (this.posthogClient.shutdown) {
        await this.posthogClient.shutdown();
        this.initialized = false;
        this.log('Shutdown complete');
      }
    } catch (error) {
      this.error('shutdown error:', error);
    }
  }

  // ==========================================
  // TRACKING CONTROL
  // ==========================================

  setDisabled(disabled) {
    if (!this.posthogClient) {
      this.warn('PostHog not initialized');
      return;
    }

    try {
      this.posthogClient.disabled = disabled;
      this.log(disabled ? 'Tracking disabled' : 'Tracking enabled');
    } catch (error) {
      this.error('setDisabled error:', error);
    }
  }

  isDisabled() {
    if (!this.posthogClient) return true;
    return this.posthogClient.disabled ?? false;
  }

  optIn() {
    if (!this.ensureInitialized()) return;

    try {
      if (this.posthogClient.optIn) {
        this.posthogClient.optIn();
        this.log('Opted in to tracking');
      } else {
        this.setDisabled(false);
      }
    } catch (error) {
      this.error('optIn error:', error);
    }
  }

  optOut() {
    if (!this.ensureInitialized()) return;

    try {
      if (this.posthogClient.optOut) {
        this.posthogClient.optOut();
        this.log('Opted out of tracking');
      } else {
        this.setDisabled(true);
      }
    } catch (error) {
      this.error('optOut error:', error);
    }
  }

  hasOptedOut() {
    if (!this.posthogClient) return false;
    try {
      if (this.posthogClient.hasOptedOut) {
        return this.posthogClient.hasOptedOut();
      }
      return this.isDisabled();
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
      return this.posthogClient.getDistinctId?.() || null;
    } catch (error) {
      this.error('getDistinctId error:', error);
      return null;
    }
  }

  alias(alias) {
    if (!this.ensureInitialized()) return;

    try {
      this.posthogClient.alias(alias);
      this.log('Alias created:', alias);
    } catch (error) {
      this.error('alias error:', error);
    }
  }

  // ==========================================
  // SUPER PROPERTIES
  // ==========================================

  register(properties) {
    if (!this.ensureInitialized()) return;

    try {
      this.registeredProperties = {
        ...this.registeredProperties,
        ...properties,
      };

      if (this.posthogClient.register) {
        this.posthogClient.register(properties);
        this.log('Super properties registered:', properties);
      }
    } catch (error) {
      this.error('register error:', error);
    }
  }

  getRegisteredProperties() {
    return { ...this.registeredProperties };
  }

  clearRegisteredProperties() {
    if (!this.ensureInitialized()) return;

    try {
      for (const key of Object.keys(this.registeredProperties)) {
        if (this.posthogClient.unregister) {
          this.posthogClient.unregister(key);
        }
      }
      this.registeredProperties = {};
      this.log('All super properties cleared');
    } catch (error) {
      this.error('clearRegisteredProperties error:', error);
    }
  }

  unregister(propertyName) {
    if (!this.ensureInitialized()) return;

    try {
      delete this.registeredProperties[propertyName];

      if (this.posthogClient.unregister) {
        this.posthogClient.unregister(propertyName);
        this.log('Super property unregistered:', propertyName);
      }
    } catch (error) {
      this.error('unregister error:', error);
    }
  }
}

// Alias export so Metro's platform resolution (which picks .native.js over .js)
// provides the expected named export for consumers importing { PostHogProvider }
export { PostHogProviderNative as PostHogProvider };

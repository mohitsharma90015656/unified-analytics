/**
 * CountlyProvider Native - Countly SDK wrapper for React Native
 *
 * Uses countly-sdk-react-native-bridge for native iOS/Android integration.
 */

import { BaseProvider } from './BaseProvider';

// Dynamic import to make Countly optional
let Countly = null;
let CountlyConfig_SDK = null;

export class CountlyProviderNative extends BaseProvider {
  name = 'countly';
  config = null;
  _disableLocationAfterInit = false;
  userContext = {};

  async init(config) {
    if (this.initialized) {
      this.warn('Already initialized');
      return;
    }

    this.config = config;
    this.debug = config.debug ?? false;

    try {
      const CountlyModule = await import('countly-sdk-react-native-bridge');
      Countly = CountlyModule.default;
      const CountlyConfigModule = await import(
        'countly-sdk-react-native-bridge/CountlyConfig'
      );
      CountlyConfig_SDK = CountlyConfigModule.default;

      const alreadyInit = await Countly.isInitialized();
      if (alreadyInit) {
        this.log('Countly SDK already initialized');
        this.initialized = true;
        return;
      }

      const countlyConfig = new CountlyConfig_SDK(
        config.serverUrl,
        config.appKey,
      );

      if (this.debug) {
        countlyConfig.setLoggingEnabled(true);
      }

      if (config.useTemporaryDeviceId) {
        countlyConfig.setDeviceId(Countly.TemporaryDeviceIDString);
        this.log('Using temporary device ID');
      } else if (config.deviceId) {
        countlyConfig.setDeviceId(config.deviceId);
        this.log('Using custom device ID:', config.deviceId);
      }

      if (config.disableLocation) {
        this._disableLocationAfterInit = true;
        this.log('Location tracking will be disabled');
      } else if (config.location) {
        const { countryCode, city, gpsCoordinates, ipAddress } =
          config.location;
        countlyConfig.setLocation(
          countryCode || null,
          city || null,
          gpsCoordinates || null,
          ipAddress || null,
        );
        this.log('Location configured:', config.location);
      }

      if (config.enableCrashReporting) {
        countlyConfig.enableCrashReporting();
      }

      if (config.requiresConsent) {
        countlyConfig.setRequiresConsent(true);
      }

      if (config.tamperingProtectionSalt) {
        countlyConfig.enableParameterTamperingProtection(
          config.tamperingProtectionSalt,
        );
        this.log('Parameter tampering protection enabled');
      }

      await Countly.initWithConfig(countlyConfig);

      if (this._disableLocationAfterInit) {
        Countly.disableLocation();
        this.log('Location tracking disabled');
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
      const mergedProps = this.mergeWithUserContext(properties);
      const segments = this.stringifyProperties(mergedProps);
      Countly.events.recordEvent(name, segments, 1, undefined);
      this.log('Event tracked:', name, segments);
    } catch (error) {
      this.error('trackEvent error:', error);
    }
  }

  trackView(viewName, properties) {
    if (!this.ensureInitialized()) return;

    try {
      const mergedProps = this.mergeWithUserContext(properties);
      const segments = this.stringifyProperties(mergedProps);
      Countly.recordView(viewName, segments);
      this.log('View tracked:', viewName);
    } catch (error) {
      this.error('trackView error:', error);
    }
  }

  identify(userId, properties = {}) {
    if (!this.ensureInitialized()) return;

    try {
      // Change device ID to user ID so each user is uniquely tracked in Countly
      this.changeDeviceId(userId.toString(), true);

      const userData = {};

      if (properties.name) userData.name = properties.name;
      if (properties.email) userData.email = properties.email;
      if (properties.username) userData.username = properties.username;
      if (properties.organization)
        userData.organization = properties.organization;
      if (properties.phone) userData.phone = properties.phone;
      if (properties.picture) userData.picture = properties.picture;
      if (properties.gender) userData.gender = properties.gender;
      if (properties.birthYear) userData.byear = String(properties.birthYear);

      const customFields = { user_id: userId };
      for (const [key, value] of Object.entries(properties)) {
        if (
          ![
            'name',
            'email',
            'username',
            'organization',
            'phone',
            'picture',
            'gender',
            'birthYear',
          ].includes(key)
        ) {
          customFields[key] = this.safeString(value);
        }
      }
      userData.custom = customFields;

      Countly.userDataBulk.setUserProperties(userData);
      Countly.userDataBulk.save();
      this.log('User identified:', userId, userData);
    } catch (error) {
      this.error('identify error:', error);
    }
  }

  setUserProperties(properties) {
    if (!this.ensureInitialized()) return;

    try {
      for (const [key, value] of Object.entries(properties)) {
        Countly.userDataBulk.setProperty(key, this.safeString(value));
      }
      Countly.userDataBulk.save();
      this.log('User properties set:', properties);
    } catch (error) {
      this.error('setUserProperties error:', error);
    }
  }

  reset() {
    if (!this.ensureInitialized()) return;

    try {
      this.enableTemporaryDeviceIdMode();
      this.clearUserContext();
      this.log('User reset');
    } catch (error) {
      this.error('reset error:', error);
    }
  }

  // ==========================================
  // USER CONTEXT
  // ==========================================

  setUserContext(properties) {
    if (!this.ensureInitialized()) return;
    this.userContext = { ...this.userContext, ...properties };
    this.log('User context set:', this.userContext);
  }

  getUserContext() {
    return { ...this.userContext };
  }

  clearUserContext() {
    this.userContext = {};
    this.log('User context cleared');
  }

  mergeWithUserContext(properties) {
    return {
      ...this.userContext,
      ...(properties || {}),
    };
  }

  // ==========================================
  // TIMED EVENTS
  // ==========================================

  startTimedEvent(name) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.events.startEvent(name);
      this.log('Timed event started:', name);
    } catch (error) {
      this.error('startTimedEvent error:', error);
    }
  }

  endTimedEvent(name, segments) {
    if (!this.ensureInitialized()) return;

    try {
      const props = this.stringifyProperties(segments);
      Countly.events.endEvent(name, props);
      this.log('Timed event ended:', name);
    } catch (error) {
      this.error('endTimedEvent error:', error);
    }
  }

  // ==========================================
  // ERROR TRACKING
  // ==========================================

  trackError(options) {
    if (!this.ensureInitialized()) return;

    const { message, stack = '', fatal = false, segments = {} } = options;

    try {
      Countly.addCrashLog(message);

      if (fatal) {
        const props = this.stringifyProperties(segments);
        Countly.logException(stack || message, !fatal, props);
      }

      this.log('Error tracked:', { message, fatal });
    } catch (error) {
      this.error('trackError error:', error);
    }
  }

  addCrashLog(message) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.addCrashLog(message);
    } catch (error) {
      this.error('addCrashLog error:', error);
    }
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  /** @deprecated Sessions are now auto-managed by the React Native Countly SDK. This is a no-op. */
  startSession() {
    this.log('startSession is a no-op; sessions are managed automatically');
  }

  /** @deprecated Sessions are now auto-managed by the React Native Countly SDK. This is a no-op. */
  endSession() {
    this.log('endSession is a no-op; sessions are managed automatically');
  }

  // ==========================================
  // USER DATA OPERATIONS
  // ==========================================

  incrementUserProperty(key, value = 1) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.userDataBulk.incrementBy(key, value);
      Countly.userDataBulk.save();
      this.log('User property incremented:', key, value);
    } catch (error) {
      this.error('incrementUserProperty error:', error);
    }
  }

  addToCohort(name) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.userDataBulk.pushUniqueValue('cohorts', name);
      Countly.userDataBulk.save();
      this.log('Added to cohort:', name);
    } catch (error) {
      this.error('addToCohort error:', error);
    }
  }

  removeFromCohort(name) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.userDataBulk.pullValue('cohorts', name);
      Countly.userDataBulk.save();
      this.log('Removed from cohort:', name);
    } catch (error) {
      this.error('removeFromCohort error:', error);
    }
  }

  setUserProfile(profile) {
    if (!this.ensureInitialized()) return;

    try {
      const profileData = {};

      if (profile.name) profileData.name = profile.name;
      if (profile.email) profileData.email = profile.email;
      if (profile.username) profileData.username = profile.username;
      if (profile.organization) profileData.organization = profile.organization;
      if (profile.phone) profileData.phone = profile.phone;
      if (profile.picture) profileData.picture = profile.picture;
      if (profile.gender) profileData.gender = profile.gender;
      if (profile.birthYear) profileData.byear = String(profile.birthYear);

      if (profile.custom) {
        profileData.custom = {};
        for (const [key, value] of Object.entries(profile.custom)) {
          profileData.custom[key] = this.safeString(value);
        }
      }

      Countly.userDataBulk.setUserProperties(profileData);
      Countly.userDataBulk.save();
      this.log('User profile set:', profileData);
    } catch (error) {
      this.error('setUserProfile error:', error);
    }
  }

  // ==========================================
  // DEVICE ID METHODS
  // ==========================================

  changeDeviceId(newDeviceId, mergeOnServer = true) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.changeDeviceId(newDeviceId, mergeOnServer);
      this.log('Device ID changed:', newDeviceId, { mergeOnServer });
    } catch (error) {
      this.error('changeDeviceId error:', error);
    }
  }

  async getDeviceId() {
    if (!this.ensureInitialized()) return null;

    try {
      const deviceId = await Countly.getCurrentDeviceId();
      return deviceId;
    } catch (error) {
      this.error('getDeviceId error:', error);
      return null;
    }
  }

  enableTemporaryDeviceIdMode() {
    if (!this.ensureInitialized()) return;

    try {
      Countly.changeDeviceId(Countly.TemporaryDeviceIDString, false);
      this.log('Switched to temporary device ID mode');
    } catch (error) {
      this.error('enableTemporaryDeviceIdMode error:', error);
    }
  }

  // ==========================================
  // LOCATION METHODS
  // ==========================================

  setLocation(countryCode, city, gpsCoordinates, ipAddress) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.setLocation(
        countryCode || null,
        city || null,
        gpsCoordinates || null,
        ipAddress || null,
      );
      this.log('Location set:', { countryCode, city, gpsCoordinates, ipAddress });
    } catch (error) {
      this.error('setLocation error:', error);
    }
  }

  disableLocation() {
    if (!this.ensureInitialized()) return;

    try {
      Countly.disableLocation();
      this.log('Location tracking disabled');
    } catch (error) {
      this.error('disableLocation error:', error);
    }
  }

  // ==========================================
  // CONSENT METHODS
  // ==========================================

  giveConsent(features) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.giveConsent(features);
      this.log('Consent given for:', features);
    } catch (error) {
      this.error('giveConsent error:', error);
    }
  }

  removeConsent(features) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.removeConsent(features);
      this.log('Consent removed for:', features);
    } catch (error) {
      this.error('removeConsent error:', error);
    }
  }

  giveAllConsent() {
    if (!this.ensureInitialized()) return;

    try {
      Countly.giveAllConsent();
      this.log('All consent given');
    } catch (error) {
      this.error('giveAllConsent error:', error);
    }
  }

  removeAllConsent() {
    if (!this.ensureInitialized()) return;

    try {
      Countly.removeAllConsent();
      this.log('All consent removed');
    } catch (error) {
      this.error('removeAllConsent error:', error);
    }
  }
}

// Alias export so Metro's platform resolution (which picks .native.js over .js)
// provides the expected named export for consumers importing { CountlyProvider }
export { CountlyProviderNative as CountlyProvider };

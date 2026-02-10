/**
 * CountlyProvider Web - Countly SDK wrapper for Web (React.js/Next.js)
 *
 * Uses countly-sdk-web for browser-based analytics.
 */

import { BaseProvider } from './BaseProvider';

// Dynamic import to make Countly optional
let Countly = null;

export class CountlyProviderWeb extends BaseProvider {
  name = 'countly';
  config = null;
  userContext = {};

  async init(config) {
    if (this.initialized) {
      this.warn('Already initialized');
      return;
    }

    this.config = config;
    this.debug = config.debug ?? false;

    try {
      const CountlyModule = await import('countly-sdk-web');
      Countly = CountlyModule.default || CountlyModule;

      // Web SDK initialization
      Countly.init({
        app_key: config.appKey,
        url: config.serverUrl,
        debug: this.debug,
        session_update: config.sessionUpdateInterval ?? 60,
        use_session_cookie: config.useSessionCookie ?? true,
        device_id: config.deviceId || undefined,
        require_consent: config.requiresConsent || false,
      });

      // Enable crash reporting if configured
      if (config.enableCrashReporting) {
        Countly.track_errors();
      }

      // Consent
      if (config.requiresConsent && config.initialConsent) {
        Countly.add_consent(config.initialConsent);
      }

      // Enable automatic session tracking (handles begin/end/update automatically)
      Countly.track_sessions();

      this.initialized = true;
      this.log('Initialized successfully (web)');
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
      Countly.add_event({
        key: name,
        count: 1,
        segmentation: segments,
      });
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
      Countly.track_pageview(viewName, undefined, segments);
      this.log('View tracked:', viewName);
    } catch (error) {
      this.error('trackView error:', error);
    }
  }

  identify(userId, properties = {}) {
    if (!this.ensureInitialized()) return;

    try {
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

      Countly.user_details(userData);
      this.log('User identified:', userId, userData);
    } catch (error) {
      this.error('identify error:', error);
    }
  }

  setUserProperties(properties) {
    if (!this.ensureInitialized()) return;

    try {
      const custom = {};
      for (const [key, value] of Object.entries(properties)) {
        custom[key] = this.safeString(value);
      }
      Countly.user_details({ custom });
      this.log('User properties set:', properties);
    } catch (error) {
      this.error('setUserProperties error:', error);
    }
  }

  reset() {
    if (!this.ensureInitialized()) return;

    try {
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
      Countly.start_event(name);
      this.log('Timed event started:', name);
    } catch (error) {
      this.error('startTimedEvent error:', error);
    }
  }

  endTimedEvent(name, segments) {
    if (!this.ensureInitialized()) return;

    try {
      const props = this.stringifyProperties(segments);
      Countly.end_event({
        key: name,
        segmentation: props,
      });
      this.log('Timed event ended:', name);
    } catch (error) {
      this.error('endTimedEvent error:', error);
    }
  }

  cancelTimedEvent(name) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.cancel_event(name);
      this.log('Timed event cancelled:', name);
    } catch (error) {
      this.error('cancelTimedEvent error:', error);
    }
  }

  // ==========================================
  // ERROR TRACKING
  // ==========================================

  trackError(options) {
    if (!this.ensureInitialized()) return;

    const { message, stack = '', fatal = false, segments = {} } = options;

    try {
      Countly.add_log(message);

      if (fatal) {
        const props = this.stringifyProperties(segments);
        Countly.log_error(stack || message, !fatal, props);
      }

      this.log('Error tracked:', { message, fatal });
    } catch (error) {
      this.error('trackError error:', error);
    }
  }

  addCrashLog(message) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.add_log(message);
    } catch (error) {
      this.error('addCrashLog error:', error);
    }
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  /** @deprecated Sessions are now auto-managed via Countly.track_sessions(). This is a no-op. */
  startSession() {
    this.log('startSession is a no-op; sessions are managed automatically');
  }

  /** @deprecated Sessions are now auto-managed via Countly.track_sessions(). This is a no-op. */
  endSession() {
    this.log('endSession is a no-op; sessions are managed automatically');
  }

  // ==========================================
  // USER DATA OPERATIONS
  // ==========================================

  incrementUserProperty(key, value = 1) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.userData.increment_by(key, value);
      Countly.userData.save();
      this.log('User property incremented:', key, value);
    } catch (error) {
      this.error('incrementUserProperty error:', error);
    }
  }

  addToCohort(name) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.userData.push_unique('cohorts', name);
      Countly.userData.save();
      this.log('Added to cohort:', name);
    } catch (error) {
      this.error('addToCohort error:', error);
    }
  }

  removeFromCohort(name) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.userData.pull('cohorts', name);
      Countly.userData.save();
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

      Countly.user_details(profileData);
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
      Countly.change_id(newDeviceId, mergeOnServer);
      this.log('Device ID changed:', newDeviceId, { mergeOnServer });
    } catch (error) {
      this.error('changeDeviceId error:', error);
    }
  }

  async getDeviceId() {
    if (!this.ensureInitialized()) return null;

    try {
      return Countly.get_device_id();
    } catch (error) {
      this.error('getDeviceId error:', error);
      return null;
    }
  }

  enableTemporaryDeviceIdMode() {
    if (!this.ensureInitialized()) return;

    try {
      // Web SDK uses CLY_TEMP_ID for temporary device ID
      Countly.change_id('[CLY]_temp_id', false);
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
      Countly.set_location({
        country_code: countryCode || undefined,
        city: city || undefined,
        gps: gpsCoordinates || undefined,
        ip_address: ipAddress || undefined,
      });
      this.log('Location set:', { countryCode, city, gpsCoordinates, ipAddress });
    } catch (error) {
      this.error('setLocation error:', error);
    }
  }

  disableLocation() {
    if (!this.ensureInitialized()) return;

    try {
      Countly.disable_location();
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
      Countly.add_consent(features);
      this.log('Consent given for:', features);
    } catch (error) {
      this.error('giveConsent error:', error);
    }
  }

  removeConsent(features) {
    if (!this.ensureInitialized()) return;

    try {
      Countly.remove_consent(features);
      this.log('Consent removed for:', features);
    } catch (error) {
      this.error('removeConsent error:', error);
    }
  }

  giveAllConsent() {
    if (!this.ensureInitialized()) return;

    try {
      // Web SDK: give consent for all known features
      Countly.add_consent([
        'sessions',
        'events',
        'views',
        'scrolls',
        'clicks',
        'forms',
        'crashes',
        'attribution',
        'users',
        'star-rating',
        'feedback',
        'apm',
        'location',
      ]);
      this.log('All consent given');
    } catch (error) {
      this.error('giveAllConsent error:', error);
    }
  }

  removeAllConsent() {
    if (!this.ensureInitialized()) return;

    try {
      Countly.remove_consent([
        'sessions',
        'events',
        'views',
        'scrolls',
        'clicks',
        'forms',
        'crashes',
        'attribution',
        'users',
        'star-rating',
        'feedback',
        'apm',
        'location',
      ]);
      this.log('All consent removed');
    } catch (error) {
      this.error('removeAllConsent error:', error);
    }
  }

  // ==========================================
  // WEB-ONLY FEATURES
  // ==========================================

  trackScrolls() {
    if (!this.ensureInitialized()) return;

    try {
      Countly.track_scrolls();
      this.log('Scroll tracking enabled');
    } catch (error) {
      this.error('trackScrolls error:', error);
    }
  }

  trackLinks() {
    if (!this.ensureInitialized()) return;

    try {
      Countly.track_links();
      this.log('Link tracking enabled');
    } catch (error) {
      this.error('trackLinks error:', error);
    }
  }

  trackForms() {
    if (!this.ensureInitialized()) return;

    try {
      Countly.track_forms();
      this.log('Form tracking enabled');
    } catch (error) {
      this.error('trackForms error:', error);
    }
  }
}

// Alias export so Metro's platform resolution (which picks .web.js on web)
// provides the expected named export for consumers importing { CountlyProvider }
export { CountlyProviderWeb as CountlyProvider };

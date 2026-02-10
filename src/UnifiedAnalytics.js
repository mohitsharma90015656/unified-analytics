/**
 * UnifiedAnalytics - Main orchestrator class
 * Singleton pattern for consistent state across the app
 */

import { CountlyProvider } from "./providers/CountlyProvider";
import { PostHogProvider } from "./providers/PostHogProvider";
import { validateConfig, createLogger } from "./utils/helpers";
import { setPlatform } from "./platform";

/**
 * UnifiedAnalytics - Core analytics orchestrator
 */
class UnifiedAnalytics {
  static instance = null;

  constructor() {
    this.initialized = false;
    this.config = null;
    this.countlyProvider = null;
    this.posthogProvider = null;
    this.logger = createLogger(false);
    this.navigationRef = null;
    this.routeNameRef = null;
    this.screenViewOverrides = new Map(); // Map<screenName, customName>
    this._trackScreenViews = true;
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!UnifiedAnalytics.instance) {
      UnifiedAnalytics.instance = new UnifiedAnalytics();
    }
    return UnifiedAnalytics.instance;
  }

  /**
   * Initialize analytics with configuration
   */
  async init(config) {
    if (this.initialized) {
      this.logger.warn("Already initialized, skipping");
      return;
    }

    // Validate configuration
    const validation = validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.errors.join(", ")}`);
    }

    this.config = config;
    this.logger = createLogger(config.debug || false);

    // Set platform if provided
    if (config.platform) {
      setPlatform(config.platform);
      this.logger.log("Platform set to:", config.platform);
    }

    // Set screen view tracking (default: true)
    this._trackScreenViews = config.trackScreenViews !== false;
    this.logger.log(
      "Screen view tracking:",
      this._trackScreenViews ? "enabled" : "disabled",
    );

    this.logger.log("Initializing with config:", {
      countly: !!config.countly,
      posthog: !!config.posthog,
    });

    // Initialize each provider independently so one failure doesn't block the other
    if (config.countly) {
      try {
        this.countlyProvider = new CountlyProvider();
        this.countlyProvider.setDebug(config.debug || false);
        await this.countlyProvider.init(config.countly);
        this.logger.log("Countly provider initialized");
      } catch (error) {
        this.logger.error("Countly initialization failed:", error);
        this.countlyProvider = null;
      }
    }

    if (config.posthog) {
      try {
        this.posthogProvider = new PostHogProvider();
        this.posthogProvider.setDebug(config.debug || false);
        await this.posthogProvider.init(config.posthog);
        this.logger.log("PostHog provider initialized");
      } catch (error) {
        this.logger.error("PostHog initialization failed:", error);
        this.posthogProvider = null;
      }
    }

    this.initialized = true;
    this.logger.log("Initialization complete");
  }

  /**
   * Check if analytics is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get enabled providers
   */
  getEnabledProviders() {
    const providers = [];
    if (this.countlyProvider?.isInitialized()) {
      providers.push("countly");
    }
    if (this.posthogProvider?.isInitialized()) {
      providers.push("posthog");
    }
    return providers;
  }

  /**
   * Check if a specific provider is enabled
   */
  hasProvider(name) {
    if (name === "countly") {
      return this.countlyProvider?.isInitialized() ?? false;
    }
    if (name === "posthog") {
      return this.posthogProvider?.isInitialized() ?? false;
    }
    return false;
  }

  // ==========================================
  // CORE TRACKING METHODS (ALL PROVIDERS)
  // ==========================================

  /**
   * Track a custom event
   */
  trackEvent(name, properties) {
    this.trackEventToProviders(name, properties);
  }

  /**
   * Track a screen/view
   */
  trackView(viewName, properties) {
    if (!this._trackScreenViews) {
      this.logger.log("Screen view tracking disabled, skipping:", viewName);
      return;
    }

    if (this.countlyProvider?.isInitialized()) {
      this.countlyProvider.trackView(viewName, properties);
    }
    if (this.posthogProvider?.isInitialized()) {
      this.posthogProvider.trackView(viewName, properties);
    }

    this.logger.log("🎁🎁🎁🎁🎁🎁 View tracked:", viewName);
  }

  /**
   * Set a custom screen name override for the next automatic tracking
   * This prevents duplicate events when manually tracking screen views
   *
   * @param {string} screenName - The actual navigation screen name
   * @param {string} customName - Custom name to use instead
   */
  setScreenViewOverride(screenName, customName) {
    this.screenViewOverrides.set(screenName, customName);
    this.logger.log("🎁🎁🎁🎁🎁🎁 Screen view override set:", {
      screenName,
      customName,
    });
  }

  /**
   * Clear screen view override for a specific screen
   *
   * @param {string} screenName - The screen name to clear override for
   */
  clearScreenViewOverride(screenName) {
    this.screenViewOverrides.delete(screenName);
    this.logger.log("Screen view override cleared:", screenName);
  }

  /**
   * Enable or disable screen view tracking at runtime
   * @param {boolean} enabled - true to enable, false to disable
   */
  setTrackScreenViews(enabled) {
    this._trackScreenViews = enabled;
    this.logger.log("Screen view tracking:", enabled ? "enabled" : "disabled");
  }

  /**
   * Identify a user
   */
  identify(userId, properties) {
    if (this.countlyProvider?.isInitialized()) {
      this.countlyProvider.identify(userId, properties);
    }
    if (this.posthogProvider?.isInitialized()) {
      this.posthogProvider.identify(userId, properties);
    }

    this.logger.log("User identified:", userId);
  }

  /**
   * Set user properties
   */
  setUserProperties(properties) {
    if (this.countlyProvider?.isInitialized()) {
      this.countlyProvider.setUserProperties(properties);
    }
    if (this.posthogProvider?.isInitialized()) {
      this.posthogProvider.setUserProperties(properties);
    }

    this.logger.log("User properties set");
  }

  /**
   * Reset/logout user
   */
  reset() {
    if (this.countlyProvider?.isInitialized()) {
      this.countlyProvider.reset();
    }
    if (this.posthogProvider?.isInitialized()) {
      this.posthogProvider.reset();
    }

    this.logger.log("User reset");
  }

  // ==========================================
  // GLOBAL PROPERTIES (UNIFIED FACADE)
  // ==========================================

  /**
   * Set global properties included in all future events
   * Maps to userContext (Countly) and register (PostHog)
   */
  setGlobalProperties(properties) {
    // Countly - use userContext (already implemented)
    if (this.countlyProvider?.isInitialized()) {
      this.countlyProvider.setUserContext(properties);
    }

    // PostHog - use register
    if (this.posthogProvider?.isInitialized()) {
      this.posthogProvider.register(properties);
    }

    this.logger.log("Global properties set:", properties);
  }

  /**
   * Get current global properties
   * Returns properties from whichever provider is available
   */
  getGlobalProperties() {
    // Try Countly first
    if (this.countlyProvider?.isInitialized()) {
      return this.countlyProvider.getUserContext();
    }

    // Try PostHog
    if (this.posthogProvider?.isInitialized()) {
      return this.posthogProvider.getRegisteredProperties();
    }

    return {};
  }

  /**
   * Clear all global properties
   */
  clearGlobalProperties() {
    if (this.countlyProvider?.isInitialized()) {
      this.countlyProvider.clearUserContext();
    }

    if (this.posthogProvider?.isInitialized()) {
      this.posthogProvider.clearRegisteredProperties();
    }

    this.logger.log("Global properties cleared");
  }

  /**
   * Remove specific global property
   */
  removeGlobalProperty(key) {
    if (this.countlyProvider?.isInitialized()) {
      const current = this.countlyProvider.getUserContext();
      delete current[key];
      this.countlyProvider.setUserContext(current);
    }

    if (this.posthogProvider?.isInitialized()) {
      this.posthogProvider.unregister(key);
    }

    this.logger.log("Global property removed:", key);
  }

  // ==========================================
  // TIMED EVENTS (UNIFIED FACADE)
  // ==========================================

  /**
   * Start timing an event
   * Only works with Countly (PostHog doesn't support timed events)
   */
  startTimer(eventName) {
    if (this.countlyProvider?.isInitialized()) {
      this.countlyProvider.startTimedEvent(eventName);
    }

    // PostHog doesn't support timed events - gracefully no-op
    if (this.posthogProvider?.isInitialized() && this.config.debug) {
      this.logger.log("PostHog does not support timed events");
    }

    this.logger.log("Timer started:", eventName);
  }

  /**
   * End timer and track event with duration
   * Only works with Countly (PostHog doesn't support timed events)
   */
  endTimer(eventName, properties = {}) {
    if (this.countlyProvider?.isInitialized()) {
      this.countlyProvider.endTimedEvent(eventName, properties);
    }

    // PostHog doesn't support timed events - gracefully no-op
    if (this.posthogProvider?.isInitialized() && this.config.debug) {
      this.logger.log("PostHog does not support timed events");
    }

    this.logger.log("Timer ended:", eventName);
  }

  // ==========================================
  // ERROR TRACKING (UNIFIED FACADE)
  // ==========================================

  /**
   * Track error/exception
   * Maps to trackError (Countly) and capture $exception (PostHog)
   */
  trackError(error, metadata = {}) {
    const errorData = {
      message: error.message || String(error),
      name: error.name || "Error",
      stack: error.stack || "",
      ...metadata,
    };

    // Countly
    if (this.countlyProvider?.isInitialized()) {
      this.countlyProvider.trackError({
        message: errorData.message,
        stack: errorData.stack,
        fatal: metadata.fatal || false,
        segments: metadata,
      });
    }

    // PostHog
    if (this.posthogProvider?.isInitialized()) {
      this.posthogProvider.capture("$exception", {
        $exception_message: errorData.message,
        $exception_type: errorData.name,
        $exception_stack_trace_raw: errorData.stack,
        ...metadata,
      });
    }

    this.logger.log("Error tracked:", errorData.message);
  }

  // ==========================================
  // FEATURE FLAGS (UNIFIED FACADE)
  // ==========================================

  /**
   * Get feature flag value
   * Only works with PostHog (Countly returns null)
   */
  getFeatureFlag(key) {
    // PostHog has feature flags
    if (this.posthogProvider?.isInitialized()) {
      return this.posthogProvider.getFeatureFlag(key);
    }

    // Countly doesn't support feature flags
    if (this.config.debug) {
      this.logger.log("Feature flags not supported by Countly, returning null");
    }

    return null;
  }

  /**
   * Check if feature is enabled
   * Only works with PostHog (Countly returns false)
   */
  isFeatureEnabled(key) {
    if (this.posthogProvider?.isInitialized()) {
      return this.posthogProvider.isFeatureEnabled(key);
    }

    return false;
  }

  /**
   * Get all feature flags
   * Only works with PostHog (Countly returns empty object)
   */
  getAllFeatureFlags() {
    if (this.posthogProvider?.isInitialized()) {
      return this.posthogProvider.getAllFeatureFlags();
    }

    return {};
  }

  /**
   * Subscribe to feature flag changes
   * Only works with PostHog (Countly returns no-op function)
   */
  onFeatureFlagsChange(callback) {
    if (this.posthogProvider?.isInitialized()) {
      return this.posthogProvider.onFeatureFlags(callback);
    }

    // Countly - no-op
    return () => {};
  }

  // ==========================================
  // SESSION MANAGEMENT (AUTO-MANAGED)
  // ==========================================

  /**
   * @deprecated Sessions are now automatically managed by the Countly SDK.
   * This method is a no-op and will be removed in a future version.
   */
  startSession() {
    this.logger.log('startSession is a no-op; sessions are managed automatically by Countly SDK');
  }

  /**
   * @deprecated Sessions are now automatically managed by the Countly SDK.
   * This method is a no-op and will be removed in a future version.
   */
  endSession() {
    this.logger.log('endSession is a no-op; sessions are managed automatically by Countly SDK');
  }

  // ==========================================
  // NAVIGATION INTEGRATION
  // ==========================================

  /**
   * Create navigation handlers for React Navigation
   */
  createNavigationHandlers(navigationRef) {
    this.navigationRef = navigationRef;

    return {
      onReady: () => {
        this.routeNameRef =
          navigationRef.current?.getCurrentRoute()?.name || null;
      },

      onStateChange: () => {
        const previousRouteName = this.routeNameRef;
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

        if (previousRouteName !== currentRouteName && currentRouteName) {
          // Check if there's a custom override for this screen
          const customName = this.screenViewOverrides.get(currentRouteName);

          if (customName) {
            // Use custom name and clear the override
            this.trackView(customName);
            this.screenViewOverrides.delete(currentRouteName);
            this.logger.log("Used screen view override:", {
              actual: currentRouteName,
              custom: customName,
            });
          } else {
            // Normal automatic tracking
            this.trackView(currentRouteName);
          }
        }

        this.routeNameRef = currentRouteName;
      },
    };
  }

  /**
   * Create navigation handlers for web (React Router / Next.js)
   * Returns an onRouteChange callback to call when URL changes.
   *
   * Usage with Next.js Pages Router:
   *   Router.events.on('routeChangeComplete', onRouteChange);
   *
   * Usage with Next.js App Router:
   *   const pathname = usePathname();
   *   useEffect(() => { onRouteChange(pathname); }, [pathname]);
   *
   * Usage with React Router:
   *   const location = useLocation();
   *   useEffect(() => { onRouteChange(location.pathname); }, [location]);
   */
  createWebNavigationHandlers() {
    let previousPath = null;

    return {
      onRouteChange: (url) => {
        if (url && url !== previousPath) {
          const customName = this.screenViewOverrides.get(url);
          if (customName) {
            this.trackView(customName);
            this.screenViewOverrides.delete(url);
          } else {
            this.trackView(url);
          }
          previousPath = url;
        }
      },
    };
  }

  // ==========================================
  // PROVIDER-SPECIFIC ACCESS
  // ==========================================

  /**
   * Get Countly-specific features
   * Returns undefined if Countly is not configured
   */
  get countly() {
    return this.countlyProvider?.isInitialized()
      ? this.countlyProvider
      : undefined;
  }

  /**
   * Get PostHog-specific features
   * Returns undefined if PostHog is not configured
   */
  get posthog() {
    return this.posthogProvider?.isInitialized()
      ? this.posthogProvider
      : undefined;
  }

  // ==========================================
  // PRIVATE HELPERS
  // ==========================================

  /**
   * Track event to all initialized providers
   */
  trackEventToProviders(name, properties) {
    if (this.countlyProvider?.isInitialized()) {
      this.countlyProvider.trackEvent(name, properties);
    }
    if (this.posthogProvider?.isInitialized()) {
      this.posthogProvider.trackEvent(name, properties);
    }

    this.logger.log("🕉️🕉️🕉️🕉️🕉️🕉️ Event tracked:", name);
  }
}

// Export singleton instance
export const analytics = UnifiedAnalytics.getInstance();

export { UnifiedAnalytics };

# Unified Analytics Library

A **pure facade layer** for analytics that provides a single, unified API across multiple analytics providers (Countly, PostHog) on both **React Native** and **Web** (React.js / Next.js).

## Core Philosophy

**One API to rule them all.** The app code uses only unified methods - no provider-specific code required. The library internally maps to the appropriate provider implementations with graceful degradation when features aren't supported.

## Key Features

- **Pure Facade Pattern**: Single unified API, no provider-specific exposure
- **Cross-Platform**: Works on React Native and Web (React.js/Next.js)
- **Graceful Degradation**: Features return null/false when not supported instead of errors
- **Multi-Provider Support**: Use Countly, PostHog, or both simultaneously
- **React Hooks**: Easy integration with `useAnalytics()` hook
- **Zero Configuration**: Auto-detects platform, works with one or both providers

## Installation

1. Copy this library to your project (e.g., `libs/unified-analytics`)

2. Install the provider SDK(s) you want to use:

**React Native:**
```bash
# For Countly
yarn add countly-sdk-react-native-bridge@^24.4.0

# For PostHog
yarn add posthog-react-native@^3.0.0

```

**Web (React.js / Next.js):**
```bash
# For Countly
yarn add countly-sdk-web

# For PostHog
yarn add posthog-js
```

## Quick Start

### React Native Setup

#### 1. Initialize Analytics

```javascript
// App.js
import { analytics, AnalyticsProvider } from './libs/unified-analytics';

await analytics.init({
  platform: 'native', // optional, auto-detected

  countly: {
    serverUrl: 'https://your-countly-server.com',
    appKey: 'your-app-key',
    enableCrashReporting: true,
  },

  posthog: {
    apiKey: 'phc_xxxxx',
    enableSessionReplay: true,
    captureNativeAppLifecycleEvents: true,
  },

  debug: __DEV__,
});

// Wrap your app
export default function App() {
  return (
    <AnalyticsProvider>
      <Navigation />
    </AnalyticsProvider>
  );
}
```

#### 2. Setup Navigation Tracking (React Navigation)

```javascript
import { analytics } from './libs/unified-analytics';

function App() {
  const navigationRef = useRef();

  const { onReady, onStateChange } = analytics.createNavigationHandlers(navigationRef);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onReady}
      onStateChange={onStateChange}
    >
      <Navigator />
    </NavigationContainer>
  );
}
```

---

### Web (Next.js) Setup

#### 1. Initialize Analytics

```javascript
// _app.js or layout.js
import { analytics, AnalyticsProvider } from 'unified-analytics';

await analytics.init({
  platform: 'web',

  countly: {
    serverUrl: 'https://your-countly-server.com',
    appKey: 'your-web-app-key',
    debug: process.env.NODE_ENV === 'development',
  },

  posthog: {
    apiKey: 'phc_xxxxx',
    host: 'https://us.i.posthog.com',
    debug: process.env.NODE_ENV === 'development',
    enableSessionReplay: true,
    autocapture: {
      captureClicks: true,
      capturePageviews: false, // We handle this manually
    },
  },

  debug: process.env.NODE_ENV === 'development',
});
```

#### 2. Setup Navigation Tracking

**Next.js Pages Router:**
```javascript
import Router from 'next/router';
import { analytics } from 'unified-analytics';

const { onRouteChange } = analytics.createWebNavigationHandlers();
Router.events.on('routeChangeComplete', onRouteChange);
```

**Next.js App Router:**
```javascript
'use client';
import { usePathname } from 'next/navigation';
import { analytics } from 'unified-analytics';
import { useEffect, useRef } from 'react';

function NavigationTracker() {
  const pathname = usePathname();
  const handlersRef = useRef(analytics.createWebNavigationHandlers());

  useEffect(() => {
    handlersRef.current.onRouteChange(pathname);
  }, [pathname]);

  return null;
}
```

**React Router:**
```javascript
import { useLocation } from 'react-router-dom';
import { analytics } from 'unified-analytics';
import { useEffect, useRef } from 'react';

function NavigationTracker() {
  const location = useLocation();
  const handlersRef = useRef(analytics.createWebNavigationHandlers());

  useEffect(() => {
    handlersRef.current.onRouteChange(location.pathname);
  }, [location]);

  return null;
}
```

---

### 3. Use in Components (Same on Both Platforms)

```javascript
import { useAnalytics } from 'unified-analytics';

function MyComponent() {
  const {
    trackEvent,
    setGlobalProperties,
    trackError,
    getFeatureFlag,
  } = useAnalytics();

  const handleLogin = (user) => {
    setGlobalProperties({
      user_id: user.id,
      role: user.role,
      organization: user.org,
    });

    trackEvent('login', { method: 'email' });
  };

  const handleButtonClick = () => {
    trackEvent('button_click', {
      button: 'submit',
      screen: 'Profile',
    });
  };

  const handleError = (error) => {
    trackError(error, {
      screen: 'Profile',
      action: 'update_profile',
    });
  };

  const checkFeature = () => {
    const isEnabled = getFeatureFlag('new_feature');
    if (isEnabled) {
      // Show new feature
    }
  };

  return <Button onPress={handleButtonClick} title="Submit" />;
}
```

---

## Platform Configuration

### Platform Detection

The library auto-detects the platform, but you can explicitly set it:

```javascript
analytics.init({
  platform: 'native', // or 'web'
  // ...
});
```

Auto-detection logic:
- **Native**: `navigator.product === 'ReactNative'`
- **Web**: `typeof window !== 'undefined'` and not React Native

### Platform Utilities

```javascript
import { setPlatform, getPlatform, isWeb, isNative } from 'unified-analytics';

console.log(getPlatform()); // 'web' or 'native'
console.log(isWeb());       // true/false
console.log(isNative());    // true/false
```

---

## Complete API Reference

### Core Methods

#### `trackEvent(name, properties)`
Track a custom event.

```javascript
trackEvent('purchase', {
  product_id: '123',
  amount: 99.99,
  currency: 'USD',
});
```

**Providers**: Countly, PostHog | **Platforms**: Native, Web

---

#### `trackView(viewName, properties)`
Track a screen/page view.

```javascript
trackView('Profile', { user_type: 'premium' });
```

**Providers**: Countly, PostHog | **Platforms**: Native, Web

---

#### `identify(userId, properties)`
Identify a user.

```javascript
identify('user_123', {
  email: 'user@example.com',
  name: 'John Doe',
});
```

**Providers**: Countly, PostHog | **Platforms**: Native, Web

---

#### `setUserProperties(properties)`
Set/update user profile properties.

```javascript
setUserProperties({
  plan: 'premium',
  signup_date: '2024-01-15',
});
```

**Providers**: Countly, PostHog | **Platforms**: Native, Web

---

#### `reset()`
Logout/reset user session.

```javascript
reset();
```

**Providers**: Countly, PostHog | **Platforms**: Native, Web

---

### Global Properties (Unified)

Properties automatically included in **every** event.

#### `setGlobalProperties(properties)`
```javascript
setGlobalProperties({
  user_id: '123',
  role: 'admin',
  app_version: '6.0.0',
});
```

**Internal Mapping**:
- **Countly** -> `userContext` (custom merge on every event)
- **PostHog** -> `register()` (native super properties)

---

#### `getGlobalProperties()`
```javascript
const props = getGlobalProperties();
```

---

#### `clearGlobalProperties()`
```javascript
clearGlobalProperties();
```

---

#### `removeGlobalProperty(key)`
```javascript
removeGlobalProperty('user_id');
```

---

### Timed Events (Unified)

#### `startTimer(eventName)` / `endTimer(eventName, properties)`
```javascript
startTimer('page_load');
// ... later
endTimer('page_load', { page: 'dashboard' });
```

**Providers**: Countly (native), PostHog (graceful no-op)

---

### Error Tracking (Unified)

#### `trackError(error, metadata)`
```javascript
try {
  await riskyOperation();
} catch (error) {
  trackError(error, {
    screen: 'Dashboard',
    action: 'load_data',
    fatal: false,
  });
}
```

**Internal Mapping**:
- **Countly** -> `trackError()` + `addCrashLog()`
- **PostHog** -> `capture('$exception')`

---

### Session Management

Sessions are **automatically managed** by the Countly SDK:
- **Web**: `Countly.track_sessions()` handles begin/end/update automatically based on page visibility
- **React Native**: The SDK automatically tracks sessions based on app foreground/background state

No manual session management is required. The `startSession()` and `endSession()` methods are deprecated no-ops kept for backward compatibility.

---

### Feature Flags (Unified)

#### `getFeatureFlag(key)` / `isFeatureEnabled(key)` / `getAllFeatureFlags()`
```javascript
const flag = getFeatureFlag('new_ui');
const enabled = isFeatureEnabled('beta_features');
const allFlags = getAllFeatureFlags();
```

**Providers**: Countly (returns null/false/{}), PostHog (native)

---

### Navigation Handlers

#### `createNavigationHandlers(navigationRef)` - React Native
```javascript
const { onReady, onStateChange } = analytics.createNavigationHandlers(navigationRef);
```

#### `createWebNavigationHandlers()` - Web
```javascript
const { onRouteChange } = analytics.createWebNavigationHandlers();
onRouteChange('/dashboard'); // Call on route change
```

---

### Screen View Overrides

#### `setScreenViewOverride(screenName, customName)`
```javascript
setScreenViewOverride("Login", "Login - Email Entry");
```

#### `clearScreenViewOverride(screenName)`
```javascript
clearScreenViewOverride("Login");
```

---

### Screen View Tracking Control

Screen view tracking is enabled by default. You can disable it via config or at runtime.

#### Disable via config (at init)
```javascript
analytics.init({
  platform: 'web',
  trackScreenViews: false, // Disables all trackView calls
  countly: { ... },
  posthog: { ... },
})
```

#### `setTrackScreenViews(enabled)` - Toggle at runtime
```javascript
// Disable screen view tracking
analytics.setTrackScreenViews(false)

// Re-enable screen view tracking
analytics.setTrackScreenViews(true)
```

When disabled, both automatic navigation tracking (`createNavigationHandlers` / `createWebNavigationHandlers`) and manual `trackView()` calls are suppressed. Works on both Native and Web.

---

### Provider-Specific (Web Only)

These methods are available when using the Countly web provider:

```javascript
const { countly } = analytics;
countly?.trackScrolls();  // Automatic scroll depth tracking
countly?.trackLinks();    // Automatic link click tracking
countly?.trackForms();    // Automatic form submission tracking
```

---

## Configuration

### Full Configuration Options

```javascript
analytics.init({
  // Platform ('native' | 'web') - auto-detected if omitted
  platform: 'native',

  // Countly Configuration
  countly: {
    serverUrl: string,              // Required
    appKey: string,                 // Required
    debug: boolean,
    enableCrashReporting: boolean,
    requiresConsent: boolean,       // GDPR
    deviceId: string,
    useTemporaryDeviceId: boolean,
    location: {
      countryCode: string,          // ISO 3166-1 alpha-2
      city: string,
      gpsCoordinates: string,       // 'latitude,longitude'
      ipAddress: string,
    },
    disableLocation: boolean,
    tamperingProtectionSalt: string,
  },

  // PostHog Configuration
  posthog: {
    apiKey: string,                 // Required
    host: string,                   // Default: https://us.i.posthog.com
    debug: boolean,
    disabled: boolean,

    // RN-only options
    flushInterval: number,          // Seconds, default: 30
    flushAt: number,                // Events, default: 20
    captureNativeAppLifecycleEvents: boolean,
    sessionReplay: {
      maskAllTextInputs: boolean,
      maskAllImages: boolean,
      captureLog: boolean,          // RN only
      captureNetworkTelemetry: boolean, // RN only
      androidDebouncerDelayMs: number,  // RN only
      iOSdebouncerDelayMs: number,      // RN only
    },
    autocapture: {
      captureTouches: boolean,      // RN only
      captureScreens: boolean,      // RN only
      captureClicks: boolean,       // Web only
      capturePageviews: boolean,    // Web only
      capturePageleave: boolean,    // Web only
    },

    // Common options
    enableSessionReplay: boolean,
    featureFlagsRequestTimeoutMs: number,
    bootstrap: {
      distinctId: string,
      featureFlags: object,
    },
  },

  // Global
  debug: boolean,
  trackScreenViews: boolean,       // Default: true. Set false to disable all screen/page view tracking
});
```

---

## Architecture

### Factory Pattern

Each provider uses a factory/proxy pattern:

```
CountlyProvider.js (factory)
├── CountlyProvider.native.js  (React Native - uses countly-sdk-react-native-bridge)
└── CountlyProvider.web.js     (Web - uses countly-sdk-web)

PostHogProvider.js (factory)
├── PostHogProvider.native.js  (React Native - uses posthog-react-native)
└── PostHogProvider.web.js     (Web - uses posthog-js)
```

The factory detects the platform and dynamically imports the correct implementation. The public API is identical across platforms.

### Feature Support Matrix

| Feature | Countly | PostHog | Platform |
|---------|---------|---------|----------|
| trackEvent | Native | Native | Both |
| trackView | Native | Native | Both |
| setGlobalProperties | Custom (userContext) | Native (register) | Both |
| startTimer/endTimer | Native | No-op | Both |
| trackError | Native | Native (via $exception) | Both |
| Feature Flags | Returns null | Native | Both |
| Session Management | Auto-managed | Auto-managed | Both |
| Session Recording | N/A | Native | Both |
| trackScrolls/Links/Forms | Native | N/A | Web only |

---

## Usage Patterns

### On User Login

```javascript
function handleLogin(user) {
  identify(user.id, { email: user.email, name: user.name });
  setUserProperties({ plan: user.plan });
  setGlobalProperties({ user_id: user.id, role: user.role });
  trackEvent('login', { method: 'email' });
}
```

### On User Logout

```javascript
function handleLogout() {
  trackEvent('logout');
  clearGlobalProperties();
  reset();
}
```

### Error Handling

```javascript
async function saveProfile(data) {
  try {
    await api.saveProfile(data);
    trackEvent('profile_saved');
  } catch (error) {
    trackError(error, { screen: 'Profile', action: 'save_profile' });
  }
}
```

---

## Migration Guide

If you have existing provider-specific code, replace it with unified methods:

```javascript
// Before (provider-specific)
countly.setUserContext({ user_id: '123' });
posthog.register({ user_id: '123' });

// After (unified)
setGlobalProperties({ user_id: '123' });
```

---

## License

Internal use only - ANTZ Systems.

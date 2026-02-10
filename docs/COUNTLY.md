# Countly Provider

Countly is an open-source, self-hostable product analytics platform focused on privacy and data ownership.

## Overview

| Feature | Details |
|---------|---------|
| **Type** | Self-hosted / Cloud |
| **SDK** | `countly-sdk-react-native-bridge` |
| **Min Version** | 24.4.0 |
| **Best For** | Privacy-focused analytics, self-hosted solutions |

## Features

### ✅ Available Features

| Feature | Description |
|---------|-------------|
| **Event Tracking** | Track custom events with segmentation data |
| **Screen/View Tracking** | Track screen views and navigation |
| **User Identification** | Identify users with custom properties |
| **User Profiles** | Rich user profiles with custom fields |
| **Timed Events** | Measure duration of user actions |
| **Crash Reporting** | Automatic and manual crash/error reporting |
| **Session Management** | Automatic session tracking (managed by SDK) |
| **Cohorts** | Group users into segments |
| **User Properties** | Set and increment user properties |

### ❌ Not Available

| Feature | Alternative |
|---------|-------------|
| Session Replay | Use PostHog for this |
| Feature Flags | Use PostHog for this |
| A/B Testing | Use PostHog for this |
| Autocapture | Manual tracking required |
| Surveys | Use PostHog for this |

## Configuration

```typescript
interface CountlyConfig {
  // Required
  serverUrl: string;           // Your Countly server URL
  appKey: string;              // Your app key from Countly dashboard

  // Debugging
  debug?: boolean;             // Enable debug logging (default: false)

  // Core features
  enableCrashReporting?: boolean;  // Enable automatic crash reporting
  requiresConsent?: boolean;   // Require user consent before tracking (GDPR)

  // Device ID
  deviceId?: string;           // Custom device ID (default: auto-generated IDFV/OpenUDID)
  useTemporaryDeviceId?: boolean; // Start with temporary device ID (for pre-login tracking)

  // Location
  location?: {
    countryCode?: string;      // ISO 3166-1 alpha-2 (e.g., 'IN', 'US')
    city?: string;             // City name
    gpsCoordinates?: string;   // GPS as 'latitude,longitude' (e.g., '12.9716,77.5946')
    ipAddress?: string;        // IP address ('0.0.0.0' to disable IP-based location)
  };
  disableLocation?: boolean;   // Disable all location tracking

  // Security
  tamperingProtectionSalt?: string; // Salt for parameter tampering protection
}
```

### Example Configuration

```typescript
analytics.init({
  countly: {
    serverUrl: 'https://your-countly-server.com',
    appKey: 'your-app-key-from-dashboard',
    enableCrashReporting: true,
    requiresConsent: false,
  },
});
```

### Configuration with Device ID & Location

```typescript
analytics.init({
  countly: {
    serverUrl: 'https://your-countly-server.com',
    appKey: 'your-app-key',

    // Custom device ID
    deviceId: 'custom-device-id-123',

    // Or use temporary device ID for pre-login tracking
    // useTemporaryDeviceId: true,

    // Set user location
    location: {
      countryCode: 'IN',
      city: 'Bangalore',
      gpsCoordinates: '12.9716,77.5946',
    },

    // Enable security features
    tamperingProtectionSalt: 'your-secret-salt',

    enableCrashReporting: true,
  },
});
```

## API Reference

### Core Methods (via `useAnalytics()`)

These work across all providers:

```typescript
const { trackEvent, trackView, identify, setUserProperties, reset } = useAnalytics();

// Track event
trackEvent('purchase', { product_id: '123', price: 99.99 });

// Track screen view
trackView('ProductDetail', { product_id: '123' });

// Identify user
identify('user_123', { plan: 'premium' });

// Set user properties
setUserProperties({ subscription: 'yearly' });

// Reset/logout
reset();
```

### Countly-Specific Methods (via `countly.*`)

Access these through the `countly` object from `useAnalytics()`:

```typescript
const { countly } = useAnalytics();

if (countly) {
  // Use Countly-specific features
}
```

#### Timed Events

Measure how long an action takes:

```typescript
// Start timing
countly.startTimedEvent('video_watch');

// ... user watches video ...

// End timing (duration automatically calculated)
countly.endTimedEvent('video_watch', {
  video_id: 'abc123',
  completed: true
});
```

#### Error/Crash Tracking

```typescript
// Track an error
countly.trackError({
  message: 'Payment failed',
  stack: error.stack,
  fatal: false,
  segments: { payment_method: 'card' }
});

// Add breadcrumb for crash reports
countly.addCrashLog('User clicked checkout button');
countly.addCrashLog('Payment form submitted');
```

#### Session Management

Sessions are **automatically managed** by the Countly SDK. The SDK tracks sessions based on app foreground/background state (React Native) or page visibility (Web). No manual session control is needed.

```typescript
// ⚠️ Deprecated - sessions are now auto-managed
// These methods are no-ops kept for backward compatibility
countly.startSession();
countly.endSession();
```

#### User Properties

```typescript
// Increment a property
countly.incrementUserProperty('login_count');
countly.incrementUserProperty('total_purchases', 5);

// Set user profile
countly.setUserProfile({
  name: 'John Doe',
  email: 'john@example.com',
  username: 'johnd',
  organization: 'Acme Inc',
  custom: {
    plan: 'premium',
    signup_date: '2024-01-15',
  },
});
```

#### Cohorts

```typescript
// Add user to cohort
countly.addToCohort('premium_users');
countly.addToCohort('beta_testers');

// Remove from cohort
countly.removeFromCohort('trial_users');
```

#### Device ID Management

Manage device identification for tracking users across sessions:

```typescript
// Change device ID (merges data by default)
countly.changeDeviceId('new-device-id', true);

// Change device ID without merging (creates new user)
countly.changeDeviceId('new-device-id', false);

// Get current device ID
const deviceId = await countly.getDeviceId();

// Switch to temporary device ID mode (for logout)
countly.enableTemporaryDeviceIdMode();
```

**Use Cases:**
- **Login**: Change from temporary ID to user ID with merge
- **Logout**: Switch to temporary device ID mode
- **User Switch**: Change device ID without merge

```typescript
// Example: Login flow
const handleLogin = (userId) => {
  // Merge anonymous data with user account
  countly.changeDeviceId(userId, true);
};

// Example: Logout flow
const handleLogout = () => {
  // Switch to temporary ID mode - events queued until next login
  countly.enableTemporaryDeviceIdMode();
};
```

#### Location Tracking

Set or disable user location:

```typescript
// Set user location
countly.setLocation(
  'IN',                    // Country code (ISO 3166-1 alpha-2)
  'Bangalore',             // City
  '12.9716,77.5946',       // GPS coordinates
  null                     // IP address (null = auto-detect)
);

// Set partial location (only country)
countly.setLocation('US', null, null, null);

// Disable IP-based location
countly.setLocation(null, null, null, '0.0.0.0');

// Disable location tracking entirely
countly.disableLocation();
```

#### Consent Management (GDPR)

For apps requiring user consent before tracking:

```typescript
// Initialize with consent required
analytics.init({
  countly: {
    serverUrl: '...',
    appKey: '...',
    requiresConsent: true,  // No tracking until consent given
  },
});

// Give consent for specific features
countly.giveConsent(['sessions', 'events', 'views']);

// Give consent for all features
countly.giveAllConsent();

// Remove consent for specific features
countly.removeConsent(['crashes']);

// Remove all consent (stop all tracking)
countly.removeAllConsent();
```

**Available Consent Features:**
- `sessions` - Session tracking
- `events` - Event tracking
- `views` - View/screen tracking
- `crashes` - Crash reporting
- `attribution` - Attribution tracking
- `users` - User data collection
- `push` - Push notifications
- `star-rating` - Star rating/feedback
- `location` - Location tracking
- `apm` - Performance monitoring

## Event Best Practices

### Naming Conventions

```typescript
// Good: noun_verb format
trackEvent('product_viewed', { ... });
trackEvent('cart_updated', { ... });
trackEvent('order_completed', { ... });

// Avoid: vague names
trackEvent('click', { ... });  // Too generic
trackEvent('event1', { ... }); // Not descriptive
```

### Segmentation

```typescript
// Include relevant context
trackEvent('purchase', {
  product_id: '123',
  product_name: 'Widget',
  category: 'electronics',
  price: 99.99,
  currency: 'USD',
  quantity: 1,
});
```

## SDK API Reference

The Countly React Native SDK (24.4.X) uses these methods internally:

```javascript
// Events
Countly.events.recordEvent(eventName, segments, count, sum);
Countly.events.startEvent(eventName);
Countly.events.endEvent(eventName, segments);

// Views
Countly.recordView(viewName, segments);

// User data
Countly.setUserData(profileData);
Countly.userData.setProperty(key, value);
Countly.userData.incrementBy(key, value);
Countly.userData.pushUniqueValue(key, value);
Countly.userData.pullValue(key, value);

// Crash reporting
Countly.addCrashLog(message);
Countly.logException(error, nonfatal, segments);

// Sessions (auto-managed, no manual calls needed)
// Countly.beginSession();
// Countly.endSession();

// Initialization
const config = new CountlyConfig(serverUrl, appKey);
await Countly.initWithConfig(config);
```

## Dashboard Insights

With Countly, you can analyze:

- **Events**: See event counts, trends, and segmentation breakdown
- **User Profiles**: View individual user journeys and properties
- **Crashes**: Debug crashes with stack traces and breadcrumbs
- **Sessions**: Analyze session duration and frequency
- **Cohorts**: Compare behavior across user segments
- **Funnels**: Track conversion through multi-step processes
- **Retention**: Measure user retention over time

## Self-Hosting

Countly can be self-hosted for complete data ownership:

```bash
# Docker deployment
docker run -d -p 80:80 countly/countly-server
```

Benefits of self-hosting:
- Complete data ownership
- GDPR/HIPAA compliance
- No data leaves your infrastructure
- Unlimited users and events

## Resources

- [Countly Documentation](https://support.countly.com/hc/en-us)
- [React Native SDK Docs](https://support.countly.com/hc/en-us/articles/360037813231-React-Native-Bridge)
- [Countly GitHub](https://github.com/Countly/countly-sdk-react-native-bridge)
- [Self-Hosting Guide](https://support.countly.com/hc/en-us/articles/360037236571-Installing-Countly-Server)

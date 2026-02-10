# PostHog Provider

PostHog is an open-source product analytics platform with feature flags, session replay, A/B testing, and more.

## Overview

| Feature | Details |
|---------|---------|
| **Type** | Cloud / Self-hosted |
| **SDK** | `posthog-react-native` |
| **Min Version** | 3.0.0 |
| **Best For** | Feature flags, session replay, product experimentation |

## Features

### ✅ Available Features

| Feature | Description |
|---------|-------------|
| **Event Tracking** | Track custom events with properties |
| **Screen Tracking** | Track screen views |
| **User Identification** | Identify users with properties |
| **Session Replay** | Record and replay user sessions |
| **Feature Flags** | Control feature rollout |
| **A/B Testing** | Run experiments |
| **Group Analytics** | Analyze by company/team |
| **Autocapture** | Automatic event capture |
| **Surveys** | In-app user surveys |
| **User Properties** | Set user properties with $set |

### ❌ Not Available

| Feature | Alternative |
|---------|-------------|
| Timed Events | Manual implementation required |
| Crash Reporting | Use Countly or Sentry |
| Cohorts (native) | Use feature flags for targeting |

## Configuration

```typescript
interface PostHogConfig {
  // Required
  apiKey: string;              // Your PostHog project API key

  // Host
  host?: string;               // PostHog instance URL (default: https://us.i.posthog.com)

  // Debugging & Control
  debug?: boolean;             // Enable debug logging (default: false)
  disabled?: boolean;          // Disable tracking entirely (default: false)

  // Flush Settings
  flushInterval?: number;      // Flush interval in seconds (default: 30)
  flushAt?: number;            // Flush after N events (default: 20)

  // Features
  captureNativeAppLifecycleEvents?: boolean; // Capture app lifecycle events
  featureFlagsRequestTimeoutMs?: number;     // Feature flags timeout (default: 10000)

  // Session Replay (Android/iOS only)
  enableSessionReplay?: boolean;
  sessionReplay?: {
    maskAllTextInputs?: boolean;   // Mask text inputs (default: true)
    maskAllImages?: boolean;       // Mask images (default: true)
    captureLog?: boolean;          // Capture logcat on Android (default: true)
    captureNetworkTelemetry?: boolean; // Capture network on iOS (default: true)
    androidDebouncerDelayMs?: number;  // Android debounce delay (default: 1000)
    iOSdebouncerDelayMs?: number;      // iOS debounce delay
  };

  // Autocapture
  autocapture?: {
    captureTouches?: boolean;      // Capture touch events
    captureScreens?: boolean;      // Capture screen views (default: true)
    maxElementsCaptured?: number;  // Max elements per capture
  };

  // Bootstrap (for faster startup)
  bootstrap?: {
    distinctId?: string;           // Bootstrap distinct ID
    featureFlags?: object;         // Bootstrap feature flags
  };
}
```

### Basic Configuration

```typescript
analytics.init({
  posthog: {
    apiKey: 'phc_your_project_api_key',
    host: 'https://us.i.posthog.com', // or your self-hosted URL
    enableSessionReplay: true,
  },
});
```

### Advanced Configuration with Session Replay

```typescript
analytics.init({
  posthog: {
    apiKey: 'phc_your_project_api_key',
    host: 'https://us.i.posthog.com',
    debug: __DEV__,

    // Flush settings
    flushInterval: 15,        // Flush every 15 seconds
    flushAt: 10,              // Flush after 10 events

    // Lifecycle events
    captureNativeAppLifecycleEvents: true,

    // Session replay with masking options
    enableSessionReplay: true,
    sessionReplay: {
      maskAllTextInputs: true,    // Mask sensitive inputs
      maskAllImages: false,       // Don't mask images
      captureLog: true,           // Capture Android logcat
      captureNetworkTelemetry: true, // Capture network on iOS
    },

    // Autocapture
    autocapture: {
      captureTouches: true,
      captureScreens: true,
    },

    // Bootstrap for faster feature flag loading
    bootstrap: {
      distinctId: 'user-123',     // Known user ID
      featureFlags: {
        'new-feature': true,
        'checkout-experiment': 'variant_a',
      },
    },
  },
});
```

## API Reference

### Core Methods (via `useAnalytics()`)

These work across all providers:

```typescript
const { trackEvent, trackView, identify, setUserProperties, reset } = useAnalytics();

// Track event (called 'capture' in PostHog)
trackEvent('purchase', { product_id: '123', price: 99.99 });

// Track screen view
trackView('ProductDetail', { product_id: '123' });

// Identify user
identify('user_123', { email: 'user@example.com' });

// Set user properties
setUserProperties({ plan: 'premium' });

// Reset/logout
reset();
```

### PostHog-Specific Methods (via `posthog.*`)

Access these through the `posthog` object from `useAnalytics()`:

```typescript
const { posthog } = useAnalytics();

if (posthog) {
  // Use PostHog-specific features
}
```

#### Session Replay

Record user sessions for debugging and UX analysis:

```typescript
// Start recording
posthog.startSessionRecording();

// Stop recording
posthog.stopSessionRecording();

// Check if recording
const isRecording = posthog.isSessionRecordingActive();
```

**Session Replay Requirements:**
- SDK version >= 3.2.0
- Android API >= 26
- iOS supported
- Not available in Expo Go (requires development build)

#### Feature Flags

Control feature rollout and run experiments:

```typescript
// Get flag value (boolean or string for multivariate)
const flagValue = posthog.getFeatureFlag('new_checkout_flow');

// Check if feature is enabled (boolean check)
if (posthog.isFeatureEnabled('new_checkout_flow')) {
  // Show new checkout
} else {
  // Show old checkout
}

// Reload flags from server
await posthog.reloadFeatureFlags();

// Subscribe to flag changes
posthog.onFeatureFlags((flags) => {
  console.log('Flags updated:', flags);
});
```

**Feature Flag Use Cases:**
- Gradual rollouts (10% → 50% → 100%)
- A/B testing
- Beta features for specific users
- Kill switches for problematic features
- User targeting (by property, cohort, etc.)

#### Group Analytics

Analyze behavior by company, team, or other groups:

```typescript
// Associate user with a group
posthog.group('company', 'company_123', {
  name: 'Acme Inc',
  plan: 'enterprise',
  employee_count: 500,
});

// Multiple groups
posthog.group('team', 'team_456', { name: 'Engineering' });
```

Events will now include group context, enabling:
- Company-level analytics
- Team comparisons
- B2B product insights

#### Surveys

Display in-app surveys:

```typescript
// Get available surveys
const surveys = await posthog.getSurveys();

// Surveys are automatically shown based on targeting rules
// Configure surveys in PostHog dashboard
```

#### Native Methods

Direct access to PostHog SDK methods:

```typescript
// Capture event (same as trackEvent)
posthog.capture('button_clicked', { button_id: 'submit' });

// Screen event (same as trackView)
posthog.screen('HomeScreen', { tab: 'feed' });
```

#### Tracking Control

Enable/disable tracking programmatically:

```typescript
// Disable all tracking
posthog.setDisabled(true);

// Re-enable tracking
posthog.setDisabled(false);

// Check if tracking is disabled
const isDisabled = posthog.isDisabled();

// Opt out of tracking (GDPR)
posthog.optOut();

// Opt back in
posthog.optIn();

// Check opt-out status
const hasOptedOut = posthog.hasOptedOut();
```

#### Flush & Shutdown

Control when events are sent to PostHog:

```typescript
// Force flush events to server immediately
await posthog.flush();

// Shutdown PostHog client (call before app termination if needed)
await posthog.shutdown();
```

#### Distinct ID & Alias

Manage user identification:

```typescript
// Get current distinct ID
const distinctId = posthog.getDistinctId();

// Create an alias for the current user
// Useful for linking anonymous user to identified user
posthog.alias('user_123');
```

#### Super Properties

Register properties that are sent with every event:

```typescript
// Register super properties
posthog.register({
  app_version: '1.2.3',
  platform: 'ios',
  user_tier: 'premium',
});

// Unregister a super property
posthog.unregister('user_tier');
```

**Super Properties Use Cases:**
- App version for debugging
- User tier for segmentation
- A/B test assignments
- Device information

## Feature Flags Best Practices

### Naming Conventions

```typescript
// Good: descriptive, lowercase with underscores
'new_checkout_flow'
'show_recommendations'
'enable_dark_mode'

// Avoid
'flag1'
'newFeature'
'ENABLE_THING'
```

### Safe Usage Pattern

```typescript
function MyComponent() {
  const { posthog } = useAnalytics();
  const [showNewFeature, setShowNewFeature] = useState(false);

  useEffect(() => {
    if (posthog) {
      // Check flag on mount
      setShowNewFeature(posthog.isFeatureEnabled('new_feature'));

      // Subscribe to updates
      posthog.onFeatureFlags((flags) => {
        setShowNewFeature(flags.new_feature === true);
      });
    }
  }, [posthog]);

  return showNewFeature ? <NewFeature /> : <OldFeature />;
}
```

### Multivariate Flags

```typescript
const variant = posthog.getFeatureFlag('checkout_experiment');

switch (variant) {
  case 'control':
    return <OriginalCheckout />;
  case 'variant_a':
    return <CheckoutVariantA />;
  case 'variant_b':
    return <CheckoutVariantB />;
  default:
    return <OriginalCheckout />;
}
```

## Session Replay Best Practices

### Privacy Considerations

```typescript
// Mark sensitive inputs in your components
<TextInput
  secureTextEntry={true}
  // PostHog automatically masks secure text entries
/>

// For custom masking, use PostHog's masking API
// Configure in PostHog dashboard
```

### Performance

- Session replay adds minimal overhead
- Recordings are compressed and uploaded in batches
- Consider enabling only for specific user segments

## Event Best Practices

### Naming Conventions

PostHog recommends `[object] [verb]` format:

```typescript
// Good
trackEvent('product viewed', { product_id: '123' });
trackEvent('cart updated', { items_count: 3 });
trackEvent('order completed', { total: 99.99 });

// PostHog special events (prefixed with $)
// $pageview, $screen, $identify, $set - handled automatically
```

### Properties

```typescript
trackEvent('purchase', {
  // Standard properties
  product_id: '123',
  product_name: 'Widget',
  price: 99.99,

  // PostHog will automatically add:
  // $current_url, $screen_name, $device_type, etc.
});
```

## User Properties

### Setting Properties

```typescript
// Using $set (overwrites existing values)
identify('user_123', {
  email: 'user@example.com',
  plan: 'premium',
});

// Using setUserProperties
setUserProperties({
  last_login: new Date().toISOString(),
});
```

### Special Properties

PostHog recognizes these special properties:
- `email` - User's email
- `name` - User's name
- `$initial_referrer` - First referrer
- `$initial_referring_domain` - First referring domain

## Dashboard Insights

With PostHog, you can:

- **Product Analytics**: Funnels, retention, paths, trends
- **Session Recordings**: Watch real user sessions
- **Feature Flags**: Control rollouts and run experiments
- **Experiments**: A/B test with statistical significance
- **Surveys**: Collect user feedback
- **Group Analytics**: B2B company-level insights
- **Cohorts**: Create and analyze user segments
- **Data Warehouse**: Query your data directly

## Self-Hosting

PostHog can be self-hosted:

```bash
# Docker deployment
docker run -d -p 8000:8000 posthog/posthog
```

Benefits:
- Data stays on your infrastructure
- No event limits
- Full control over data retention
- GDPR/HIPAA compliance

## Pricing

| Tier | Events/Month | Features |
|------|--------------|----------|
| Free | 1M | Core analytics, basic flags |
| Paid | Usage-based | Session replay, advanced flags |
| Self-hosted | Unlimited | All features |

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [React Native SDK Docs](https://posthog.com/docs/libraries/react-native)
- [Feature Flags Guide](https://posthog.com/docs/feature-flags)
- [Session Replay Docs](https://posthog.com/docs/session-replay)
- [PostHog GitHub](https://github.com/PostHog/posthog)
- [Self-Hosting Guide](https://posthog.com/docs/self-host)

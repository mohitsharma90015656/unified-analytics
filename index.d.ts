import React from 'react';

/**
 * Unified Analytics Configuration
 */
export interface AnalyticsConfig {
    platform?: 'web' | 'native';
    debug?: boolean;
    trackScreenViews?: boolean;
    countly?: {
        serverUrl: string;
        appKey: string;
        debug?: boolean;
        enableCrashReporting?: boolean;
        requiresConsent?: boolean;
        deviceId?: string;
        useTemporaryDeviceId?: boolean;
        location?: {
            countryCode?: string;
            city?: string;
            gpsCoordinates?: string;
            ipAddress?: string;
        };
        disableLocation?: boolean;
        tamperingProtectionSalt?: string;
    };
    posthog?: {
        apiKey: string;
        host?: string;
        debug?: boolean;
        disabled?: boolean;
        flushInterval?: number;
        flushAt?: number;
        captureNativeAppLifecycleEvents?: boolean;
        sessionReplay?: {
            maskAllTextInputs?: boolean;
            maskAllImages?: boolean;
            captureLog?: boolean;
            captureNetworkTelemetry?: boolean;
            androidDebouncerDelayMs?: number;
            iOSdebouncerDelayMs?: number;
        };
        autocapture?: {
            captureTouches?: boolean;
            captureScreens?: boolean;
            captureClicks?: boolean;
            capturePageviews?: boolean;
            capturePageleave?: boolean;
        };
        enableSessionReplay?: boolean;
        featureFlagsRequestTimeoutMs?: number;
        bootstrap?: {
            distinctId?: string;
            featureFlags?: Record<string, any>;
        };
    };
}

/**
 * UnifiedAnalytics Orchestrator Class
 */
export class UnifiedAnalytics {
    init(config: AnalyticsConfig): Promise<void>;
    isInitialized(): boolean;
    getEnabledProviders(): string[];
    hasProvider(name: 'countly' | 'posthog'): boolean;

    trackEvent(name: string, properties?: Record<string, any>): void;
    trackView(viewName: string, properties?: Record<string, any>): void;
    setScreenViewOverride(screenName: string, customName: string): void;
    clearScreenViewOverride(screenName: string): void;
    setTrackScreenViews(enabled: boolean): void;

    identify(userId: string, properties?: Record<string, any>): void;
    setUserProperties(properties: Record<string, any>): void;
    reset(): void;

    setGlobalProperties(properties: Record<string, any>): void;
    getGlobalProperties(): Record<string, any>;
    clearGlobalProperties(): void;
    removeGlobalProperty(key: string): void;

    startTimer(eventName: string): void;
    endTimer(eventName: string, properties?: Record<string, any>): void;

    trackError(error: any, metadata?: Record<string, any>): void;

    getFeatureFlag(key: string): any;
    isFeatureEnabled(key: string): boolean;
    getAllFeatureFlags(): Record<string, any>;
    onFeatureFlagsChange(callback: (flags: Record<string, any>) => void): () => void;

    startSession(): void;
    endSession(): void;

    createNavigationHandlers(navigationRef: any): {
        onReady: () => void;
        onStateChange: () => void;
    };

    createWebNavigationHandlers(): {
        onRouteChange: (url: string) => void;
    };

    readonly countly?: any;
    readonly posthog?: any;
}

export const analytics: UnifiedAnalytics;

/**
 * React Integration
 */
export interface AnalyticsProviderProps {
    config?: AnalyticsConfig;
    children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps>;

export function useAnalyticsContext(): {
    analytics: UnifiedAnalytics;
    isInitialized: boolean;
};

export class BaseProvider {
    init(config: any): Promise<void>;
    isInitialized(): boolean;
    setDebug(debug: boolean): void;
}

export class CountlyProvider extends BaseProvider { }
export class PostHogProvider extends BaseProvider { }

/**
 * Main hook for analytics
 */
export function useAnalytics(): {
    isInitialized: boolean;
    trackEvent: (name: string, properties?: Record<string, any>) => void;
    trackView: (viewName: string, properties?: Record<string, any>) => void;
    identify: (userId: string, properties?: Record<string, any>) => void;
    setUserProperties: (properties: Record<string, any>) => void;
    reset: () => void;
    setGlobalProperties: (properties: Record<string, any>) => void;
    getGlobalProperties: () => Record<string, any>;
    clearGlobalProperties: () => void;
    removeGlobalProperty: (key: string) => void;
    startTimer: (eventName: string) => void;
    endTimer: (eventName: string, properties?: Record<string, any>) => void;
    trackError: (error: any, metadata?: Record<string, any>) => void;
    startSession: () => void;
    endSession: () => void;
    getFeatureFlag: (key: string) => any;
    isFeatureEnabled: (key: string) => boolean;
    getAllFeatureFlags: () => Record<string, any>;
    onFeatureFlagsChange: (callback: (flags: Record<string, any>) => void) => () => void;
    setScreenViewOverride: (screenName: string, customName: string) => void;
    clearScreenViewOverride: (screenName: string) => void;
    getEnabledProviders: () => string[];
    hasProvider: (name: string) => boolean;
};

/**
 * Platform Utilities
 */
export function setPlatform(platform: 'web' | 'native'): void;
export function getPlatform(): 'web' | 'native';
export function isWeb(): boolean;
export function isNative(): boolean;

/**
 * Helpers
 */
export function createLogger(debug: boolean): any;
export function validateConfig(config: any): { valid: boolean; errors: string[] };

export default analytics;

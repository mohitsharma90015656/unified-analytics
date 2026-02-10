/**
 * AnalyticsProvider - React Context provider for analytics
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { analytics } from '../UnifiedAnalytics';

/**
 * Create context with default value
 */
const AnalyticsContext = createContext({
  analytics,
  isInitialized: false,
});

/**
 * AnalyticsProvider component
 * Wraps your app and provides analytics context
 *
 * Usage:
 * ```jsx
 * // Option 1: Initialize separately and just provide context
 * analytics.init(config);
 * <AnalyticsProvider>
 *   <App />
 * </AnalyticsProvider>
 *
 * // Option 2: Initialize via provider
 * <AnalyticsProvider config={config}>
 *   <App />
 * </AnalyticsProvider>
 * ```
 */
export function AnalyticsProvider({ config, children }) {
  const [isInitialized, setIsInitialized] = useState(analytics.isInitialized());

  useEffect(() => {
    // If config provided and not initialized, initialize
    if (config && !analytics.isInitialized()) {
      analytics
        .init(config)
        .then(() => {
          setIsInitialized(true);
        })
        .catch((error) => {
          console.error('[AnalyticsProvider] Initialization failed:', error);
        });
    } else if (analytics.isInitialized()) {
      setIsInitialized(true);
    }
  }, [config]);

  const contextValue = {
    analytics,
    isInitialized,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Hook to access analytics context
 */
export function useAnalyticsContext() {
  return useContext(AnalyticsContext);
}

export { AnalyticsContext };

// ============================================================================
// Error Reporting - Sentry integration for crash & error tracking
// ============================================================================

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || '';

/** Initialize Sentry — call once in App.tsx */
export function initErrorReporting() {
  if (!SENTRY_DSN) {
    if (__DEV__) console.log('[Sentry] No DSN configured, error reporting disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
  });
}

/** Set user context after login */
export function setErrorUser(email: string, role?: string) {
  Sentry.setUser({ email, ...(role ? { role } : {}) });
}

/** Clear user on logout */
export function clearErrorUser() {
  Sentry.setUser(null);
}

/** Log a non-fatal error */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (context) {
    Sentry.setContext('extra', context);
  }
  Sentry.captureException(error);
}

/** Log a breadcrumb for debugging */
export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

/** Wrap a component with Sentry error boundary */
export const SentryErrorBoundary = Sentry.wrap;

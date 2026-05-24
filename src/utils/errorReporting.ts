// ============================================================================
// Error Reporting - Logs errors to console (Sentry can be added later)
// ============================================================================

/** Log a non-fatal error */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error('[Error]', error.message, context || '');
  }
}

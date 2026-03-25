// ============================================================================
// API Configuration
// ============================================================================

/**
 * The GAS web app URL. In production, this is the deployed Apps Script URL.
 * The mobile app communicates with the GAS backend via HTTP POST to this URL,
 * which routes to the appropriate data* function.
 *
 * IMPORTANT: Update this URL after deploying the GAS mobile API bridge.
 * The URL format is: https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
 */
export const API_CONFIG = {
  /** Base URL of the deployed GAS web app */
  baseUrl: '',

  /** Request timeout in milliseconds */
  timeout: 30000,

  /** Max retries for failed requests */
  maxRetries: 2,

  /** Retry delay base (doubles each attempt) */
  retryDelayMs: 1000,

  /** Session token header name */
  sessionHeader: 'X-Session-Token',

  /** App version sent with requests */
  appVersion: '1.0.0',
} as const;

/**
 * Set the API base URL at runtime (e.g., from stored config or deep link).
 * This allows the app to connect to different GAS deployments.
 */
let _baseUrl = API_CONFIG.baseUrl;

export function setApiBaseUrl(url: string): void {
  _baseUrl = url.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  return _baseUrl;
}

// ============================================================================
// API Client - HTTP layer for communicating with GAS backend
// ============================================================================

import { getApiBaseUrl, API_CONFIG } from './config';
import { getSessionToken } from '../auth/session';
import type { ApiResponse } from '../types';

interface RequestOptions {
  /** The GAS function name to call (e.g., 'dataGetBatchData') */
  action: string;
  /** Arguments to pass to the GAS function */
  params?: Record<string, unknown>;
  /** Override timeout for this request */
  timeout?: number;
  /** Skip auth token (for login/magic link requests) */
  skipAuth?: boolean;
}

/**
 * Calls a GAS function via the mobile API bridge.
 *
 * The GAS backend exposes a doPost(e) handler that:
 * 1. Reads the action name from the POST body
 * 2. Validates the session token
 * 3. Calls the corresponding data* function
 * 4. Returns JSON response
 */
export async function apiCall<T = unknown>(options: RequestOptions): Promise<ApiResponse<T>> {
  const { action, params = {}, timeout = API_CONFIG.timeout, skipAuth = false } = options;
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    return { success: false, message: 'API not configured. Please set up your dashboard URL.' };
  }

  const sessionToken = skipAuth ? null : await getSessionToken();
  if (!skipAuth && !sessionToken) {
    return { success: false, message: 'Not authenticated.', authError: true };
  }

  const body = JSON.stringify({
    action,
    sessionToken: sessionToken || undefined,
    ...params,
  });

  let lastError: string = 'Unknown error';

  for (let attempt = 0; attempt <= API_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionToken) {
        headers[API_CONFIG.sessionHeader] = sessionToken;
      }

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        if (attempt < API_CONFIG.maxRetries) {
          await delay(API_CONFIG.retryDelayMs * Math.pow(2, attempt));
          continue;
        }
        return { success: false, message: lastError };
      }

      const text = await response.text();
      let data: T;
      try {
        data = JSON.parse(text);
      } catch {
        return { success: false, message: 'Invalid response from server.' };
      }

      // GAS functions return objects directly - wrap if needed
      if (data && typeof data === 'object' && 'success' in data) {
        return data as unknown as ApiResponse<T>;
      }

      return { success: true, data };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = 'Request timed out.';
      } else if (err instanceof Error) {
        lastError = err.message;
      }

      if (attempt < API_CONFIG.maxRetries) {
        await delay(API_CONFIG.retryDelayMs * Math.pow(2, attempt));
        continue;
      }
    }
  }

  return { success: false, message: lastError };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convenience wrapper that extracts data or throws.
 */
export async function apiCallOrThrow<T>(options: RequestOptions): Promise<T> {
  const result = await apiCall<T>(options);
  if (!result.success) {
    throw new Error(result.message || 'API call failed');
  }
  return result.data as T;
}

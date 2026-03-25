// ============================================================================
// Session Management - Secure token storage for mobile
// ============================================================================

import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'dds_session_token';
const SESSION_EMAIL_KEY = 'dds_session_email';
const SESSION_ROLE_KEY = 'dds_session_role';
const SESSION_EXPIRY_KEY = 'dds_session_expiry';
const API_URL_KEY = 'dds_api_url';

/** Store session after successful authentication */
export async function saveSession(
  token: string,
  email: string,
  role: string,
  expiresInHours: number = 720 // 30 days default
): Promise<void> {
  const expiry = Date.now() + expiresInHours * 60 * 60 * 1000;
  await Promise.all([
    SecureStore.setItemAsync(SESSION_KEY, token),
    SecureStore.setItemAsync(SESSION_EMAIL_KEY, email),
    SecureStore.setItemAsync(SESSION_ROLE_KEY, role),
    SecureStore.setItemAsync(SESSION_EXPIRY_KEY, String(expiry)),
  ]);
}

/** Get the current session token (or null if expired/missing) */
export async function getSessionToken(): Promise<string | null> {
  try {
    const [token, expiry] = await Promise.all([
      SecureStore.getItemAsync(SESSION_KEY),
      SecureStore.getItemAsync(SESSION_EXPIRY_KEY),
    ]);

    if (!token) return null;
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      await clearSession();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

/** Get stored session email */
export async function getSessionEmail(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_EMAIL_KEY);
  } catch {
    return null;
  }
}

/** Get stored session role */
export async function getSessionRole(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_ROLE_KEY);
  } catch {
    return null;
  }
}

/** Check if user has a valid (non-expired) session */
export async function hasValidSession(): Promise<boolean> {
  const token = await getSessionToken();
  return token !== null;
}

/** Clear all session data (logout) */
export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SESSION_KEY),
    SecureStore.deleteItemAsync(SESSION_EMAIL_KEY),
    SecureStore.deleteItemAsync(SESSION_ROLE_KEY),
    SecureStore.deleteItemAsync(SESSION_EXPIRY_KEY),
  ]);
}

/** Store the API URL persistently */
export async function saveApiUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(API_URL_KEY, url);
}

/** Get stored API URL */
export async function getStoredApiUrl(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(API_URL_KEY);
  } catch {
    return null;
  }
}

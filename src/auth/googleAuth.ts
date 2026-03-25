// ============================================================================
// Google Sign-In - Primary authentication method
// ============================================================================
//
// Uses expo-auth-session with Google OAuth to get the user's email,
// then validates against the GAS backend (Member Directory).
//
// This avoids the GAS Session.getActiveUser() limitation that returns
// empty in "Execute as: Me" web apps.

import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-linking';

// Complete auth session after redirect
WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth configuration.
 * IMPORTANT: Replace these with your actual Google Cloud OAuth client IDs.
 * You need separate client IDs for iOS, Android, and web.
 *
 * Steps:
 * 1. Go to Google Cloud Console → APIs & Services → Credentials
 * 2. Create OAuth 2.0 Client IDs for:
 *    - iOS (bundle ID: com.seiu509.ddsdashboard)
 *    - Android (package: com.seiu509.ddsdashboard, SHA-1 from EAS)
 *    - Web (for Expo Go development)
 * 3. Replace the placeholder IDs below
 */
export const GOOGLE_CONFIG = {
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  scopes: ['openid', 'email', 'profile'],
} as const;

/**
 * Returns true if Google OAuth client IDs have been configured (not placeholders).
 * The app should check this before attempting Google sign-in.
 */
export function isGoogleAuthConfigured(): boolean {
  return !GOOGLE_CONFIG.webClientId.startsWith('YOUR_');
}

/**
 * Build the Google OAuth URL for authentication.
 * Returns the auth URL that should be opened in a web browser.
 */
export function buildGoogleAuthUrl(): { url: string; redirectUri: string } {
  const redirectUri = makeRedirectUri({
    scheme: 'ddsdashboard',
    path: 'auth/callback',
  });

  const params = new URLSearchParams({
    client_id: GOOGLE_CONFIG.webClientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: GOOGLE_CONFIG.scopes.join(' '),
    prompt: 'select_account',
  });

  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    redirectUri,
  };
}

/**
 * Extract email from Google OAuth access token by calling the userinfo endpoint.
 */
export async function getEmailFromGoogleToken(accessToken: string): Promise<{
  email: string;
  name: string;
  picture?: string;
} | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      email: data.email?.toLowerCase() || '',
      name: data.name || '',
      picture: data.picture,
    };
  } catch {
    return null;
  }
}

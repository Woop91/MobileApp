// ============================================================================
// Deep Link Handler - Magic link and URL scheme handling
// ============================================================================
//
// Handles incoming deep links:
//   groupup://auth?token=...     → Magic link login
//   groupup://auth/callback#...  → Google OAuth callback
//   groupup://case/GR-001       → Open specific case
//   groupup://profile            → Open profile
//
// The linking config is registered in App.tsx and the handler
// is called from RootNavigator when a deep link arrives.

import * as Linking from 'expo-linking';

/** Parsed deep link */
export interface DeepLink {
  type: 'magic_link' | 'google_callback' | 'case' | 'profile' | 'unknown';
  token?: string;
  caseId?: string;
  raw: string;
}

/**
 * Parse an incoming URL into a structured deep link.
 */
export function parseDeepLink(url: string): DeepLink {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path || '';
    const params = parsed.queryParams || {};

    // Magic link: groupup://auth?token=xxx
    if (path === 'auth' && params.token) {
      return { type: 'magic_link', token: params.token as string, raw: url };
    }

    // Google OAuth callback: groupup://auth/callback#access_token=xxx
    if (path === 'auth/callback' || path.startsWith('auth/callback')) {
      return { type: 'google_callback', raw: url };
    }

    // Case deep link: groupup://case/GR-001
    if (path.startsWith('case/')) {
      const caseId = path.replace('case/', '');
      return { type: 'case', caseId, raw: url };
    }

    // Profile: groupup://profile
    if (path === 'profile') {
      return { type: 'profile', raw: url };
    }

    return { type: 'unknown', raw: url };
  } catch {
    return { type: 'unknown', raw: url };
  }
}

/**
 * Get the initial URL that launched the app (cold start deep link).
 */
export async function getInitialDeepLink(): Promise<DeepLink | null> {
  try {
    const url = await Linking.getInitialURL();
    if (url) return parseDeepLink(url);
  } catch {
    // No initial URL
  }
  return null;
}

/**
 * Subscribe to incoming deep links while the app is open.
 * Returns an unsubscribe function.
 */
export function subscribeToDeepLinks(
  handler: (link: DeepLink) => void
): () => void {
  const subscription = Linking.addEventListener('url', (event) => {
    const link = parseDeepLink(event.url);
    handler(link);
  });
  return () => subscription.remove();
}

/**
 * Build the linking configuration for React Navigation.
 */
export const linkingConfig = {
  prefixes: [
    'groupup://',
    Linking.createURL('/'),
  ],
  config: {
    screens: {
      Auth: 'auth',
      StewardApp: {
        screens: {
          Dashboard: {
            screens: {
              DashboardHome: 'steward',
              CaseDetail: 'case/:caseId',
            },
          },
          Cases: 'cases',
          Members: 'members',
          Tasks: 'tasks',
          More: {
            screens: {
              Profile: 'profile',
              Notifications: 'notifications',
            },
          },
        },
      },
      MemberApp: {
        screens: {
          Home: 'member',
          'My Cases': 'my-cases',
          Profile: 'profile',
        },
      },
    },
  },
};

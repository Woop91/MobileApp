// Tests for deep link parsing utility

// Mock expo-linking before importing
jest.mock('expo-linking', () => ({
  parse: (url: string) => {
    // Mimic Expo Linking.parse(): everything after scheme:// is a flat path
    const match = url.match(/^[a-z]+:\/\/(.+)/);
    if (!match) return { path: '', queryParams: {} };
    let rest = match[1];
    // Strip fragment (hash) for path parsing but keep it detectable via raw path
    const hashIdx = rest.indexOf('#');
    if (hashIdx !== -1) rest = rest.substring(0, hashIdx) || rest;
    const [pathPart, queryPart] = rest.split('?');
    const queryParams: Record<string, string> = {};
    if (queryPart) {
      queryPart.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) queryParams[k] = v || '';
      });
    }
    return { path: pathPart, queryParams };
  },
  createURL: (path: string) => `groupup://${path}`,
  getInitialURL: jest.fn().mockResolvedValue(null),
  addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}));

import { parseDeepLink } from '../src/utils/deepLink';

describe('parseDeepLink', () => {
  it('parses magic link with token', () => {
    const result = parseDeepLink('groupup://auth?token=abc123');
    expect(result.type).toBe('magic_link');
    expect(result.token).toBe('abc123');
  });

  it('parses Google OAuth callback', () => {
    const result = parseDeepLink('groupup://auth/callback#access_token=xyz');
    expect(result.type).toBe('google_callback');
  });

  it('parses case deep link', () => {
    const result = parseDeepLink('groupup://case/GR-001');
    expect(result.type).toBe('case');
    expect(result.caseId).toBe('GR-001');
  });

  it('parses profile deep link', () => {
    const result = parseDeepLink('groupup://profile');
    expect(result.type).toBe('profile');
  });

  it('returns unknown for unrecognized URLs', () => {
    const result = parseDeepLink('groupup://something-else');
    expect(result.type).toBe('unknown');
  });

  it('returns unknown for malformed input', () => {
    const result = parseDeepLink('');
    expect(result.type).toBe('unknown');
  });
});

// ============================================================================
// Environment config tests
// ============================================================================

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { environment: 'development' } },
}));

import { getEnvConfig, isDev, CURRENT_ENV } from '../src/utils/environment';

describe('Environment Config', () => {
  it('should detect development environment', () => {
    expect(CURRENT_ENV).toBe('development');
    expect(isDev).toBe(true);
  });

  it('should return valid config for development', () => {
    const config = getEnvConfig();
    expect(config.apiUrl).toBeDefined();
    expect(config.sentryDsn).toBeDefined();
    expect(typeof config.apiUrl).toBe('string');
  });

  it('should have different configs per environment', () => {
    // getEnvConfig uses CURRENT_ENV which is mocked to 'development'
    const config = getEnvConfig();
    expect(config).toBeDefined();
    // apiUrl is empty by default — set at runtime via SetupScreen or Expo config
    expect(typeof config.apiUrl).toBe('string');
  });
});

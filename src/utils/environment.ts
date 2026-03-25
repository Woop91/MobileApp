// ============================================================================
// Environment Config - Dev/Staging/Production API URLs
// ============================================================================

import Constants from 'expo-constants';

export type Environment = 'development' | 'staging' | 'production';

interface EnvConfig {
  apiUrl: string;
  environment: Environment;
  sentryDsn: string;
  enableAnalytics: boolean;
  enableDevTools: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const ENV_CONFIGS: Record<Environment, EnvConfig> = {
  development: {
    apiUrl: '',
    environment: 'development',
    sentryDsn: '',
    enableAnalytics: false,
    enableDevTools: true,
    logLevel: 'debug',
  },
  staging: {
    apiUrl: '',
    environment: 'staging',
    sentryDsn: '',
    enableAnalytics: false,
    enableDevTools: true,
    logLevel: 'info',
  },
  production: {
    apiUrl: '',
    environment: 'production',
    sentryDsn: '',
    enableAnalytics: true,
    enableDevTools: false,
    logLevel: 'warn',
  },
};

/** Detect current environment from Expo config */
function detectEnvironment(): Environment {
  const extra = Constants.expoConfig?.extra;
  if (extra?.environment) return extra.environment as Environment;
  if (__DEV__) return 'development';
  const releaseChannel = (Constants.expoConfig as Record<string, unknown>)?.releaseChannel as string | undefined;
  if (releaseChannel?.includes('staging')) return 'staging';
  return 'production';
}

/** Current environment */
export const CURRENT_ENV = detectEnvironment();

/** Get full config for current environment */
export function getEnvConfig(): EnvConfig {
  const config = { ...ENV_CONFIGS[CURRENT_ENV] };

  // Override from Expo extra config if available
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiUrl) config.apiUrl = extra.apiUrl;
  if (extra?.sentryDsn) config.sentryDsn = extra.sentryDsn;

  return config;
}

/** Check if we're in development */
export const isDev = CURRENT_ENV === 'development';

/** Check if dev tools should be shown */
export const showDevTools = getEnvConfig().enableDevTools;

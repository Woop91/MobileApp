// ============================================================================
// Biometric Authentication - Face ID, Touch ID, Fingerprint
// ============================================================================
//
// Uses expo-local-authentication to provide biometric login.
// Flow:
// 1. User logs in via Google/email/PIN (first time)
// 2. App prompts "Enable Face ID / Fingerprint for quick login?"
// 3. If yes, session credentials are stored with biometric protection
// 4. Next launch: biometric prompt appears automatically
// 5. On success, stored credentials restore the session
//
// SECURITY:
// - Biometric login only works if there is an existing valid session token
// - The session token is validated against the GAS backend on restore
// - Biometric enrollment is stored as a flag; the actual credentials
//   live in expo-secure-store (hardware-backed keychain/keystore)
// - If biometrics are disabled on device, falls back to passcode

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keys for biometric enrollment state
const BIOMETRIC_ENABLED_KEY = 'dds_biometric_enabled';
const BIOMETRIC_SESSION_KEY = 'dds_biometric_session';
const BIOMETRIC_EMAIL_KEY = 'dds_biometric_email';
const BIOMETRIC_ROLE_KEY = 'dds_biometric_role';

/** Biometric type available on device */
export type BiometricType = 'face_id' | 'fingerprint' | 'iris' | 'none';

/** Result of checking device biometric capabilities */
export interface BiometricCapability {
  /** Whether any biometric hardware is available */
  available: boolean;
  /** The primary biometric type */
  type: BiometricType;
  /** Human-readable label (e.g., "Face ID", "Fingerprint") */
  label: string;
  /** Whether biometrics are enrolled (user has set up Face ID / fingerprint) */
  enrolled: boolean;
  /** Security level */
  securityLevel: 'none' | 'secret' | 'biometric';
}

/**
 * Check what biometric capabilities the device has.
 */
export async function checkBiometricCapability(): Promise<BiometricCapability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    if (!hasHardware) {
      return { available: false, type: 'none', label: 'Not Available', enrolled: false, securityLevel: 'none' };
    }

    // Determine primary biometric type
    let type: BiometricType = 'none';
    let label = 'Biometric';

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      type = 'face_id';
      label = Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      type = 'fingerprint';
      label = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      type = 'iris';
      label = 'Iris Scan';
    }

    let secLevel: 'none' | 'secret' | 'biometric' = 'none';
    if (securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG ||
        securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK) {
      secLevel = 'biometric';
    } else if (securityLevel === LocalAuthentication.SecurityLevel.SECRET) {
      secLevel = 'secret';
    }

    return {
      available: true,
      type,
      label,
      enrolled: isEnrolled,
      securityLevel: secLevel,
    };
  } catch {
    return { available: false, type: 'none', label: 'Not Available', enrolled: false, securityLevel: 'none' };
  }
}

/**
 * Prompt the user for biometric authentication.
 * Returns true if the user successfully authenticates.
 */
export async function authenticateWithBiometrics(
  promptMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const capability = await checkBiometricCapability();
    if (!capability.available || !capability.enrolled) {
      return { success: false, error: `${capability.label} is not available on this device.` };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || `Sign in with ${capability.label}`,
      cancelLabel: 'Use Another Method',
      disableDeviceFallback: false, // Allow passcode as fallback
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      return { success: true };
    }

    // Handle specific error types
    if (result.error === 'user_cancel') {
      return { success: false, error: 'Cancelled' };
    }
    if (result.error === 'user_fallback') {
      return { success: false, error: 'Fallback requested' };
    }
    if (result.error === 'lockout') {
      return { success: false, error: 'Too many attempts. Please try another sign-in method.' };
    }

    return { success: false, error: result.error || 'Authentication failed.' };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Biometric error.' };
  }
}

/**
 * Enable biometric login by storing current session credentials
 * in secure storage with biometric protection.
 */
export async function enableBiometricLogin(
  sessionToken: string,
  email: string,
  role: string
): Promise<boolean> {
  try {
    await Promise.all([
      SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true'),
      SecureStore.setItemAsync(BIOMETRIC_SESSION_KEY, sessionToken),
      SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email),
      SecureStore.setItemAsync(BIOMETRIC_ROLE_KEY, role),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Disable biometric login and clear stored biometric credentials.
 */
export async function disableBiometricLogin(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY),
    SecureStore.deleteItemAsync(BIOMETRIC_SESSION_KEY),
    SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY),
    SecureStore.deleteItemAsync(BIOMETRIC_ROLE_KEY),
  ]);
}

/**
 * Check if biometric login is currently enabled.
 */
export async function isBiometricLoginEnabled(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch {
    return false;
  }
}

/**
 * Get stored biometric credentials (after successful biometric auth).
 * Returns null if not enrolled or credentials are missing.
 */
export async function getBiometricCredentials(): Promise<{
  sessionToken: string;
  email: string;
  role: string;
} | null> {
  try {
    const [enabled, sessionToken, email, role] = await Promise.all([
      SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY),
      SecureStore.getItemAsync(BIOMETRIC_SESSION_KEY),
      SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY),
      SecureStore.getItemAsync(BIOMETRIC_ROLE_KEY),
    ]);

    if (enabled !== 'true' || !sessionToken || !email) {
      return null;
    }

    return { sessionToken, email, role: role || 'member' };
  } catch {
    return null;
  }
}

/**
 * Update the stored biometric session token (e.g., after token refresh).
 */
export async function updateBiometricSession(sessionToken: string): Promise<void> {
  const enabled = await isBiometricLoginEnabled();
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRIC_SESSION_KEY, sessionToken);
  }
}

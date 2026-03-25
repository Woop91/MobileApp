// ============================================================================
// Auth Context - Global authentication state for React Native
// ============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  saveSession,
  clearSession,
  getSessionToken,
  getSessionEmail,
  getSessionRole,
  hasValidSession,
} from './session';
import { authenticateWithPin, type PinAuthLevel } from './pinAuth';
import {
  authenticateWithBiometrics,
  checkBiometricCapability,
  enableBiometricLogin,
  disableBiometricLogin,
  isBiometricLoginEnabled,
  getBiometricCredentials,
  updateBiometricSession,
  type BiometricCapability,
} from './biometrics';
import { api } from '../api';
import { apiCall } from '../api/client';
import { captureError } from '../utils/errorReporting';
import type { UserRole, UserProfile, AppConfig, BatchData } from '../types';

/** Auth level determines what data is visible */
export type AuthLevel = 'full' | 'pin_limited';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  email: string | null;
  role: UserRole | null;
  profile: UserProfile | null;
  config: AppConfig | null;
  sessionToken: string | null;
  /** Auth level: 'full' for Google/magic link, 'pin_limited' for PIN */
  authLevel: AuthLevel;
}

interface AuthContextType extends AuthState {
  /** Login via Google Sign-In (email from Google OAuth) */
  loginWithGoogle: (email: string, name?: string) => Promise<boolean>;
  /** Login via magic link callback token */
  loginWithToken: (token: string) => Promise<boolean>;
  /** Login via PIN (limited access) */
  loginWithPin: (pin: string) => Promise<boolean>;
  /** Login via Face ID / Touch ID / Fingerprint */
  loginWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  /** Request magic link email */
  requestMagicLink: (email: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  /** Logout and clear session */
  logout: () => Promise<void>;
  /** Refresh user data from backend */
  refreshData: () => Promise<BatchData | null>;
  /** Full batch data from last fetch */
  batchData: BatchData | null;
  /** Check if a field is visible given current auth level */
  isFieldVisible: (field: string) => boolean;
  /** Biometric capability info for the current device */
  biometricCapability: BiometricCapability | null;
  /** Whether biometric login is enrolled for this user */
  biometricEnabled: boolean;
  /** Enable biometric login for the current session */
  enableBiometrics: () => Promise<boolean>;
  /** Disable biometric login */
  disableBiometrics: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Fields hidden in PIN-limited mode */
const PIN_HIDDEN_FIELDS = new Set([
  'email', 'phone', 'address', 'street', 'city', 'state', 'zip',
  'assignedSteward', 'supervisor', 'employeeId', 'cubicle',
  'messages', 'notifications', 'contactLog', 'grievanceDetails',
  'grievanceNotes', 'driveFolderUrl', 'stewardContact',
]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    email: null,
    role: null,
    profile: null,
    config: null,
    sessionToken: null,
    authLevel: 'full',
  });
  const [batchData, setBatchData] = useState<BatchData | null>(null);
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    initBiometrics();
    checkExistingSession();
  }, []);

  async function initBiometrics() {
    const capability = await checkBiometricCapability();
    setBiometricCapability(capability);
    const enabled = await isBiometricLoginEnabled();
    setBiometricEnabled(enabled);
  }

  async function checkExistingSession() {
    try {
      const valid = await hasValidSession();
      if (!valid) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const token = await getSessionToken();
      const email = await getSessionEmail();
      const role = await getSessionRole();

      if (token && email) {
        const result = await api.validateSession(token);
        if (result.success && result.data?.valid) {
          setState({
            isLoading: false,
            isAuthenticated: true,
            email,
            role: (role as UserRole) || 'member',
            profile: null,
            config: null,
            sessionToken: token,
            authLevel: 'full',
          });
          loadBatchData();
        } else {
          await clearSession();
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }

  async function loadBatchData(): Promise<BatchData | null> {
    try {
      const result = await api.getBatchData();
      if (result.success && result.data) {
        const data = result.data;
        setBatchData(data);
        setState(prev => ({
          ...prev,
          profile: data.user || prev.profile,
          config: data.config || prev.config,
          role: data.role || prev.role,
        }));
        return data;
      }
    } catch (err) {
      captureError(err instanceof Error ? err : new Error(String(err)), { context: 'loadBatchData' });
    }
    return null;
  }

  // ── Google Sign-In ────────────────────────────────────────────────────

  const loginWithGoogle = useCallback(async (email: string, _name?: string): Promise<boolean> => {
    try {
      // Validate email in Member Directory and get session token
      const result = await apiCall<{
        valid: boolean;
        email: string;
        role: string;
        sessionToken: string;
      }>({
        action: 'validateGoogleLogin',
        params: { email },
        skipAuth: true,
      });

      if (result.success && result.data?.valid && result.data.sessionToken) {
        const { role, sessionToken } = result.data;
        await saveSession(sessionToken, email, role);
        setState({
          isLoading: false,
          isAuthenticated: true,
          email,
          role: role as UserRole,
          profile: null,
          config: null,
          sessionToken,
          authLevel: 'full',
        });
        loadBatchData();
        return true;
      }
    } catch (err) {
      captureError(err instanceof Error ? err : new Error(String(err)), { context: 'loginWithGoogle' });
    }
    return false;
  }, []);

  // ── Magic Link Token Login ────────────────────────────────────────────

  const loginWithToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const result = await api.validateSession(token);
      if (result.success && result.data?.valid) {
        const { email, role } = result.data;
        await saveSession(token, email, role);
        setState({
          isLoading: false,
          isAuthenticated: true,
          email,
          role: role as UserRole,
          profile: null,
          config: null,
          sessionToken: token,
          authLevel: 'full',
        });
        loadBatchData();
        return true;
      }
    } catch (err) {
      captureError(err instanceof Error ? err : new Error(String(err)), { context: 'loginWithToken' });
    }
    return false;
  }, []);

  // ── PIN Login (Limited) ───────────────────────────────────────────────

  const loginWithPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const result = await authenticateWithPin(pin);
      if (result.success && result.email && result.sessionToken) {
        await saveSession(result.sessionToken, result.email, 'member');
        setState({
          isLoading: false,
          isAuthenticated: true,
          email: result.email,
          role: 'member',
          profile: null,
          config: null,
          sessionToken: result.sessionToken,
          authLevel: 'pin_limited', // Limited access
        });
        // Load batch data but will be filtered by auth level
        loadBatchData();
        return true;
      }
    } catch (err) {
      captureError(err instanceof Error ? err : new Error(String(err)), { context: 'loginWithPin' });
    }
    return false;
  }, []);

  // ── Biometric Login (Face ID / Touch ID / Fingerprint) ──────────────

  const loginWithBiometrics = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    // Check if biometric login is enrolled
    const enabled = await isBiometricLoginEnabled();
    if (!enabled) {
      return { success: false, error: 'Biometric login is not enabled. Please sign in and enable it in Settings.' };
    }

    // Prompt for biometric auth
    const authResult = await authenticateWithBiometrics();
    if (!authResult.success) {
      return authResult;
    }

    // Retrieve stored credentials
    const creds = await getBiometricCredentials();
    if (!creds) {
      await disableBiometricLogin();
      setBiometricEnabled(false);
      return { success: false, error: 'Stored credentials not found. Please sign in again.' };
    }

    // Validate the stored session token with backend
    try {
      const result = await api.validateSession(creds.sessionToken);
      if (result.success && result.data?.valid) {
        await saveSession(creds.sessionToken, creds.email, creds.role);
        setState({
          isLoading: false,
          isAuthenticated: true,
          email: creds.email,
          role: creds.role as UserRole,
          profile: null,
          config: null,
          sessionToken: creds.sessionToken,
          authLevel: 'full',
        });
        loadBatchData();
        return { success: true };
      }

      // Token expired — clear biometric enrollment
      await disableBiometricLogin();
      setBiometricEnabled(false);
      return { success: false, error: 'Session expired. Please sign in again to re-enable biometric login.' };
    } catch {
      return { success: false, error: 'Could not verify session. Check your connection.' };
    }
  }, []);

  // ── Enable / Disable Biometrics ─────────────────────────────────────

  const enableBiometrics = useCallback(async (): Promise<boolean> => {
    if (!state.sessionToken || !state.email || !state.role) {
      return false;
    }
    const ok = await enableBiometricLogin(state.sessionToken, state.email, state.role);
    if (ok) setBiometricEnabled(true);
    return ok;
  }, [state.sessionToken, state.email, state.role]);

  const disableBiometrics = useCallback(async (): Promise<void> => {
    await disableBiometricLogin();
    setBiometricEnabled(false);
  }, []);

  // ── Magic Link Request ────────────────────────────────────────────────

  const requestMagicLink = useCallback(async (email: string, rememberMe = true) => {
    const result = await api.sendMagicLink(email, rememberMe);
    return {
      success: result.success,
      message: result.data?.message || result.message || 'Check your email for a sign-in link.',
    };
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    await clearSession();
    // Note: we keep biometric enrollment on logout so user can
    // re-authenticate quickly. Only disableBiometrics() clears it.
    setBatchData(null);
    setState({
      isLoading: false,
      isAuthenticated: false,
      email: null,
      role: null,
      profile: null,
      config: null,
      sessionToken: null,
      authLevel: 'full',
    });
  }, []);

  // ── Refresh ───────────────────────────────────────────────────────────

  const refreshData = useCallback(async () => {
    return loadBatchData();
  }, []);

  // ── Field Visibility ──────────────────────────────────────────────────

  const isFieldVisible = useCallback((field: string): boolean => {
    if (state.authLevel === 'full') return true;
    return !PIN_HIDDEN_FIELDS.has(field);
  }, [state.authLevel]);

  // When session token changes and biometrics are enabled, update stored token
  useEffect(() => {
    if (state.sessionToken && biometricEnabled) {
      updateBiometricSession(state.sessionToken);
    }
  }, [state.sessionToken, biometricEnabled]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        batchData,
        loginWithGoogle,
        loginWithToken,
        loginWithPin,
        loginWithBiometrics,
        requestMagicLink,
        logout,
        refreshData,
        isFieldVisible,
        biometricCapability,
        biometricEnabled,
        enableBiometrics,
        disableBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

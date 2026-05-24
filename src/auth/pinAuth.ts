// ============================================================================
// PIN Authentication - Limited member-only access
// ============================================================================
//
// PIN login provides a quick-access path for members who may not have
// Google accounts or prefer a simpler login. Uses the existing PIN
// auth system in the GAS backend (13_MemberSelfService.gs).
//
// IMPORTANT: PIN login provides LIMITED access:
// - Member dashboard (aggregate stats only)
// - No messages or contact info visible
// - No grievance details (just that one exists)
// - No PII of any kind

import { apiCall } from '../api/client';

/** Auth level returned by PIN login */
export type PinAuthLevel = 'pin_limited';

/** Result from PIN authentication */
export interface PinAuthResult {
  success: boolean;
  email?: string;
  sessionToken?: string;
  authLevel: PinAuthLevel;
  message?: string;
}

/**
 * Authenticate via PIN code.
 * Calls the existing GAS PIN verification endpoint.
 *
 * @param pin - The member's PIN (typically 4-6 digits)
 * @returns Auth result with limited session token
 */
export async function authenticateWithPin(pin: string): Promise<PinAuthResult> {
  const result = await apiCall<{
    success: boolean;
    email?: string;
    sessionToken?: string;
    message?: string;
  }>({
    action: 'validatePinLogin',
    params: { pin },
    skipAuth: true,
  });

  if (result.success && result.data?.success) {
    return {
      success: true,
      email: result.data.email,
      sessionToken: result.data.sessionToken,
      authLevel: 'pin_limited',
    };
  }

  return {
    success: false,
    authLevel: 'pin_limited',
    message: result.data?.message || result.message || 'Invalid PIN.',
  };
}


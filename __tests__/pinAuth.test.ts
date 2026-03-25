// Tests for PIN auth field visibility

import { isFieldVisibleForPinAuth, PIN_RESTRICTED_FIELDS } from '../src/auth/pinAuth';

// Mock the api client since pinAuth imports it
jest.mock('../src/api/client', () => ({
  apiCall: jest.fn(),
}));

describe('PIN Auth field visibility', () => {
  it('hides restricted fields', () => {
    expect(isFieldVisibleForPinAuth('email')).toBe(false);
    expect(isFieldVisibleForPinAuth('phone')).toBe(false);
    expect(isFieldVisibleForPinAuth('address')).toBe(false);
    expect(isFieldVisibleForPinAuth('grievanceDetails')).toBe(false);
    expect(isFieldVisibleForPinAuth('messages')).toBe(false);
    expect(isFieldVisibleForPinAuth('driveFolderUrl')).toBe(false);
  });

  it('shows non-restricted fields', () => {
    expect(isFieldVisibleForPinAuth('name')).toBe(true);
    expect(isFieldVisibleForPinAuth('status')).toBe(true);
    expect(isFieldVisibleForPinAuth('department')).toBe(true);
    expect(isFieldVisibleForPinAuth('duesStatus')).toBe(true);
  });

  it('has expected number of restricted fields', () => {
    expect(PIN_RESTRICTED_FIELDS.length).toBe(17);
  });
});

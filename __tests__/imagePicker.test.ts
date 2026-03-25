// Tests for image picker utility

import { formatFileSize } from '../src/utils/imagePicker';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

describe('formatFileSize', () => {
  it('handles undefined', () => {
    expect(formatFileSize(undefined)).toBe('Unknown size');
  });

  it('formats bytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
  });

  it('handles zero', () => {
    expect(formatFileSize(0)).toBe('Unknown size');
  });
});

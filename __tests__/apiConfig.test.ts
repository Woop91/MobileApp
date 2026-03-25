// Tests for API configuration module

import { setApiBaseUrl, getApiBaseUrl } from '../src/api/config';

describe('API Config', () => {
  it('sets and gets base URL', () => {
    setApiBaseUrl('https://script.google.com/macros/s/TEST_ID/exec');
    expect(getApiBaseUrl()).toBe('https://script.google.com/macros/s/TEST_ID/exec');
  });

  it('strips trailing slashes from URL', () => {
    setApiBaseUrl('https://example.com/api///');
    expect(getApiBaseUrl()).toBe('https://example.com/api');
  });

  it('handles empty string', () => {
    setApiBaseUrl('');
    expect(getApiBaseUrl()).toBe('');
  });
});

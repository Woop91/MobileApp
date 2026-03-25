// ============================================================================
// Theme system tests
// ============================================================================

import { THEME_PRESETS, getThemeColors } from '../src/theme/colors';

describe('Theme Presets', () => {
  it('should have all required presets', () => {
    const expectedPresets = ['navy', 'ocean', 'forest', 'sunset', 'cool', 'warm', 'slate'];
    expectedPresets.forEach(preset => {
      expect(THEME_PRESETS).toHaveProperty(preset);
    });
  });

  it('should return valid light theme colors', () => {
    const colors = getThemeColors('navy', false);
    expect(colors.primary).toBeDefined();
    expect(colors.background).toBeDefined();
    expect(colors.text).toBeDefined();
    expect(colors.surface).toBeDefined();
    expect(colors.accent).toBeDefined();
    expect(colors.gradient).toBeDefined();
    expect(colors.headerGradientStart).toBeDefined();
    expect(colors.headerGradientEnd).toBeDefined();
  });

  it('should return valid dark theme colors', () => {
    const colors = getThemeColors('navy', true);
    expect(colors.background).toBe('#0f0f23');
    expect(colors.surface).toBe('#1a1a2e');
  });

  it('should have unique primary colors per preset', () => {
    const primaries = Object.keys(THEME_PRESETS).map(p => getThemeColors(p, false).primary);
    const unique = new Set(primaries);
    expect(unique.size).toBe(primaries.length);
  });

  it('each preset should have gradient tokens', () => {
    Object.keys(THEME_PRESETS).forEach(preset => {
      const colors = getThemeColors(preset, false);
      expect(colors.gradient).toBeTruthy();
      expect(colors.headerGradientStart).toBeTruthy();
      expect(colors.headerGradientEnd).toBeTruthy();
    });
  });
});

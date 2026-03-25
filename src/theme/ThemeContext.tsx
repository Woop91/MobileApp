// ============================================================================
// Theme Context - Dynamic theming for the mobile app
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, themePresets, type ThemeColors } from './colors';
import { spacing, typography, borderRadius } from './tokens';

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleDarkMode: () => void;
  setThemePreset: (key: string) => void;
  themeKey: string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [themeKey, setThemeKey] = useState('navy');

  const theme = useMemo<Theme>(() => {
    const baseColors = isDark ? { ...darkColors } : { ...lightColors };
    const preset = themePresets[themeKey];
    if (preset) {
      const overrides = isDark ? preset.dark : preset.light;
      Object.assign(baseColors, overrides);
    }
    return {
      colors: baseColors,
      spacing,
      typography,
      borderRadius,
      isDark,
    };
  }, [isDark, themeKey]);

  const toggleDarkMode = useCallback(() => setIsDark(prev => !prev), []);
  const setThemePreset = useCallback((key: string) => setThemeKey(key), []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleDarkMode, setThemePreset, themeKey }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

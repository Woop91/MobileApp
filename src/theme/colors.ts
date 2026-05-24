// ============================================================================
// Theme Colors - Vibrant, dynamic themes for the mobile app
// ============================================================================

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  gradient: [string, string];
  gradientAccent: [string, string];
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textOnPrimary: string;
  textOnAccent: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  cardBackground: string;
  inputBackground: string;
  tabBarBackground: string;
  tabBarBorder: string;
  statusOverdue: string;
  statusDueSoon: string;
  statusActive: string;
  statusResolved: string;
  badgeBg: string;
  badgeText: string;
  skeleton: string;
  shimmer: string;
  overlay: string;
  headerGradientStart: string;
  headerGradientEnd: string;
}

export const lightColors: ThemeColors = {
  primary: '#1a237e',
  primaryLight: '#534bae',
  primaryDark: '#000051',
  accent: '#ff6f00',
  accentLight: '#ffa040',
  gradient: ['#1a237e', '#283593'],
  gradientAccent: ['#ff6f00', '#ff8f00'],
  background: '#f8f9fc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textOnPrimary: '#ffffff',
  textOnAccent: '#ffffff',
  border: '#e5e7eb',
  error: '#dc2626',
  warning: '#f59e0b',
  success: '#10b981',
  info: '#3b82f6',
  cardBackground: '#ffffff',
  inputBackground: '#f3f4f6',
  tabBarBackground: '#ffffff',
  tabBarBorder: '#e5e7eb',
  statusOverdue: '#dc2626',
  statusDueSoon: '#f59e0b',
  statusActive: '#3b82f6',
  statusResolved: '#10b981',
  badgeBg: '#ef4444',
  badgeText: '#ffffff',
  skeleton: '#e5e7eb',
  shimmer: '#f3f4f6',
  overlay: 'rgba(0, 0, 0, 0.5)',
  headerGradientStart: '#1a237e',
  headerGradientEnd: '#3949ab',
};

export const darkColors: ThemeColors = {
  primary: '#818cf8',
  primaryLight: '#a5b4fc',
  primaryDark: '#4f46e5',
  accent: '#fbbf24',
  accentLight: '#fcd34d',
  gradient: ['#312e81', '#1e1b4b'],
  gradientAccent: ['#f59e0b', '#d97706'],
  background: '#0f0f23',
  surface: '#1a1a2e',
  surfaceElevated: '#252547',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textOnPrimary: '#ffffff',
  textOnAccent: '#1a1a2e',
  border: '#334155',
  error: '#f87171',
  warning: '#fbbf24',
  success: '#34d399',
  info: '#60a5fa',
  cardBackground: '#1a1a2e',
  inputBackground: '#252547',
  tabBarBackground: '#1a1a2e',
  tabBarBorder: '#334155',
  statusOverdue: '#f87171',
  statusDueSoon: '#fbbf24',
  statusActive: '#60a5fa',
  statusResolved: '#34d399',
  badgeBg: '#ef4444',
  badgeText: '#ffffff',
  skeleton: '#334155',
  shimmer: '#475569',
  overlay: 'rgba(0, 0, 0, 0.7)',
  headerGradientStart: '#312e81',
  headerGradientEnd: '#1e1b4b',
};

/** Named theme presets — each is a rich, distinct visual identity */
export const themePresets: Record<string, { light: Partial<ThemeColors>; dark: Partial<ThemeColors> }> = {
  default: { light: {}, dark: {} },
  navy: {
    light: {
      primary: '#1e3a8a', primaryLight: '#3b82f6', primaryDark: '#1e3a8a',
      accent: '#f97316', accentLight: '#fb923c',
      gradient: ['#1e3a8a', '#2563eb'], gradientAccent: ['#f97316', '#fb923c'],
      headerGradientStart: '#1e3a8a', headerGradientEnd: '#2563eb',
      statusActive: '#2563eb', info: '#2563eb',
    },
    dark: {
      primary: '#60a5fa', primaryLight: '#93c5fd', primaryDark: '#2563eb',
      accent: '#fbbf24', accentLight: '#fcd34d',
      gradient: ['#1e3a8a', '#1e40af'], gradientAccent: ['#f59e0b', '#d97706'],
      headerGradientStart: '#1e3a8a', headerGradientEnd: '#1e40af',
      statusActive: '#60a5fa', info: '#60a5fa',
    },
  },
  slate: {
    light: {
      primary: '#334155', primaryLight: '#64748b', primaryDark: '#1e293b',
      accent: '#f97316', accentLight: '#fdba74',
      gradient: ['#334155', '#475569'], gradientAccent: ['#f97316', '#fb923c'],
      headerGradientStart: '#334155', headerGradientEnd: '#475569',
      background: '#f8fafc', cardBackground: '#ffffff',
    },
    dark: {
      primary: '#94a3b8', primaryLight: '#cbd5e1', primaryDark: '#64748b',
      accent: '#fb923c', accentLight: '#fdba74',
      gradient: ['#1e293b', '#0f172a'], gradientAccent: ['#f97316', '#ea580c'],
      headerGradientStart: '#1e293b', headerGradientEnd: '#0f172a',
    },
  },
  ocean: {
    light: {
      primary: '#0284c7', primaryLight: '#38bdf8', primaryDark: '#0369a1',
      accent: '#14b8a6', accentLight: '#5eead4',
      gradient: ['#0369a1', '#0284c7'], gradientAccent: ['#0d9488', '#14b8a6'],
      headerGradientStart: '#0369a1', headerGradientEnd: '#0ea5e9',
      statusActive: '#0284c7', info: '#0284c7',
      success: '#0d9488',
    },
    dark: {
      primary: '#38bdf8', primaryLight: '#7dd3fc', primaryDark: '#0284c7',
      accent: '#2dd4bf', accentLight: '#5eead4',
      gradient: ['#0c4a6e', '#075985'], gradientAccent: ['#115e59', '#0d9488'],
      headerGradientStart: '#0c4a6e', headerGradientEnd: '#075985',
      statusActive: '#38bdf8', info: '#38bdf8',
      success: '#2dd4bf',
    },
  },
  forest: {
    light: {
      primary: '#15803d', primaryLight: '#4ade80', primaryDark: '#166534',
      accent: '#ea580c', accentLight: '#fb923c',
      gradient: ['#166534', '#15803d'], gradientAccent: ['#c2410c', '#ea580c'],
      headerGradientStart: '#166534', headerGradientEnd: '#16a34a',
      success: '#15803d', statusResolved: '#15803d',
    },
    dark: {
      primary: '#4ade80', primaryLight: '#86efac', primaryDark: '#22c55e',
      accent: '#fb923c', accentLight: '#fdba74',
      gradient: ['#14532d', '#166534'], gradientAccent: ['#ea580c', '#c2410c'],
      headerGradientStart: '#14532d', headerGradientEnd: '#166534',
      success: '#4ade80', statusResolved: '#4ade80',
    },
  },
  sunset: {
    light: {
      primary: '#dc2626', primaryLight: '#f87171', primaryDark: '#b91c1c',
      accent: '#f59e0b', accentLight: '#fbbf24',
      gradient: ['#b91c1c', '#dc2626'], gradientAccent: ['#d97706', '#f59e0b'],
      headerGradientStart: '#b91c1c', headerGradientEnd: '#ef4444',
      error: '#be123c', statusOverdue: '#be123c',
    },
    dark: {
      primary: '#fb7185', primaryLight: '#fda4af', primaryDark: '#f43f5e',
      accent: '#fbbf24', accentLight: '#fcd34d',
      gradient: ['#881337', '#9f1239'], gradientAccent: ['#b45309', '#d97706'],
      headerGradientStart: '#881337', headerGradientEnd: '#9f1239',
      error: '#fb7185', statusOverdue: '#fb7185',
    },
  },
  warm: {
    light: {
      primary: '#92400e', primaryLight: '#d97706', primaryDark: '#78350f',
      accent: '#dc2626', accentLight: '#f87171',
      gradient: ['#78350f', '#92400e'], gradientAccent: ['#b91c1c', '#dc2626'],
      headerGradientStart: '#78350f', headerGradientEnd: '#b45309',
      background: '#fefce8',
    },
    dark: {
      primary: '#fbbf24', primaryLight: '#fcd34d', primaryDark: '#f59e0b',
      accent: '#f87171', accentLight: '#fca5a5',
      gradient: ['#451a03', '#78350f'], gradientAccent: ['#991b1b', '#b91c1c'],
      headerGradientStart: '#451a03', headerGradientEnd: '#78350f',
    },
  },
  cool: {
    light: {
      primary: '#7c3aed', primaryLight: '#a78bfa', primaryDark: '#6d28d9',
      accent: '#06b6d4', accentLight: '#22d3ee',
      gradient: ['#6d28d9', '#7c3aed'], gradientAccent: ['#0891b2', '#06b6d4'],
      headerGradientStart: '#5b21b6', headerGradientEnd: '#7c3aed',
      statusActive: '#7c3aed', info: '#7c3aed',
    },
    dark: {
      primary: '#a78bfa', primaryLight: '#c4b5fd', primaryDark: '#7c3aed',
      accent: '#22d3ee', accentLight: '#67e8f9',
      gradient: ['#2e1065', '#4c1d95'], gradientAccent: ['#155e75', '#0891b2'],
      headerGradientStart: '#2e1065', headerGradientEnd: '#4c1d95',
      statusActive: '#a78bfa', info: '#a78bfa',
    },
  },
};

/** Resolve full theme colors for a named preset */
export function getThemeColors(preset: string, isDark: boolean): ThemeColors {
  const base = isDark ? { ...darkColors } : { ...lightColors };
  const overrides = themePresets[preset]?.[isDark ? 'dark' : 'light'] || {};
  return { ...base, ...overrides };
}

/** Preset names exported for external use */
export { themePresets as THEME_PRESETS };

/** Generate theme colors from an accent hue (0-360) */
export function colorsFromHue(hue: number, isDark: boolean): Partial<ThemeColors> {
  const s = isDark ? 70 : 60;
  const l = isDark ? 65 : 40;
  return {
    primary: `hsl(${hue}, ${s}%, ${l}%)`,
    primaryLight: `hsl(${hue}, ${s - 10}%, ${l + 20}%)`,
    primaryDark: `hsl(${hue}, ${s + 10}%, ${l - 15}%)`,
    accent: `hsl(${(hue + 180) % 360}, ${s}%, ${l}%)`,
    gradient: [`hsl(${hue}, ${s}%, ${l - 10}%)`, `hsl(${hue}, ${s}%, ${l + 5}%)`],
    headerGradientStart: `hsl(${hue}, ${s}%, ${l - 10}%)`,
    headerGradientEnd: `hsl(${hue}, ${s}%, ${l + 5}%)`,
  };
}

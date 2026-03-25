// ============================================================================
// GradientHeader - Linear gradient header using expo-linear-gradient
// ============================================================================

import React, { type ReactNode } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

interface GradientHeaderProps {
  children: ReactNode;
  style?: ViewStyle;
  colors?: [string, string];
  rounded?: boolean;
}

export function GradientHeader({ children, style, colors, rounded = true }: GradientHeaderProps) {
  const { theme } = useTheme();
  const gradientColors = colors || [theme.colors.headerGradientStart, theme.colors.headerGradientEnd];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.header,
        rounded && styles.rounded,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  rounded: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
});

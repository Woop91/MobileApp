// ============================================================================
// Badge Component - Animated notification count badges with pulse
// ============================================================================

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme, usePulse, useScaleIn } from '../theme';

interface BadgeProps {
  count: number;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function Badge({ count, size = 'md', pulse = true }: BadgeProps) {
  const { theme } = useTheme();
  const pulseStyle = usePulse(pulse && count > 0, 0.95, 1.05);
  const scaleStyle = useScaleIn(0);

  if (count <= 0) return null;

  const dim = size === 'sm' ? 18 : 24;
  const fontSize = size === 'sm' ? 10 : 12;
  const display = count > 99 ? '99+' : String(count);

  return (
    <Animated.View style={[scaleStyle, pulseStyle]}>
      <Animated.View
        style={[
          styles.badge,
          {
            backgroundColor: theme.colors.badgeBg,
            minWidth: dim,
            height: dim,
            borderRadius: dim / 2,
            shadowColor: theme.colors.badgeBg,
          },
        ]}
      >
        <Text style={[styles.text, { color: theme.colors.badgeText, fontSize }]}>
          {display}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

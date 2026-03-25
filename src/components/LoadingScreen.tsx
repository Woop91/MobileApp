// ============================================================================
// LoadingScreen - Animated full-screen loading indicator
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, usePulse, useFadeIn, useRotate } from '../theme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const { theme } = useTheme();
  const pulseStyle = usePulse(true, 0.85, 1.15);
  const fadeStyle = useFadeIn(200, 500);
  const rotateStyle = useRotate(true);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.iconContainer, pulseStyle]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '12' }]}>
          <Animated.View style={rotateStyle}>
            <Ionicons name="shield-checkmark" size={48} color={theme.colors.primary} />
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.View style={fadeStyle}>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
      </Animated.View>
      <Animated.View style={[styles.dotsRow, fadeStyle]}>
        <LoadingDot color={theme.colors.primary} delay={0} />
        <LoadingDot color={theme.colors.primary} delay={150} />
        <LoadingDot color={theme.colors.primary} delay={300} />
      </Animated.View>
    </View>
  );
}

function LoadingDot({ color, delay }: { color: string; delay: number }) {
  const pulseStyle = usePulse(true, 0.3, 1);

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        pulseStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  iconContainer: {
    marginBottom: 8,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

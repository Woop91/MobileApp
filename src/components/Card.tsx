// ============================================================================
// Card Component - Animated card with shadow, press feedback, and theming
// ============================================================================

import React, { type ReactNode } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme, usePressAnimation } from '../theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  animated?: boolean;
  delay?: number;
  onPress?: () => void;
}

export function Card({ children, style, elevated = false, animated = false, delay = 0, onPress }: CardProps) {
  const { theme } = useTheme();
  const press = usePressAnimation();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.cardBackground,
      borderColor: theme.colors.border,
      shadowColor: theme.isDark ? '#000' : '#64748b',
    },
    elevated && styles.elevated,
    style,
  ];

  if (onPress) {
    return (
      <Animated.View style={[press.animatedStyle]}>
        <Animated.View
          style={cardStyle}
          onTouchStart={press.onPressIn}
          onTouchEnd={() => { press.onPressOut(); onPress(); }}
          onTouchCancel={press.onPressOut}
        >
          {children}
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={cardStyle}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
});

// ============================================================================
// Button Component - Animated press feedback, multiple variants
// ============================================================================

import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme, usePressAnimation } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'text' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { theme } = useTheme();
  const { colors, borderRadius: br } = theme;
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();

  const bgColor = {
    primary: colors.primary,
    secondary: colors.surfaceElevated,
    outline: 'transparent',
    danger: colors.error,
    text: 'transparent',
    accent: colors.accent,
  }[variant];

  const txtColor = {
    primary: colors.textOnPrimary,
    secondary: colors.text,
    outline: colors.primary,
    danger: colors.textOnPrimary,
    text: colors.primary,
    accent: colors.textOnAccent,
  }[variant];

  const borderColor = variant === 'outline' ? colors.primary : 'transparent';

  const paddingVertical = { sm: 8, md: 14, lg: 18 }[size];
  const paddingHorizontal = { sm: 14, md: 24, lg: 32 }[size];
  const fontSize = { sm: 13, md: 16, lg: 18 }[size];

  return (
    <Animated.View style={[animatedStyle, fullWidth && styles.fullWidth]}>
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: bgColor,
            borderColor,
            borderWidth: variant === 'outline' ? 1.5 : 0,
            borderRadius: br.xl,
            paddingVertical,
            paddingHorizontal,
            opacity: disabled ? 0.5 : 1,
          },
          fullWidth && styles.fullWidth,
          style,
        ]}
        onTouchStart={disabled || loading ? undefined : onPressIn}
        onTouchEnd={disabled || loading ? undefined : () => { onPressOut(); onPress(); }}
        onTouchCancel={disabled || loading ? undefined : onPressOut}
      >
        {loading ? (
          <ActivityIndicator color={txtColor} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, { color: txtColor, fontSize }, textStyle]}>
              {title}
            </Text>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

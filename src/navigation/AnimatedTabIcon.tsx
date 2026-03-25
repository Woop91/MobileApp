// ============================================================================
// AnimatedTabIcon - Shared animated tab bar icon with bounce on select
// ============================================================================

import React from 'react';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedTabIconProps {
  name: string;
  color: string;
  size: number;
  focused: boolean;
}

export function AnimatedTabIcon({ name, color, size, focused }: AnimatedTabIconProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withTiming(1.25, { duration: 100 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={size} color={color} />
    </Animated.View>
  );
}

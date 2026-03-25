// ============================================================================
// Animation Utilities - Smooth, polished motion throughout the app
// ============================================================================
//
// Uses react-native-reanimated for 60fps native-driven animations.
// Provides reusable animated wrappers and timing presets.

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
  type SharedValue,
  type AnimatedStyleProp,
  runOnJS,
} from 'react-native-reanimated';
import { useEffect, useCallback } from 'react';
import type { ViewStyle } from 'react-native';

// ── Timing Presets ──────────────────────────────────────────────────────────

export const TIMING = {
  fast: { duration: 150, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
  normal: { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
  slow: { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
  bounce: { duration: 400, easing: Easing.bezier(0.34, 1.56, 0.64, 1) },
  decelerate: { duration: 350, easing: Easing.out(Easing.cubic) },
} as const;

export const SPRING = {
  gentle: { damping: 15, stiffness: 120, mass: 1 },
  snappy: { damping: 12, stiffness: 200, mass: 0.8 },
  bouncy: { damping: 8, stiffness: 180, mass: 0.7 },
  stiff: { damping: 20, stiffness: 300, mass: 1 },
} as const;

// ── Entrance Animations ─────────────────────────────────────────────────────

/**
 * Fade in from transparent. Great for content loading.
 */
export function useFadeIn(delay = 0, duration = 400) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return animatedStyle;
}

/**
 * Slide up and fade in — ideal for cards, list items, sections.
 */
export function useSlideUp(delay = 0, distance = 30) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withSpring(1, SPRING.gentle));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [distance, 0]) }],
  }));
  return animatedStyle;
}

/**
 * Scale up from small with fade — great for KPI cards, icons.
 */
export function useScaleIn(delay = 0) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withSpring(1, SPRING.bouncy));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.8, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.7, 1]) }],
  }));
  return animatedStyle;
}

/**
 * Staggered entrance for lists — each item delays a bit more.
 */
export function useStaggerItem(index: number, baseDelay = 50) {
  return useSlideUp(index * baseDelay, 24);
}

// ── Interactive Animations ──────────────────────────────────────────────────

/**
 * Press scale effect — shrink slightly on press, spring back.
 */
export function usePressAnimation() {
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.95, SPRING.stiff);
  }, []);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING.snappy);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}

/**
 * Pulse animation for attention — badges, alerts.
 */
export function usePulse(active = true, minScale = 0.92, maxScale = 1.08) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(maxScale, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(minScale, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, TIMING.fast);
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return animatedStyle;
}

/**
 * Shimmer effect for skeleton loading.
 */
export function useShimmer() {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-1, 0, 1], [0.4, 1, 0.4]),
  }));
  return animatedStyle;
}

/**
 * Count-up animation for numbers (KPI values).
 * Returns a shared value that animates from 0 to targetValue.
 */
export function useCountUp(targetValue: number, duration = 800, delay = 200) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withDelay(
      delay,
      withTiming(targetValue, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, [targetValue]);

  return animatedValue;
}

/**
 * Rotate animation — for loading spinners, refresh icons.
 */
export function useRotate(active = true) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (active) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, TIMING.fast);
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return animatedStyle;
}

/**
 * Slide in from left — for page transitions.
 */
export function useSlideInLeft(delay = 0, distance = 40) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withSpring(1, SPRING.gentle));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-distance, 0]) }],
  }));
  return animatedStyle;
}

/**
 * Animated height expand/collapse.
 */
export function useExpandCollapse(expanded: boolean, maxHeight: number) {
  const height = useSharedValue(expanded ? maxHeight : 0);
  const opacity = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    height.value = withSpring(expanded ? maxHeight : 0, SPRING.gentle);
    opacity.value = withTiming(expanded ? 1 : 0, TIMING.normal);
  }, [expanded, maxHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: 'hidden' as const,
  }));
  return animatedStyle;
}

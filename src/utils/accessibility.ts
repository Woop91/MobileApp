// ============================================================================
// Accessibility - Labels, dynamic font scaling, screen reader support
// ============================================================================

import { AccessibilityInfo, Platform, PixelRatio } from 'react-native';
import { useEffect, useState } from 'react';

/** Hook to detect if screen reader is active */
export function useScreenReader(): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setActive);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setActive);
    return () => sub.remove();
  }, []);

  return active;
}

/** Hook to detect if reduce motion is enabled */
export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);

  return reduced;
}

/** Hook to detect if bold text is enabled (iOS) */
export function useBoldText(): boolean {
  const [bold, setBold] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.isBoldTextEnabled().then(setBold);
      const sub = AccessibilityInfo.addEventListener('boldTextChanged', setBold);
      return () => sub.remove();
    }
  }, []);

  return bold;
}

/**
 * Scale a font size based on device accessibility settings.
 * Caps at maxScale to prevent layout breakage.
 */
export function scaledFontSize(baseFontSize: number, maxScale = 1.5): number {
  const fontScale = PixelRatio.getFontScale();
  const scaled = baseFontSize * Math.min(fontScale, maxScale);
  return Math.round(scaled);
}

/**
 * Build accessibility props for an interactive element.
 */
export function a11yButton(label: string, hint?: string) {
  return {
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

/**
 * Build accessibility props for a header/heading.
 */
export function a11yHeader(label: string) {
  return {
    accessible: true,
    accessibilityRole: 'header' as const,
    accessibilityLabel: label,
  };
}

/**
 * Build accessibility props for an image.
 */
export function a11yImage(label: string) {
  return {
    accessible: true,
    accessibilityRole: 'image' as const,
    accessibilityLabel: label,
  };
}

/**
 * Build accessibility props for a status/badge.
 */
export function a11yStatus(label: string) {
  return {
    accessible: true,
    accessibilityRole: 'text' as const,
    accessibilityLabel: label,
    accessibilityLiveRegion: 'polite' as const,
  };
}

/** Announce a message to screen readers */
export function announce(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}

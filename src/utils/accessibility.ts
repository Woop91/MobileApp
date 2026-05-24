// ============================================================================
// Accessibility - Labels for interactive elements
// ============================================================================

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

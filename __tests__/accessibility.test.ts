// ============================================================================
// Accessibility helpers tests
// ============================================================================

import { a11yButton } from '../src/utils/accessibility';

describe('Accessibility Helpers', () => {
  describe('a11yButton', () => {
    it('should return correct props for a button', () => {
      const props = a11yButton('Submit form');
      expect(props.accessible).toBe(true);
      expect(props.accessibilityRole).toBe('button');
      expect(props.accessibilityLabel).toBe('Submit form');
    });

    it('should include hint when provided', () => {
      const props = a11yButton('Save', 'Saves your changes');
      expect(props.accessibilityHint).toBe('Saves your changes');
    });
  });
});

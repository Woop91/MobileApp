// ============================================================================
// Accessibility helpers tests
// ============================================================================

import { a11yButton, a11yHeader, a11yImage, a11yStatus, scaledFontSize } from '../src/utils/accessibility';

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

  describe('a11yHeader', () => {
    it('should return header role props', () => {
      const props = a11yHeader('Page Title');
      expect(props.accessible).toBe(true);
      expect(props.accessibilityRole).toBe('header');
      expect(props.accessibilityLabel).toBe('Page Title');
    });
  });

  describe('a11yImage', () => {
    it('should return image role props', () => {
      const props = a11yImage('User avatar');
      expect(props.accessible).toBe(true);
      expect(props.accessibilityRole).toBe('image');
      expect(props.accessibilityLabel).toBe('User avatar');
    });
  });

  describe('a11yStatus', () => {
    it('should return text role with live region', () => {
      const props = a11yStatus('3 items loaded');
      expect(props.accessibilityRole).toBe('text');
      expect(props.accessibilityLiveRegion).toBe('polite');
      expect(props.accessibilityLabel).toBe('3 items loaded');
    });
  });

  describe('scaledFontSize', () => {
    it('should return scaled font size', () => {
      const size = scaledFontSize(16);
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);
    });

    it('should cap at maxScale', () => {
      const size = scaledFontSize(16, 1.0);
      expect(size).toBe(16);
    });
  });
});

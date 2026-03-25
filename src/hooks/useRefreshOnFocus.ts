// ============================================================================
// useRefreshOnFocus - Refresh data when screen comes into focus
// ============================================================================

import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Calls the provided callback when the screen comes into focus.
 * Skips the initial mount to avoid double-fetching.
 */
export function useRefreshOnFocus(callback: () => void) {
  const firstRender = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstRender.current) {
        firstRender.current = false;
        return;
      }
      callback();
    }, [callback])
  );
}

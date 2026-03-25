// ============================================================================
// App State Handler - Background/foreground refresh
// ============================================================================

import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Hook that calls a callback when the app comes back to the foreground.
 * Useful for refreshing data after the user switches away and back.
 */
export function useAppStateRefresh(onForeground: () => void) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      // Came back from background/inactive to active
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        onForeground();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [onForeground]);
}

/**
 * Hook that tracks how long the app was in background.
 * If longer than staleThresholdMs, calls onStale.
 */
export function useStaleCheck(
  onStale: () => void,
  staleThresholdMs: number = 5 * 60 * 1000 // 5 minutes
) {
  const backgroundTime = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
      } else if (nextState === 'active' && backgroundTime.current) {
        const elapsed = Date.now() - backgroundTime.current;
        backgroundTime.current = null;
        if (elapsed >= staleThresholdMs) {
          onStale();
        }
      }
    });

    return () => subscription.remove();
  }, [onStale, staleThresholdMs]);
}

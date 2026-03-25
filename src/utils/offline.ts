// ============================================================================
// Offline Support - Cache data locally for offline access
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'dds_cache_';
const CACHE_TTL_KEY = 'dds_cache_ttl_';
const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Cache data locally with TTL.
 * Uses AsyncStorage for persistence across app restarts.
 */
export async function cacheData(key: string, data: unknown, ttlMs: number = DEFAULT_TTL): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data)),
      AsyncStorage.setItem(CACHE_TTL_KEY + key, String(Date.now() + ttlMs)),
    ]);
  } catch {
    // Cache write failed silently
  }
}

/** Get cached data if still valid, or null */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const [data, ttl] = await Promise.all([
      AsyncStorage.getItem(CACHE_PREFIX + key),
      AsyncStorage.getItem(CACHE_TTL_KEY + key),
    ]);

    if (!data) return null;
    if (ttl && Date.now() > parseInt(ttl, 10)) {
      // Expired — remove
      await AsyncStorage.multiRemove([CACHE_PREFIX + key, CACHE_TTL_KEY + key]);
      return null;
    }
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/** Clear all cached data */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) || k.startsWith(CACHE_TTL_KEY));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
    // Clear failed silently
  }
}

/**
 * Stale-while-revalidate pattern.
 * Returns cached data immediately, then fetches fresh data in background.
 */
export async function staleWhileRevalidate<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL,
): Promise<{ data: T | null; isStale: boolean; refresh: Promise<T | null> }> {
  const cached = await getCachedData<T>(key);

  const refresh = (async () => {
    try {
      const fresh = await fetchFn();
      await cacheData(key, fresh, ttlMs);
      return fresh;
    } catch {
      return null;
    }
  })();

  if (cached) {
    return { data: cached, isStale: true, refresh };
  }

  const fresh = await refresh;
  return { data: fresh, isStale: false, refresh: Promise.resolve(fresh) };
}

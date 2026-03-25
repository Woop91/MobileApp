// ============================================================================
// Offline Queue - Queues form submissions when offline, replays when online
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiCall } from '../api/client';

const QUEUE_KEY = '@dds_offline_queue';

export interface QueuedAction {
  id: string;
  action: string;
  params: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

/** Add an action to the offline queue */
export async function enqueueAction(action: string, params: Record<string, unknown>): Promise<string> {
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const item: QueuedAction = { id, action, params, timestamp: Date.now(), retries: 0 };

  const queue = await getQueue();
  queue.push(item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return id;
}

/** Get all queued actions */
export async function getQueue(): Promise<QueuedAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Get count of pending actions */
export async function getQueueCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/** Remove a specific action from the queue */
async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter(item => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

/** Persist updated retry count for a queued item */
async function updateRetryCount(id: string, retries: number): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map(item => item.id === id ? { ...item, retries } : item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

/** Process all queued actions — call when coming back online */
export async function processQueue(): Promise<{ processed: number; failed: number }> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { processed: 0, failed: 0 };

  const queue = await getQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const result = await apiCall({
        action: item.action,
        params: item.params,
      });

      if (result.success) {
        await removeFromQueue(item.id);
        processed++;
      } else {
        item.retries++;
        if (item.retries >= 3) {
          await removeFromQueue(item.id);
          failed++;
        } else {
          await updateRetryCount(item.id, item.retries);
        }
      }
    } catch {
      item.retries++;
      if (item.retries >= 3) {
        await removeFromQueue(item.id);
        failed++;
      } else {
        await updateRetryCount(item.id, item.retries);
      }
    }
  }

  return { processed, failed };
}

/** Clear entire queue */
export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

/**
 * Smart submit — tries immediately, queues if offline.
 * Returns { submitted: true } if sent, { queued: true, id } if queued.
 */
export async function smartSubmit(
  action: string,
  params: Record<string, unknown>
): Promise<{ submitted: boolean; queued: boolean; id?: string; data?: unknown }> {
  const state = await NetInfo.fetch();

  if (state.isConnected) {
    try {
      const result = await apiCall({ action, params });
      if (result.success) {
        return { submitted: true, queued: false, data: result.data };
      }
    } catch {
      // API call failed — fall through to queue the action offline
    }
  }

  // Offline or failed — queue it
  const id = await enqueueAction(action, params);
  return { submitted: false, queued: true, id };
}

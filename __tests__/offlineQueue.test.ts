// ============================================================================
// Offline queue tests
// ============================================================================

// Mock AsyncStorage
const mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore[key] || null)),
  setItem: jest.fn((key: string, value: string) => { mockStore[key] = value; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete mockStore[key]; return Promise.resolve(); }),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

import { enqueueAction, getQueue, clearQueue } from '../src/utils/offlineQueue';

describe('Offline Queue', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach(k => delete mockStore[k]);
  });

  it('should enqueue an action', async () => {
    await enqueueAction('submitGrievance', { title: 'Test' });
    const queue = await getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].action).toBe('submitGrievance');
    expect(queue[0].params).toEqual({ title: 'Test' });
  });

  it('should enqueue multiple actions', async () => {
    await enqueueAction('action1', { a: 1 });
    await enqueueAction('action2', { b: 2 });
    const queue = await getQueue();
    expect(queue.length).toBe(2);
  });

  it('should clear the queue', async () => {
    await enqueueAction('action1', { a: 1 });
    await clearQueue();
    const queue = await getQueue();
    expect(queue.length).toBe(0);
  });

  it('should store timestamp with each action', async () => {
    await enqueueAction('testAction', {});
    const queue = await getQueue();
    expect(queue[0].timestamp).toBeDefined();
    expect(typeof queue[0].timestamp).toBe('number');
  });
});

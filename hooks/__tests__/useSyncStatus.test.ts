import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type ConflictItem,
  offlineDb,
  type OfflineSetting,
  type SyncQueueItem,
} from '~/lib/offline/db';
import useSyncStatus from '../useSyncStatus';

describe('useSyncStatus', () => {
  beforeEach(async () => {
    await offlineDb.delete();
    await offlineDb.open();
  });

  afterEach(() => {
    offlineDb.close();
  });

  it('should return zero counts when database is empty', async () => {
    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.pendingSyncs).toBe(0);
      expect(result.current.conflicts).toBe(0);
      expect(result.current.isInitialized).toBe(false);
    });
  });

  it('should return correct pendingSyncs count from syncQueue', async () => {
    const queueItems: SyncQueueItem[] = [
      {
        interviewId: 'interview-1',
        operation: 'create',
        createdAt: Date.now(),
        payload: JSON.stringify({}),
      },
      {
        interviewId: 'interview-2',
        operation: 'update',
        createdAt: Date.now(),
        payload: JSON.stringify({}),
      },
      {
        interviewId: 'interview-3',
        operation: 'delete',
        createdAt: Date.now(),
        payload: JSON.stringify({}),
      },
    ];

    await offlineDb.syncQueue.bulkAdd(queueItems);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.pendingSyncs).toBe(3);
    });
  });

  it('should return correct conflicts count with only unresolved conflicts', async () => {
    const conflicts: ConflictItem[] = [
      {
        interviewId: 'interview-1',
        detectedAt: Date.now(),
        resolvedAt: null,
        localData: JSON.stringify({}),
        serverData: JSON.stringify({}),
      },
      {
        interviewId: 'interview-2',
        detectedAt: Date.now(),
        resolvedAt: Date.now() + 1000,
        localData: JSON.stringify({}),
        serverData: JSON.stringify({}),
      },
      {
        interviewId: 'interview-3',
        detectedAt: Date.now(),
        resolvedAt: null,
        localData: JSON.stringify({}),
        serverData: JSON.stringify({}),
      },
    ];

    await offlineDb.conflicts.bulkAdd(conflicts);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.conflicts).toBe(2);
    });
  });

  it('should not count resolved conflicts', async () => {
    const conflicts: ConflictItem[] = [
      {
        interviewId: 'interview-1',
        detectedAt: Date.now(),
        resolvedAt: Date.now() + 1000,
        localData: JSON.stringify({}),
        serverData: JSON.stringify({}),
      },
      {
        interviewId: 'interview-2',
        detectedAt: Date.now(),
        resolvedAt: Date.now() + 2000,
        localData: JSON.stringify({}),
        serverData: JSON.stringify({}),
      },
    ];

    await offlineDb.conflicts.bulkAdd(conflicts);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.conflicts).toBe(0);
    });
  });

  it('should return isInitialized true when setting is true', async () => {
    const setting: OfflineSetting = {
      key: 'initialized',
      value: 'true',
    };

    await offlineDb.settings.put(setting);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
  });

  it('should return isInitialized false when setting is false', async () => {
    const setting: OfflineSetting = {
      key: 'initialized',
      value: 'false',
    };

    await offlineDb.settings.put(setting);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(false);
    });
  });

  it('should return isInitialized false when setting does not exist', async () => {
    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(false);
    });
  });

  it('should update pendingSyncs when syncQueue changes', async () => {
    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.pendingSyncs).toBe(0);
    });

    const queueItem: SyncQueueItem = {
      interviewId: 'interview-1',
      operation: 'create',
      createdAt: Date.now(),
      payload: JSON.stringify({}),
    };

    await offlineDb.syncQueue.add(queueItem);

    await waitFor(() => {
      expect(result.current.pendingSyncs).toBe(1);
    });

    await offlineDb.syncQueue.add({
      interviewId: 'interview-2',
      operation: 'update',
      createdAt: Date.now(),
      payload: JSON.stringify({}),
    });

    await waitFor(() => {
      expect(result.current.pendingSyncs).toBe(2);
    });
  });

  it('should update conflicts when conflicts table changes', async () => {
    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.conflicts).toBe(0);
    });

    const conflict: ConflictItem = {
      interviewId: 'interview-1',
      detectedAt: Date.now(),
      resolvedAt: null,
      localData: JSON.stringify({}),
      serverData: JSON.stringify({}),
    };

    await offlineDb.conflicts.add(conflict);

    await waitFor(() => {
      expect(result.current.conflicts).toBe(1);
    });

    await offlineDb.conflicts.add({
      interviewId: 'interview-2',
      detectedAt: Date.now(),
      resolvedAt: null,
      localData: JSON.stringify({}),
      serverData: JSON.stringify({}),
    });

    await waitFor(() => {
      expect(result.current.conflicts).toBe(2);
    });
  });

  it('should update conflicts count when conflict is resolved', async () => {
    const conflict: ConflictItem = {
      interviewId: 'interview-1',
      detectedAt: Date.now(),
      resolvedAt: null,
      localData: JSON.stringify({}),
      serverData: JSON.stringify({}),
    };

    const id = await offlineDb.conflicts.add(conflict);

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.conflicts).toBe(1);
    });

    await offlineDb.conflicts.update(id, { resolvedAt: Date.now() });

    await waitFor(() => {
      expect(result.current.conflicts).toBe(0);
    });
  });

  it('should update isInitialized when setting changes', async () => {
    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(false);
    });

    await offlineDb.settings.put({
      key: 'initialized',
      value: 'true',
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await offlineDb.settings.put({
      key: 'initialized',
      value: 'false',
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(false);
    });
  });

  it('should handle all status updates simultaneously', async () => {
    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.pendingSyncs).toBe(0);
      expect(result.current.conflicts).toBe(0);
      expect(result.current.isInitialized).toBe(false);
    });

    await offlineDb.syncQueue.add({
      interviewId: 'interview-1',
      operation: 'create',
      createdAt: Date.now(),
      payload: JSON.stringify({}),
    });

    await offlineDb.conflicts.add({
      interviewId: 'interview-1',
      detectedAt: Date.now(),
      resolvedAt: null,
      localData: JSON.stringify({}),
      serverData: JSON.stringify({}),
    });

    await offlineDb.settings.put({
      key: 'initialized',
      value: 'true',
    });

    await waitFor(() => {
      expect(result.current.pendingSyncs).toBe(1);
      expect(result.current.conflicts).toBe(1);
      expect(result.current.isInitialized).toBe(true);
    });
  });

  it('should use default values while queries are loading', () => {
    const { result } = renderHook(() => useSyncStatus());

    expect(result.current.pendingSyncs).toBe(0);
    expect(result.current.conflicts).toBe(0);
    expect(result.current.isInitialized).toBe(false);
  });
});

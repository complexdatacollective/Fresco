import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type CachedAsset,
  type CachedProtocol,
  type ConflictItem,
  type OfflineInterview,
  type OfflineSetting,
  offlineDb,
  type SyncQueueItem,
} from '../db';

describe('OfflineDatabase', () => {
  beforeEach(async () => {
    await offlineDb.delete();
    await offlineDb.open();
  });

  afterEach(() => {
    offlineDb.close();
  });

  describe('initialization', () => {
    it('should create database with correct name', () => {
      expect(offlineDb.name).toBe('FrescoOfflineDB');
    });

    it('should create all required tables', () => {
      expect(offlineDb.interviews).toBeDefined();
      expect(offlineDb.protocols).toBeDefined();
      expect(offlineDb.assets).toBeDefined();
      expect(offlineDb.syncQueue).toBeDefined();
      expect(offlineDb.conflicts).toBeDefined();
      expect(offlineDb.settings).toBeDefined();
    });

    it('should have correct version', () => {
      expect(offlineDb.verno).toBe(2);
    });
  });

  describe('interviews store', () => {
    it('should add and retrieve an interview', async () => {
      const interview: OfflineInterview = {
        id: 'interview-1',
        protocolId: 'protocol-1',
        syncStatus: 'pending',
        lastUpdated: Date.now(),
        isOfflineCreated: true,
        data: JSON.stringify({ nodes: [], edges: [] }),
      };

      await offlineDb.interviews.add(interview);
      const retrieved = await offlineDb.interviews.get('interview-1');

      expect(retrieved).toEqual(interview);
    });

    it('should update an existing interview', async () => {
      const interview: OfflineInterview = {
        id: 'interview-1',
        protocolId: 'protocol-1',
        syncStatus: 'pending',
        lastUpdated: Date.now(),
        isOfflineCreated: true,
        data: JSON.stringify({ nodes: [], edges: [] }),
      };

      await offlineDb.interviews.add(interview);
      await offlineDb.interviews.update('interview-1', {
        syncStatus: 'synced',
      });

      const updated = await offlineDb.interviews.get('interview-1');
      expect(updated?.syncStatus).toBe('synced');
    });

    it('should delete an interview', async () => {
      const interview: OfflineInterview = {
        id: 'interview-1',
        protocolId: 'protocol-1',
        syncStatus: 'pending',
        lastUpdated: Date.now(),
        isOfflineCreated: true,
        data: JSON.stringify({ nodes: [], edges: [] }),
      };

      await offlineDb.interviews.add(interview);
      await offlineDb.interviews.delete('interview-1');

      const retrieved = await offlineDb.interviews.get('interview-1');
      expect(retrieved).toBeUndefined();
    });

    it('should query interviews by protocolId index', async () => {
      const interviews: OfflineInterview[] = [
        {
          id: 'interview-1',
          protocolId: 'protocol-1',
          syncStatus: 'synced',
          lastUpdated: Date.now(),
          isOfflineCreated: false,
          data: JSON.stringify({}),
        },
        {
          id: 'interview-2',
          protocolId: 'protocol-1',
          syncStatus: 'pending',
          lastUpdated: Date.now(),
          isOfflineCreated: true,
          data: JSON.stringify({}),
        },
        {
          id: 'interview-3',
          protocolId: 'protocol-2',
          syncStatus: 'synced',
          lastUpdated: Date.now(),
          isOfflineCreated: false,
          data: JSON.stringify({}),
        },
      ];

      await offlineDb.interviews.bulkAdd(interviews);

      const protocol1Interviews = await offlineDb.interviews
        .where('protocolId')
        .equals('protocol-1')
        .toArray();

      expect(protocol1Interviews).toHaveLength(2);
      expect(
        protocol1Interviews.every((i) => i.protocolId === 'protocol-1'),
      ).toBe(true);
    });

    it('should query interviews by syncStatus index', async () => {
      const interviews: OfflineInterview[] = [
        {
          id: 'interview-1',
          protocolId: 'protocol-1',
          syncStatus: 'pending',
          lastUpdated: Date.now(),
          isOfflineCreated: false,
          data: JSON.stringify({}),
        },
        {
          id: 'interview-2',
          protocolId: 'protocol-1',
          syncStatus: 'pending',
          lastUpdated: Date.now(),
          isOfflineCreated: true,
          data: JSON.stringify({}),
        },
        {
          id: 'interview-3',
          protocolId: 'protocol-2',
          syncStatus: 'synced',
          lastUpdated: Date.now(),
          isOfflineCreated: false,
          data: JSON.stringify({}),
        },
      ];

      await offlineDb.interviews.bulkAdd(interviews);

      const pendingInterviews = await offlineDb.interviews
        .where('syncStatus')
        .equals('pending')
        .toArray();

      expect(pendingInterviews).toHaveLength(2);
      expect(pendingInterviews.every((i) => i.syncStatus === 'pending')).toBe(
        true,
      );
    });
  });

  describe('protocols store', () => {
    it('should add and retrieve a protocol', async () => {
      const protocol: CachedProtocol = {
        id: 'protocol-1',
        name: 'Test Protocol',
        cachedAt: Date.now(),
        data: JSON.stringify({ stages: [] }),
      };

      await offlineDb.protocols.add(protocol);
      const retrieved = await offlineDb.protocols.get('protocol-1');

      expect(retrieved).toEqual(protocol);
    });

    it('should update an existing protocol', async () => {
      const protocol: CachedProtocol = {
        id: 'protocol-1',
        name: 'Test Protocol',
        cachedAt: Date.now(),
        data: JSON.stringify({ stages: [] }),
      };

      await offlineDb.protocols.add(protocol);
      const newCachedAt = Date.now() + 1000;
      await offlineDb.protocols.update('protocol-1', { cachedAt: newCachedAt });

      const updated = await offlineDb.protocols.get('protocol-1');
      expect(updated?.cachedAt).toBe(newCachedAt);
    });

    it('should delete a protocol', async () => {
      const protocol: CachedProtocol = {
        id: 'protocol-1',
        name: 'Test Protocol',
        cachedAt: Date.now(),
        data: JSON.stringify({ stages: [] }),
      };

      await offlineDb.protocols.add(protocol);
      await offlineDb.protocols.delete('protocol-1');

      const retrieved = await offlineDb.protocols.get('protocol-1');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('assets store', () => {
    it('should add and retrieve an asset', async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const asset: CachedAsset = {
        key: 'protocol-1/asset-1',
        assetId: 'asset-1',
        protocolId: 'protocol-1',
        cachedAt: Date.now(),
        blob,
      };

      await offlineDb.assets.add(asset);
      const retrieved = await offlineDb.assets.get('protocol-1/asset-1');

      expect(retrieved?.key).toBe(asset.key);
      expect(retrieved?.assetId).toBe(asset.assetId);
      expect(retrieved?.protocolId).toBe(asset.protocolId);
    });

    it('should query assets by protocolId index', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const assets: CachedAsset[] = [
        {
          key: 'protocol-1/asset-1',
          assetId: 'asset-1',
          protocolId: 'protocol-1',
          cachedAt: Date.now(),
          blob,
        },
        {
          key: 'protocol-1/asset-2',
          assetId: 'asset-2',
          protocolId: 'protocol-1',
          cachedAt: Date.now(),
          blob,
        },
        {
          key: 'protocol-2/asset-1',
          assetId: 'asset-1',
          protocolId: 'protocol-2',
          cachedAt: Date.now(),
          blob,
        },
      ];

      await offlineDb.assets.bulkAdd(assets);

      const protocol1Assets = await offlineDb.assets
        .where('protocolId')
        .equals('protocol-1')
        .toArray();

      expect(protocol1Assets).toHaveLength(2);
      expect(protocol1Assets.every((a) => a.protocolId === 'protocol-1')).toBe(
        true,
      );
    });

    it('should delete an asset', async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const asset: CachedAsset = {
        key: 'protocol-1/asset-1',
        assetId: 'asset-1',
        protocolId: 'protocol-1',
        cachedAt: Date.now(),
        blob,
      };

      await offlineDb.assets.add(asset);
      await offlineDb.assets.delete('protocol-1/asset-1');

      const retrieved = await offlineDb.assets.get('protocol-1/asset-1');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('syncQueue store', () => {
    it('should add and retrieve a sync queue item', async () => {
      const queueItem: SyncQueueItem = {
        interviewId: 'interview-1',
        operation: 'create',
        createdAt: Date.now(),
        payload: JSON.stringify({ data: 'test' }),
      };

      const id = await offlineDb.syncQueue.add(queueItem);
      const retrieved = await offlineDb.syncQueue.get(id);

      expect(retrieved?.interviewId).toBe(queueItem.interviewId);
      expect(retrieved?.operation).toBe(queueItem.operation);
    });

    it('should auto-increment id for sync queue items', async () => {
      const queueItem1: SyncQueueItem = {
        interviewId: 'interview-1',
        operation: 'create',
        createdAt: Date.now(),
        payload: JSON.stringify({}),
      };

      const queueItem2: SyncQueueItem = {
        interviewId: 'interview-2',
        operation: 'update',
        createdAt: Date.now(),
        payload: JSON.stringify({}),
      };

      const id1 = await offlineDb.syncQueue.add(queueItem1);
      const id2 = await offlineDb.syncQueue.add(queueItem2);

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id2!).toBeGreaterThan(id1!);
    });

    it('should count sync queue items', async () => {
      const items: SyncQueueItem[] = [
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
      ];

      await offlineDb.syncQueue.bulkAdd(items);
      const count = await offlineDb.syncQueue.count();

      expect(count).toBe(2);
    });

    it('should delete a sync queue item', async () => {
      const queueItem: SyncQueueItem = {
        interviewId: 'interview-1',
        operation: 'create',
        createdAt: Date.now(),
        payload: JSON.stringify({}),
      };

      const id = await offlineDb.syncQueue.add(queueItem);
      await offlineDb.syncQueue.delete(id);

      const retrieved = await offlineDb.syncQueue.get(id);
      expect(retrieved).toBeUndefined();
    });

    it('should query sync queue items by interviewId index', async () => {
      const items: SyncQueueItem[] = [
        {
          interviewId: 'interview-1',
          operation: 'create',
          createdAt: Date.now(),
          payload: JSON.stringify({}),
        },
        {
          interviewId: 'interview-1',
          operation: 'update',
          createdAt: Date.now() + 1000,
          payload: JSON.stringify({}),
        },
        {
          interviewId: 'interview-2',
          operation: 'create',
          createdAt: Date.now(),
          payload: JSON.stringify({}),
        },
      ];

      await offlineDb.syncQueue.bulkAdd(items);

      const interview1Items = await offlineDb.syncQueue
        .where('interviewId')
        .equals('interview-1')
        .toArray();

      expect(interview1Items).toHaveLength(2);
      expect(
        interview1Items.every((i) => i.interviewId === 'interview-1'),
      ).toBe(true);
    });
  });

  describe('conflicts store', () => {
    it('should add and retrieve a conflict', async () => {
      const conflict: ConflictItem = {
        interviewId: 'interview-1',
        detectedAt: Date.now(),
        resolvedAt: null,
        localData: JSON.stringify({ version: 1 }),
        serverData: JSON.stringify({ version: 2 }),
      };

      const id = await offlineDb.conflicts.add(conflict);
      const retrieved = await offlineDb.conflicts.get(id);

      expect(retrieved?.interviewId).toBe(conflict.interviewId);
      expect(retrieved?.resolvedAt).toBeNull();
    });

    it('should auto-increment id for conflicts', async () => {
      const conflict1: ConflictItem = {
        interviewId: 'interview-1',
        detectedAt: Date.now(),
        resolvedAt: null,
        localData: JSON.stringify({}),
        serverData: JSON.stringify({}),
      };

      const conflict2: ConflictItem = {
        interviewId: 'interview-2',
        detectedAt: Date.now(),
        resolvedAt: null,
        localData: JSON.stringify({}),
        serverData: JSON.stringify({}),
      };

      const id1 = await offlineDb.conflicts.add(conflict1);
      const id2 = await offlineDb.conflicts.add(conflict2);

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id2!).toBeGreaterThan(id1!);
    });

    it('should filter unresolved conflicts', async () => {
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

      const allConflicts = await offlineDb.conflicts.toArray();
      const unresolvedConflicts = allConflicts.filter(
        (c) => c.resolvedAt === null,
      );

      expect(unresolvedConflicts).toHaveLength(2);
    });

    it('should update conflict to mark as resolved', async () => {
      const conflict: ConflictItem = {
        interviewId: 'interview-1',
        detectedAt: Date.now(),
        resolvedAt: null,
        localData: JSON.stringify({}),
        serverData: JSON.stringify({}),
      };

      const id = await offlineDb.conflicts.add(conflict);
      const resolvedAt = Date.now();
      await offlineDb.conflicts.update(id, { resolvedAt });

      const updated = await offlineDb.conflicts.get(id);
      expect(updated?.resolvedAt).toBe(resolvedAt);
    });
  });

  describe('settings store', () => {
    it('should add and retrieve a setting', async () => {
      const setting: OfflineSetting = {
        key: 'initialized',
        value: 'true',
      };

      await offlineDb.settings.add(setting);
      const retrieved = await offlineDb.settings.get('initialized');

      expect(retrieved).toEqual(setting);
    });

    it('should update an existing setting', async () => {
      const setting: OfflineSetting = {
        key: 'initialized',
        value: 'false',
      };

      await offlineDb.settings.add(setting);
      await offlineDb.settings.update('initialized', { value: 'true' });

      const updated = await offlineDb.settings.get('initialized');
      expect(updated?.value).toBe('true');
    });

    it('should delete a setting', async () => {
      const setting: OfflineSetting = {
        key: 'initialized',
        value: 'true',
      };

      await offlineDb.settings.add(setting);
      await offlineDb.settings.delete('initialized');

      const retrieved = await offlineDb.settings.get('initialized');
      expect(retrieved).toBeUndefined();
    });

    it('should put setting to upsert', async () => {
      const setting: OfflineSetting = {
        key: 'initialized',
        value: 'false',
      };

      await offlineDb.settings.put(setting);
      let retrieved = await offlineDb.settings.get('initialized');
      expect(retrieved?.value).toBe('false');

      await offlineDb.settings.put({ key: 'initialized', value: 'true' });
      retrieved = await offlineDb.settings.get('initialized');
      expect(retrieved?.value).toBe('true');
    });
  });

  describe('TypeScript types', () => {
    it('should enforce correct types for OfflineInterview', async () => {
      const interview: OfflineInterview = {
        id: 'interview-1',
        protocolId: 'protocol-1',
        syncStatus: 'synced',
        lastUpdated: Date.now(),
        isOfflineCreated: false,
        data: JSON.stringify({}),
      };

      await offlineDb.interviews.add(interview);
      const retrieved = await offlineDb.interviews.get('interview-1');

      expect(retrieved?.syncStatus).toBe('synced');
    });

    it('should enforce correct types for SyncQueueItem operations', async () => {
      const operations: ('create' | 'update' | 'delete')[] = [
        'create',
        'update',
        'delete',
      ];

      for (const operation of operations) {
        const item: SyncQueueItem = {
          interviewId: `interview-${operation}`,
          operation,
          createdAt: Date.now(),
          payload: JSON.stringify({}),
        };

        await offlineDb.syncQueue.add(item);
      }

      const count = await offlineDb.syncQueue.count();
      expect(count).toBe(3);
    });
  });
});

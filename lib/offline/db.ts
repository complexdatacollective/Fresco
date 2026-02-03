import Dexie, { type EntityTable } from 'dexie';
import { ensureError } from '~/utils/ensureError';

export type SyncStatus = 'synced' | 'pending' | 'conflict';

export class QuotaExceededError extends Error {
  constructor(message = 'Storage quota exceeded') {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export class TransactionError extends Error {
  constructor(message = 'Database transaction failed') {
    super(message);
    this.name = 'TransactionError';
  }
}

type ErrorLogEntry = {
  id?: number;
  timestamp: number;
  operation: string;
  error: string;
  context?: string;
};

export type OfflineInterview = {
  id: string;
  protocolId: string;
  syncStatus: SyncStatus;
  lastUpdated: number;
  isOfflineCreated: boolean;
  data: string;
};

export type CachedProtocol = {
  id: string;
  name: string;
  cachedAt: number;
  data: string;
};

export type CachedAsset = {
  key: string;
  assetId: string;
  protocolId: string;
  cachedAt: number;
  blob: Blob;
};

export type SyncQueueItem = {
  id?: number;
  interviewId: string;
  operation: 'create' | 'update' | 'delete';
  createdAt: number;
  payload: string;
};

export type ConflictItem = {
  id?: number;
  interviewId: string;
  detectedAt: number;
  resolvedAt: number | null;
  localData: string;
  serverData: string;
};

export type OfflineSetting = {
  key: string;
  value: string;
};

class OfflineDatabase extends Dexie {
  interviews!: EntityTable<OfflineInterview, 'id'>;
  protocols!: EntityTable<CachedProtocol, 'id'>;
  assets!: EntityTable<CachedAsset, 'key'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  conflicts!: EntityTable<ConflictItem, 'id'>;
  settings!: EntityTable<OfflineSetting, 'key'>;
  errorLogs!: EntityTable<ErrorLogEntry, 'id'>;

  constructor() {
    super('FrescoOfflineDB');

    // Version 1: Initial schema for offline support
    // IMPORTANT: When adding new versions, use this.version(N).stores({...}).upgrade(...)
    // to migrate existing data. See: https://dexie.org/docs/Tutorial/Design#database-versioning
    this.version(1).stores({
      interviews: 'id, protocolId, syncStatus, lastUpdated, isOfflineCreated',
      protocols: 'id, name, cachedAt',
      assets: 'key, assetId, protocolId, cachedAt',
      syncQueue: '++id, interviewId, operation, createdAt',
      conflicts: '++id, interviewId, detectedAt, resolvedAt',
      settings: 'key',
    });

    // Version 2: Add error logs table
    this.version(2).stores({
      interviews: 'id, protocolId, syncStatus, lastUpdated, isOfflineCreated',
      protocols: 'id, name, cachedAt',
      assets: 'key, assetId, protocolId, cachedAt',
      syncQueue: '++id, interviewId, operation, createdAt',
      conflicts: '++id, interviewId, detectedAt, resolvedAt',
      settings: 'key',
      errorLogs: '++id, timestamp, operation',
    });
  }
}

let dbInstance: OfflineDatabase | null = null;

export const getOfflineDb = (): OfflineDatabase => {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    throw new Error(
      'IndexedDB is only available in browser context. Offline features require IndexedDB support.',
    );
  }
  dbInstance ??= new OfflineDatabase();
  return dbInstance;
};

// Lazily initialized database - safe to import in any context
// Will throw on access if used outside browser environment
export const offlineDb = new Proxy({} as OfflineDatabase, {
  get(_target, prop): unknown {
    const db = getOfflineDb();
    const value = db[prop as keyof OfflineDatabase];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(db);
    }
    return value;
  },
});

const ERROR_LOG_LIMIT = 100;
const ERROR_LOG_CLEANUP_COUNT = 50;

export const logOfflineError = async (
  operation: string,
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> => {
  try {
    const err = ensureError(error);
    await offlineDb.errorLogs.add({
      timestamp: Date.now(),
      operation,
      error: err.message,
      context: context ? JSON.stringify(context) : undefined,
    });

    const count = await offlineDb.errorLogs.count();
    if (count > ERROR_LOG_LIMIT) {
      const oldest = await offlineDb.errorLogs
        .orderBy('timestamp')
        .limit(ERROR_LOG_CLEANUP_COUNT)
        .toArray();
      const idsToDelete = oldest
        .map((entry) => entry.id)
        .filter((id): id is number => id !== undefined);
      await offlineDb.errorLogs.bulkDelete(idsToDelete);
    }
  } catch {
    // eslint-disable-next-line no-console
    console.error('Failed to log offline error:', error);
  }
};

export const withErrorHandling = async <T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    const err = ensureError(error);

    if (
      err.name === 'QuotaExceededError' ||
      err.message.includes('quota') ||
      err.message.includes('storage')
    ) {
      await logOfflineError(operation, err, { type: 'quota' });
      throw new QuotaExceededError(err.message);
    }

    if (
      err.name === 'TransactionInactiveError' ||
      err.message.includes('transaction')
    ) {
      await logOfflineError(operation, err, { type: 'transaction' });
      throw new TransactionError(err.message);
    }

    await logOfflineError(operation, err);
    throw err;
  }
};

export type StorageBreakdown = {
  protocols: { count: number; estimatedSize: number };
  assets: { count: number; estimatedSize: number };
  interviews: { count: number; estimatedSize: number };
  total: number;
};

export const getStorageBreakdown = async (): Promise<StorageBreakdown> => {
  const protocols = await offlineDb.protocols.toArray();
  const assets = await offlineDb.assets.toArray();
  const interviews = await offlineDb.interviews.toArray();

  const protocolsSize = protocols.reduce(
    (sum, p) => sum + (p.data?.length ?? 0),
    0,
  );
  const assetsSize = assets.reduce((sum, a) => sum + (a.blob?.size ?? 0), 0);
  const interviewsSize = interviews.reduce(
    (sum, i) => sum + (i.data?.length ?? 0),
    0,
  );

  return {
    protocols: { count: protocols.length, estimatedSize: protocolsSize },
    assets: { count: assets.length, estimatedSize: assetsSize },
    interviews: { count: interviews.length, estimatedSize: interviewsSize },
    total: protocolsSize + assetsSize + interviewsSize,
  };
};

export const deleteProtocolCache = async (
  protocolId: string,
): Promise<void> => {
  return withErrorHandling('deleteProtocolCache', async () => {
    await offlineDb.transaction(
      'rw',
      [offlineDb.protocols, offlineDb.assets],
      async () => {
        await offlineDb.protocols.delete(protocolId);
        await offlineDb.assets.where('protocolId').equals(protocolId).delete();
      },
    );
  });
};

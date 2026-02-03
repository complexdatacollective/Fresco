import { useLiveQuery } from 'dexie-react-hooks';
import { offlineDb } from '~/lib/offline/db';

type SyncStatus = {
  pendingSyncs: number;
  conflicts: number;
  isInitialized: boolean;
};

const useSyncStatus = (): SyncStatus => {
  const pendingSyncs = useLiveQuery(
    async () => {
      const count = await offlineDb.syncQueue.count();
      return count;
    },
    [],
    0,
  );

  const conflicts = useLiveQuery(
    async () => {
      const allConflicts = await offlineDb.conflicts.toArray();
      const unresolvedConflicts = allConflicts.filter(
        (c) => c.resolvedAt === null,
      );
      return unresolvedConflicts.length;
    },
    [],
    0,
  );

  const isInitialized = useLiveQuery(
    async () => {
      const setting = await offlineDb.settings.get('initialized');
      return setting?.value === 'true';
    },
    [],
    false,
  );

  return {
    pendingSyncs: pendingSyncs ?? 0,
    conflicts: conflicts ?? 0,
    isInitialized: isInitialized ?? false,
  };
};

export default useSyncStatus;

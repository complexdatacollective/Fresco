'use client';

import { type Middleware } from '@reduxjs/toolkit';
import { debounce, isEqual, omit } from 'es-toolkit';
import posthog from 'posthog-js';
import type {
  SessionPayload,
  SyncHandler,
} from '~/lib/interviewer/contract/types';
import { ensureError } from '~/utils/ensureError';

type SyncMiddlewareState = { session: SessionPayload };

const sessionChanged = (a: SessionPayload, b: SessionPayload) =>
  !isEqual(omit(a, ['promptIndex']), omit(b, ['promptIndex']));

export const createSyncMiddleware = ({
  onSync,
}: {
  onSync: SyncHandler;
}): Middleware<Record<string, never>, SyncMiddlewareState> => {
  let lastSyncedState = {} as SessionPayload;
  let isSyncing = false;
  let storeRef: { getState: () => SyncMiddlewareState } | null = null;

  const doSync = () => {
    if (isSyncing || !storeRef) return;
    const session = storeRef.getState().session;
    if (!sessionChanged(session, lastSyncedState)) return;

    isSyncing = true;
    lastSyncedState = session;

    onSync(session.id, session)
      .catch((e) => {
        const error = ensureError(e);
        // eslint-disable-next-line no-console
        console.error('❌ Error syncing data:', error);
        posthog.captureException(error);
      })
      .finally(() => {
        isSyncing = false;
        if (
          storeRef &&
          sessionChanged(storeRef.getState().session, lastSyncedState)
        ) {
          debouncedSync();
        }
      });
  };

  const debouncedSync = debounce(doSync, 3000, {
    edges: ['leading', 'trailing'],
  });

  return (store) => {
    storeRef = store;
    lastSyncedState = store.getState().session;
    isSyncing = false;
    debouncedSync.cancel();

    return (next) => (action: unknown) => {
      const result = next(action);
      const state = store.getState();
      if (!sessionChanged(state.session, lastSyncedState)) return result;
      debouncedSync();
      return result;
    };
  };
};

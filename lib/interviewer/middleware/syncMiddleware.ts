'use client';

import { type Middleware } from '@reduxjs/toolkit';
import { debounce, isEqual, omit } from 'es-toolkit';
import { type RootState } from '~/lib/interviewer/store';
import { ensureError } from '~/utils/ensureError';
import { type SessionState } from '../ducks/modules/session';

const syncFn = async (id: string, data: SessionState) => {
  try {
    // eslint-disable-next-line no-console
    console.log('🚀 Syncing data with server...');
    const response = await fetch(`/interview/${id}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // eslint-disable-next-line no-console
    console.log('✅ Data synced successfully');
    return { success: true };
  } catch (e) {
    const error = ensureError(e);
    // eslint-disable-next-line no-console
    console.error('❌ Error syncing data:', error);
    return { success: false, error: error.message };
  }
};

const sessionChanged = (a: SessionState, b: SessionState) =>
  !isEqual(omit(a, ['promptIndex']), omit(b, ['promptIndex']));

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const createSyncMiddleware = (): Middleware<{}, RootState> => {
  // Tracks the state that was last sent to the server, so we only sync
  // when there are genuinely unsynced changes.
  let lastSyncedState = {} as SessionState;
  let isSyncing = false;
  let storeRef: { getState: () => RootState } | null = null;

  const doSync = () => {
    if (isSyncing || !storeRef) return;

    const session = storeRef.getState().session;

    if (!sessionChanged(session, lastSyncedState)) {
      return;
    }

    isSyncing = true;
    lastSyncedState = session;

    syncFn(session.id, session)
      .catch((e) => {
        const error = ensureError(e);
        // eslint-disable-next-line no-console
        console.error('Failed to sync state with backend:', error);
      })
      .finally(() => {
        isSyncing = false;

        // If state changed during sync, schedule a follow-up so changes
        // that arrived while the request was in-flight are never lost.
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
    // Reset per-store state so a previous interview's sync state doesn't
    // leak into a new one.
    lastSyncedState = store.getState().session;
    isSyncing = false;
    debouncedSync.cancel();

    return (next) => (action: unknown) => {
      const result = next(action);

      const state = store.getState();

      if (!sessionChanged(state.session, lastSyncedState)) {
        return result;
      }

      // Let the debounce handle rate-limiting. doSync reads current state
      // at execution time (not captured here), so the trailing edge always
      // sends the latest state.
      debouncedSync();

      return result;
    };
  };
};

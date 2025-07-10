'use client';

import { type Middleware } from '@reduxjs/toolkit';
import { isEqual, omit } from 'es-toolkit';
import { type RootState } from '~/lib/interviewer/store';
import { ensureError } from '~/utils/ensureError';
import { type SessionState } from '../ducks/modules/session';

// Sync data implemented as fetch request
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
    console.log('✅ Data synced successfully:');
    return {
      success: true,
    };
  } catch (e) {
    const error = ensureError(e);
    // eslint-disable-next-line no-console
    console.error('❌ Error syncing data:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const createSyncMiddleware = (): Middleware<{}, RootState> => {
  let previousState = {} as SessionState;
  // Track if we're currently syncing to avoid loops
  let isSyncing = false;

  // Track timer for debouncing
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Middleware implementation
  return (store) => (next) => (action: unknown) => {
    // Always pass the action through the reducer first (optimistic updates)
    const result = next(action);

    // skip if the state hasn't changed
    const state = store.getState();
    if (
      isEqual(
        omit(state.session, ['promptIndex']),
        omit(previousState, ['promptIndex']),
      )
    ) {
      return result;
    }

    // Update previous state
    previousState = state.session;

    // Get the current interview id to send to the sync function
    const interviewId = state.session.id;

    // Skip if we're already in the process of syncing
    // This prevents infinite loops where sync triggers actions
    if (isSyncing) {
      return result;
    }

    // Clear any existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set a new debounce timer
    debounceTimer = setTimeout(() => {
      // Set flag to prevent recursive syncing
      isSyncing = true;

      // Perform the sync
      syncFn(interviewId, state.session)
        .catch((e) => {
          const error = ensureError(e);
          // eslint-disable-next-line no-console
          console.error('Failed to sync state with backend:', error);
        })
        .finally(() => {
          // Reset syncing flag
          isSyncing = false;
        });
    }, 3000);

    return result;
  };
};

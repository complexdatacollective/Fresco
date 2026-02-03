'use client';

import { type Middleware } from '@reduxjs/toolkit';
import { debounce } from 'es-toolkit';
import { type RootState } from '~/lib/interviewer/store';
import { ensureError } from '~/utils/ensureError';
import { offlineDb } from './db';
import { postMessage } from './tabSync';

type OfflineMiddlewareOptions = {
  debounceMs?: number;
};

const persistToIndexedDB = async (interviewId: string, state: RootState) => {
  try {
    const serializedState = JSON.stringify(state.session);

    await offlineDb.interviews.put({
      id: interviewId,
      protocolId: state.protocol.id,
      syncStatus: 'pending',
      lastUpdated: Date.now(),
      isOfflineCreated: interviewId.startsWith('temp-'),
      data: serializedState,
    });

    postMessage({
      type: 'INTERVIEW_UPDATED',
      id: interviewId,
    });
  } catch (e) {
    const error = ensureError(e);
    // eslint-disable-next-line no-console
    console.error('Failed to persist state to IndexedDB:', error);
  }
};

export const createOfflineMiddleware = (
  options: OfflineMiddlewareOptions = {},
): Middleware<object, RootState> => {
  const { debounceMs = 1000 } = options;

  const debouncedPersist = debounce(
    (interviewId: string, state: RootState) => {
      persistToIndexedDB(interviewId, state).catch((e) => {
        const error = ensureError(e);
        // eslint-disable-next-line no-console
        console.error('Failed to persist to IndexedDB:', error);
      });
    },
    debounceMs,
    { edges: ['trailing'] },
  );

  return (store) => (next) => (action: unknown) => {
    const result = next(action);

    const state = store.getState();
    const interviewId = state.session.id;

    if (interviewId) {
      debouncedPersist(interviewId, state);
    }

    return result;
  };
};

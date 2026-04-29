'use client';

import {
  combineReducers,
  configureStore,
  type Middleware,
} from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import type {
  InterviewPayload,
  SyncHandler,
} from '~/lib/interviewer/contract/types';
import protocol from '~/lib/interviewer/ducks/modules/protocol';
import session from '~/lib/interviewer/ducks/modules/session';
import ui from '~/lib/interviewer/ducks/modules/ui';
import logger from './ducks/middleware/logger';
import { createSyncMiddleware } from './middleware/syncMiddleware';

const rootReducer = combineReducers({
  session,
  protocol,
  ui,
});

type StoreOptions = {
  onSync: SyncHandler;
  isDevelopment?: boolean;
  extraMiddleware?: Middleware[];
};

export const store = (
  { session: sessionPayload, protocol: protocolPayload }: InterviewPayload,
  options: StoreOptions,
) => {
  const syncMiddleware = createSyncMiddleware({ onSync: options.onSync });

  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['dialogs/addDialog', 'dialogs/open/pending'],
        },
      }).concat(
        ...(options.isDevelopment ? [logger] : []),
        syncMiddleware,
        ...(options.extraMiddleware ?? []),
      ),
    preloadedState: {
      session: sessionPayload,
      protocol: protocolPayload,
    },
  });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof store>['dispatch'];
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

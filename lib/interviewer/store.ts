'use client';

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { reducer as form } from 'redux-form';
import protocol from '~/lib/interviewer/ducks/modules/protocol';
import session from '~/lib/interviewer/ducks/modules/session';
import ui from '~/lib/interviewer/ducks/modules/ui';
import { type GetInterviewByIdQuery } from '~/queries/interviews';
import logger from './ducks/middleware/logger';
import { createSyncMiddleware } from './middleware/syncMiddleware';

const syncMiddleware = createSyncMiddleware();

const rootReducer = combineReducers({
  form,
  session,
  protocol,
  ui, // don't do it - this is used for FORM_IS_READY
});

export const store = ({
  protocol,
  ...session
}: NonNullable<GetInterviewByIdQuery>) =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [
            '@@redux-form/INITIALIZE', // Redux form stores functions for validation in the store
            'dialogs/addDialog', // Dialogs store callback functions
            'dialogs/open/pending', // Dialogs store callback functions
          ],
        },
      }).concat([logger, syncMiddleware]),
    preloadedState: {
      session: {
        // Important to manually pass only the required state items to the session
        // reducer, otherwise it will complain about items that aren't able to
        // be serialised.
        id: session.id,
        currentStep: session.currentStep,
        startTime: session.startTime.toISOString(),
        finishTime: session.finishTime?.toISOString() ?? null,
        exportTime: session.exportTime?.toISOString() ?? null,
        lastUpdated: session.lastUpdated.toISOString(),
        network: session.network,
        stageMetadata: session.stageMetadata ?? undefined,
      },
      protocol,
    },
  });

export type RootState = ReturnType<typeof rootReducer>;
type AppDispatch = ReturnType<typeof store>['dispatch'];
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export type AppStore = ReturnType<typeof store>;

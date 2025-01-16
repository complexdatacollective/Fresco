import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { reducer as form } from 'redux-form';
import activeSessionId from '~/lib/interviewer/ducks/modules/activeSessionId';
import dialogs from '~/lib/interviewer/ducks/modules/dialogs';
import installedProtocols from '~/lib/interviewer/ducks/modules/installedProtocols';
import sessions from '~/lib/interviewer/ducks/modules/session';
import ui from '~/lib/interviewer/ducks/modules/ui';
import { type NcNetwork } from '../shared-consts';
import logger from './ducks/middleware/logger';
import sound from './ducks/middleware/sound';

const rootReducer = combineReducers({
  form,
  activeSessionId,
  sessions,
  installedProtocols,
  dialogs,
  ui, // used for FORM_IS_READY
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(logger, sound),
});

export type GetState = typeof store.getState;
export type RootState = ReturnType<typeof store.getState>;

export type StageMetadataEntry = [number, string, string, boolean];
export type StageMetadata = StageMetadataEntry[];

// TODO: couldn't make this work extending the Interview prisma schema...
export type Session = {
  id: string;
  startTime: Date;
  finishTime: Date | null;
  exportTime: Date | null;
  lastUpdated: Date;
  network: NcNetwork;
  protocolId: string;
  currentStep: number;
  promptIndex?: number;
  stageMetadata?: Record<number, StageMetadata>; // Used as temporary storage by DyadCensus/TieStrengthCensus
};

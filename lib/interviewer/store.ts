import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { reducer as form } from 'redux-form';
import thunk from 'redux-thunk';
import activeSessionId from '~/lib/interviewer/ducks/modules/activeSessionId';
import deviceSettings from '~/lib/interviewer/ducks/modules/deviceSettings';
import dialogs from '~/lib/interviewer/ducks/modules/dialogs';
import installedProtocols from '~/lib/interviewer/ducks/modules/installedProtocols';
import sessions from '~/lib/interviewer/ducks/modules/session';
import ui from '~/lib/interviewer/ducks/modules/ui';
import { type NcNetwork } from '../shared-consts';
import logger from './ducks/middleware/logger';
import sound from './ducks/middleware/sound';
import passphrase from './ducks/modules/passphrase';

const rootReducer = combineReducers({
  passphrase,
  form,
  activeSessionId,
  sessions,
  installedProtocols,
  deviceSettings,
  dialogs,
  ui, // used for FORM_IS_READY
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: [thunk, logger, sound],
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

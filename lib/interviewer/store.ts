import { configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import logger from './ducks/middleware/logger';
import sound from './ducks/middleware/sound';
import { reducer as form } from 'redux-form';
import activeSessionId from '~/lib/interviewer/ducks/modules/activeSessionId';
import sessions from '~/lib/interviewer/ducks/modules/session';
import deviceSettings from '~/lib/interviewer/ducks/modules/deviceSettings';
import dialogs from '~/lib/interviewer/ducks/modules/dialogs';
import ui from '~/lib/interviewer/ducks/modules/ui';
import installedProtocols from '~/lib/interviewer/ducks/modules/installedProtocols';
import type { NcNetwork, Protocol } from '@codaco/shared-consts';

export const store = configureStore({
  reducer: {
    form,
    activeSessionId,
    sessions,
    installedProtocols,
    deviceSettings,
    dialogs,
    ui,
  },
  middleware: [thunk, logger, sound],
});

export type StageMetadataEntry = [number, string, string, boolean];
export type StageMetadata = StageMetadataEntry[];

type Session = {
  id: string;
  protocolUid: string;
  promptIndex: number;
  currentStep: number;
  caseId: string;
  network: NcNetwork;
  startedAt: Date;
  lastUpdated: Date;
  finishedAt: Date;
  exportedAt: Date;
  stageMetadata?: Record<number, StageMetadata>; // Used as temporary storage by DyadCensus/TieStrengthCensus
};

type SessionsState = Record<string, Session>;

type InstalledProtocols = Record<string, Protocol>;

type Dialog = {
  id: string;
  title: string;
  type: string;
  confirmLabel?: string;
  message: string;
};

type Dialogs = {
  dialogs: Dialog[];
};

export type RootState = {
  form: Record<string, unknown>;
  activeSessionId: keyof SessionsState;
  sessions: SessionsState;
  installedProtocols: InstalledProtocols;
  deviceSettings: Record<string, unknown>;
  dialogs: Dialogs;
  ui: Record<string, unknown>;
};

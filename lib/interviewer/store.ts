import type { Protocol } from '@prisma/client';
import { configureStore } from '@reduxjs/toolkit';
import { reducer as form } from 'redux-form';
import thunk from 'redux-thunk';
import activeSessionId from '~/lib/interviewer/ducks/modules/activeSessionId';
import deviceSettings from '~/lib/interviewer/ducks/modules/deviceSettings';
import dialogs from '~/lib/interviewer/ducks/modules/dialogs';
import installedProtocols from '~/lib/interviewer/ducks/modules/installedProtocols';
import sessions from '~/lib/interviewer/ducks/modules/session';
import ui from '~/lib/interviewer/ducks/modules/ui';
import type { NcNetwork } from '~/schemas/network-canvas';
import logger from './ducks/middleware/logger';
import sound from './ducks/middleware/sound';

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

export type InstalledProtocols = Record<string, Protocol>;

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

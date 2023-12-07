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

export type Session = {
  protocolUid: string;
  promptIndex: number;
  stageIndex: number;
  caseId: string;
  network: NcNetwork;
  startedAt: Date;
  updatedAt: Date;
  finishedAt: Date;
  exportedAt: Date;
};

export type SessionsState = Record<string, Session>;

export type InstalledProtocols = Record<string, Protocol>;

export type Dialog = {
  id: string;
  title: string;
  type: string;
  confirmLabel?: string;
  message: string;
};

export type Dialogs = {
  dialogs: Dialog[];
};

export type RootState = {
  form: Record<string, unknown>;
  activeSessionId: string | null;
  sessions: SessionsState;
  installedProtocols: InstalledProtocols;
  deviceSettings: Record<string, unknown>;
  dialogs: Dialogs;
  ui: Record<string, unknown>;
};

export type AppDispatch = typeof store.dispatch;

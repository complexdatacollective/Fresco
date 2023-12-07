import { configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import logger from './ducks/middleware/logger';
import sound from './ducks/middleware/sound';
import { reducer as form } from 'redux-form';
import activeSessionId from '~/lib/interviewer/ducks/modules/activeSessionId';
import sessions from '~/lib/interviewer/ducks/modules/session';
import deviceSettings from '~/lib/interviewer/ducks/modules/deviceSettings';
import dialogs from '~/lib/interviewer/ducks/modules/dialogs';
import search from '~/lib/interviewer/ducks/modules/search';
import ui from '~/lib/interviewer/ducks/modules/ui';
import installedProtocols from '~/lib/interviewer/ducks/modules/installedProtocols';

export const store = configureStore({
  reducer: {
    form,
    activeSessionId,
    sessions,
    installedProtocols,
    deviceSettings,
    dialogs,
    search,
    ui,
  },
  middleware: [thunk, logger, sound],
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import logger from './ducks/middleware/logger';
import sound from './ducks/middleware/sound';
import { reducer as form } from 'redux-form';
import sessions from '~/lib/interviewer/ducks/modules/sessions';
import deviceSettings from '~/lib/interviewer/ducks/modules/deviceSettings';
import installedProtocols from '~/lib/interviewer/ducks/modules/installedProtocols';
import dialogs from '~/lib/interviewer/ducks/modules/dialogs';
import search from '~/lib/interviewer/ducks/modules/search';
import ui from '~/lib/interviewer/ducks/modules/ui';

export const store = configureStore({
  reducer: {
    form,
    sessions,
    deviceSettings,
    installedProtocols,
    dialogs,
    search,
    ui,
  },
  middleware: [thunk, logger, sound],
});

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

export default function configureAppStore({ protocol, session }) {
  const store = configureStore({
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
    preloadedState: {
      activeSessionId: '1',
      sessions: {
        '1': {
          caseId: 'test',
          finishedAt: null,
          exportedAt: null,
          ...(session.network && { network: session.network }),
          protocolUID: '1',
          stageIndex: session.currentStep,
          promptIndex: 0,
        },
      },
      installedProtocols: {
        '1': protocol,
      },
    },
  });

  return store;
}

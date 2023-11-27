import { configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import logger from './ducks/middleware/logger';
import sound from './ducks/middleware/sound';
import { reducer as form } from 'redux-form';
import activeSessionId from '~/lib/interviewer/ducks/modules/session';
import sessions from '~/lib/interviewer/ducks/modules/sessions';
import deviceSettings from '~/lib/interviewer/ducks/modules/deviceSettings';
import dialogs from '~/lib/interviewer/ducks/modules/dialogs';
import search from '~/lib/interviewer/ducks/modules/search';
import ui from '~/lib/interviewer/ducks/modules/ui';
import installedProtocols from '~/lib/interviewer/ducks/modules/installedProtocols';
import type { NcNetwork, Protocol } from '@codaco/shared-consts';
import { getInitialNetworkState } from './ducks/modules/network';

type InitialData = {
  protocol: Protocol;
  network: NcNetwork;
  currentStageIndex: number;
};

export default function configureAppStore(initialData: InitialData) {
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
          network: initialData.network ?? getInitialNetworkState(),
          protocolUID: '1',
          stageIndex: initialData.currentStageIndex,
          promptIndex: 0,
        },
      },
      installedProtocols: {
        '1': initialData.protocol,
      },
    },
  });

  return store;
}

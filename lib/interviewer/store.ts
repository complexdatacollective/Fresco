import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { reducer as form } from 'redux-form';
import dialogs from '~/lib/interviewer/ducks/modules/dialogs';
import protocolSlice from '~/lib/interviewer/ducks/modules/protocol';
import sessionSlice from '~/lib/interviewer/ducks/modules/session';
import ui from '~/lib/interviewer/ducks/modules/ui';
import { type getInterviewById } from '~/queries/interviews';
import logger from './ducks/middleware/logger';

const rootReducer = combineReducers({
  form,
  session: sessionSlice,
  protocol: protocolSlice.reducer,
  dialogs,
  ui, // used for FORM_IS_READY
});

export const store = ({
  protocol,
  ...session
}: Awaited<ReturnType<typeof getInterviewById>>) =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
    preloadedState: {
      session: {
        ...session,
        passphrase: null,
        encryptionEnabled: false,
      },
      protocol: protocol,
    },
  });

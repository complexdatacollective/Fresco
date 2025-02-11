import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { reducer as form } from 'redux-form';
import dialogs from '~/lib/interviewer/ducks/modules/dialogs';
import protocolSlice from '~/lib/interviewer/ducks/modules/protocol';
import session, {
  type StageMetadata,
} from '~/lib/interviewer/ducks/modules/session';
import ui from '~/lib/interviewer/ducks/modules/ui';
import { type GetInterviewByIdReturnType } from '~/queries/interviews';
import { type NcNetwork } from '../shared-consts';
import logger from './ducks/middleware/logger';

const rootReducer = combineReducers({
  form,
  session,
  protocol: protocolSlice.reducer,
  dialogs,
  ui, // don't do it - this is used for FORM_IS_READY
});

export const store = ({
  protocol,
  ...session
}: NonNullable<GetInterviewByIdReturnType>) =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
    preloadedState: {
      session: {
        ...session,
        network: session.network as NcNetwork,
        stageMetadata: session.stageMetadata as StageMetadata,
      },
      protocol: protocol,
    },
  });

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store;

export type AppStore = ReturnType<typeof store>;

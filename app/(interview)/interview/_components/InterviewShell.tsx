'use client';

import { Provider, useSelector } from 'react-redux';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import { store } from '~/lib/interviewer/store';
import UserBanner from './UserBanner';
import { useEffect, useState } from 'react';
import {
  SET_SERVER_SESSION,
  type SetServerSessionAction,
} from '~/lib/interviewer/ducks/modules/setServerSession';
import {
  getActiveSession,
  getStageIndex,
} from '~/lib/interviewer/selectors/session';
import { api } from '~/trpc/client';
import { useQueryState } from 'next-usequerystate';
import usePrevious from '~/hooks/usePrevious';
import { isEqual } from 'lodash';

// The job of ServerSync is to listen to actions in the redux store, and to sync
// data with the server.
const ServerSync = ({ interviewId }: { interviewId: string }) => {
  const [init, setInit] = useState(false);
  // Current stage
  const currentSession = useSelector(getActiveSession);
  const prevCurrentSession = usePrevious(currentSession);
  const { mutate: syncSessionWithServer } = api.interview.sync.useMutation();

  useEffect(() => {
    if (!init) {
      setInit(true);
      return;
    }

    if (
      isEqual(currentSession, prevCurrentSession) ||
      !currentSession ||
      !prevCurrentSession
    ) {
      return;
    }

    // check if current stage index is null (happens when hot reloading)
    if (currentSession.currentStep === null) {
      console.log('⚠️ Current stage index is null. Skipping sync.');
      return;
    }

    console.log(`⬆️ Syncing session with server...`);
    syncSessionWithServer({
      id: interviewId,
      network: currentSession.network,
      currentStep: currentSession.currentStep,
    });
  }, [
    currentSession,
    prevCurrentSession,
    interviewId,
    syncSessionWithServer,
    init,
  ]);

  return null;
};

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = ({ interviewID }: { interviewID: string }) => {
  const [currentStage, setCurrentStage] = useQueryState('stage');

  const { isLoading } = api.interview.get.byId.useQuery(
    { id: interviewID },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      onSuccess: async (data) => {
        if (!data) {
          return;
        }

        const { protocol, ...serverSession } = data;

        console.log(
          '✅ Received server session. Setting current stage, and initializing redux store...',
        );

        if (!currentStage) {
          await setCurrentStage(serverSession.currentStep.toString());
        }

        store.dispatch<SetServerSessionAction>({
          type: SET_SERVER_SESSION,
          payload: {
            protocol,
            session: serverSession,
          },
        });
      },
    },
  );

  if (isLoading) {
    return 'Second loading stage...';
  }

  return (
    <Provider store={store}>
      <ServerSync interviewId={interviewID} />
      <UserBanner />
      <ProtocolScreen />
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

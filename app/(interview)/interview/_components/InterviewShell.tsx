'use client';

import { Provider } from 'react-redux';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import {
  SET_SERVER_SESSION,
  type SetServerSessionAction,
} from '~/lib/interviewer/ducks/modules/setServerSession';
import { store } from '~/lib/interviewer/store';
import { api } from '~/trpc/client';
import { useRouter } from 'next/navigation';
import ServerSync from './ServerSync';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import { Spinner } from '~/lib/ui/components';

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = ({ interviewID }: { interviewID: string }) => {
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  const [currentStage, setCurrentStage] = useQueryState(
    'stage',
    parseAsInteger,
  );

  const { isLoading, data: serverData } = api.interview.get.byId.useQuery(
    { id: interviewID },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  useEffect(() => {
    if (initialized || !serverData) {
      return;
    }

    const { protocol, ...serverSession } = serverData;

    // If we have a current stage in the URL bar, and it is different from the
    // server session, set the server session to the current stage.
    //
    // If we don't have a current stage in the URL bar, set it to the server
    // session, and set the URL bar to the server session.
    if (currentStage === null) {
      void setCurrentStage(serverSession.currentStep);
    } else if (currentStage !== serverSession.currentStep) {
      serverSession.currentStep = currentStage;
    }

    // If there's no current stage in the URL bar, set it.
    store.dispatch<SetServerSessionAction>({
      type: SET_SERVER_SESSION,
      payload: {
        protocol,
        session: serverSession,
      },
    });

    setInitialized(true);
  }, [
    serverData,
    currentStage,
    setCurrentStage,
    router,
    initialized,
    setInitialized,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Provider store={store}>
      <ServerSync interviewId={interviewID}>
        <ProtocolScreen />
      </ServerSync>
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

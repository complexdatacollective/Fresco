'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import type { SyncInterview } from '~/actions/interviews';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import {
  actionTypes,
  type SetServerSessionAction,
} from '~/lib/interviewer/ducks/modules/setServerSession';
import { store } from '~/lib/interviewer/store';
import type { getInterviewById } from '~/queries/interviews';
import ServerSync from './ServerSync';

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = ({
  serverPayload,
  syncInterview,
}: {
  serverPayload: Awaited<ReturnType<typeof getInterviewById>>;
  syncInterview: SyncInterview;
}) => {
  const [initialized, setInitialized] = useState(false);
  const [currentStage, setCurrentStage] = useQueryState('step', parseAsInteger);

  useEffect(() => {
    if (initialized || !serverPayload) {
      return;
    }

    // If we have a current stage in the URL bar, and it is different from the
    // server session, set the server session to the current stage.
    //
    // If we don't have a current stage in the URL bar, set it to the server
    // session, and set the URL bar to the server session.
    if (currentStage === null) {
      void setCurrentStage(serverPayload.currentStep);
    } else if (currentStage !== serverPayload.currentStep) {
      serverPayload.currentStep = currentStage;
    }

    // If there's no current stage in the URL bar, set it.
    store.dispatch<SetServerSessionAction>({
      type: actionTypes.setServerSession,
      payload: serverPayload,
    });

    setInitialized(true);
  }, [
    initialized,
    setInitialized,
    currentStage,
    setCurrentStage,
    serverPayload,
  ]);

  if (!initialized || !serverPayload) {
    return null;
  }

  return (
    <Provider store={store}>
      <ServerSync interviewId={serverPayload.id} serverSync={syncInterview}>
        <ProtocolScreen />
      </ServerSync>
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

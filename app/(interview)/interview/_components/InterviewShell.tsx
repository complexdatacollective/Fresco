'use client';

import { useRef, useState } from 'react';
import { Provider } from 'react-redux';
import type { SyncInterview } from '~/actions/interviews';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import { store } from '~/lib/interviewer/store';
import type { GetInterviewByIdReturnType } from '~/queries/interviews';
import ServerSync from './ServerSync';

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = ({
  serverPayload,
  syncInterview,
}: {
  serverPayload: NonNullable<GetInterviewByIdReturnType>;
  syncInterview: SyncInterview;
}) => {
  const [initialized, setInitialized] = useState(false);
  const payload = useRef<NonNullable<GetInterviewByIdReturnType> | null>(
    serverPayload,
  );
  // const [currentStage, setCurrentStage] = useQueryState('step', parseAsInteger);

  // useEffect(() => {
  //   console.log('running');
  //   if (initialized || !serverPayload) {
  //     return;
  //   }

  //   // // If we have a current stage in the URL bar, and it is different from the
  //   // // server session, set the server session to the current stage.
  //   // //
  //   // // If we don't have a current stage in the URL bar, set it to the server
  //   // // session, and set the URL bar to the server session.
  //   // if (currentStage === null) {
  //   //   void setCurrentStage(serverPayload.currentStep);
  //   // } else if (currentStage !== serverPayload.currentStep) {
  //   //   serverPayload.currentStep = currentStage;
  //   // }

  //   setInitialized(true);
  // }, [
  //   initialized,
  //   setInitialized,
  //   currentStage,
  //   setCurrentStage,
  //   serverPayload,
  // ]);

  // if (!initialized || !serverPayload || !serverPayload.current) {
  //   return null;
  // }

  return (
    <Provider store={store(payload.current!)}>
      <ServerSync interviewId={serverPayload.id} serverSync={syncInterview}>
        <ProtocolScreen />
      </ServerSync>
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

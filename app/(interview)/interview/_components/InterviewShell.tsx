'use client';

import { Provider } from 'react-redux';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import {
  SET_SERVER_SESSION,
  type SetServerSessionAction,
} from '~/lib/interviewer/ducks/modules/setServerSession';
import { store } from '~/lib/interviewer/store';
import ServerSync from './ServerSync';
import { useEffect, useState } from 'react';
import type { Prisma } from '@prisma/client';
import { parseAsInteger, useQueryState } from 'nuqs';

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = ({
  interview,
}: {
  interview: Prisma.InterviewGetPayload<{
    include: {
      protocol: {
        include: {
          assets: true;
        };
      };
    };
  }>;
}) => {
  const [initialized, setInitialized] = useState(false);
  const [currentStage, setCurrentStage] = useQueryState('step', parseAsInteger);

  useEffect(() => {
    if (initialized || !interview) {
      return;
    }

    const { protocol, ...serverSession } = interview;

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
  }, [interview, initialized, setInitialized, currentStage, setCurrentStage]);

  if (!initialized) {
    return null;
  }

  return (
    <Provider store={store}>
      <ServerSync interviewId={interview.id}>
        <ProtocolScreen />
      </ServerSync>
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

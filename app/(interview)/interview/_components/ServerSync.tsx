'use client';

import { isEqual } from 'lodash';
import { type ReactNode, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import usePrevious from '~/hooks/usePrevious';
import { getActiveSession } from '~/lib/interviewer/selectors/session';
import { api } from '~/trpc/client';

// The job of ServerSync is to listen to actions in the redux store, and to sync
// data with the server.
const ServerSync = ({
  interviewId,
  children,
}: {
  interviewId: string;
  children: ReactNode;
}) => {
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

    // eslint-disable-next-line no-console
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

  if (!init) {
    return <div>Sync Loading (no init)...</div>;
  }

  return children;
};

export default ServerSync;

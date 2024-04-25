'use client';

import { debounce, isEqual } from 'lodash';
import { type ReactNode, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { SyncInterviewType } from '~/actions/interviews';
import usePrevious from '~/hooks/usePrevious';
import { getActiveSession } from '~/lib/interviewer/selectors/session';

// The job of ServerSync is to listen to actions in the redux store, and to sync
// data with the server.
const ServerSync = ({
  interviewId,
  children,
  serverSync,
}: {
  interviewId: string;
  children: ReactNode;
  serverSync: SyncInterviewType;
}) => {
  const [init, setInit] = useState(false);
  // Current stage
  const currentSession = useSelector(getActiveSession);
  const prevCurrentSession = usePrevious(currentSession);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSessionSync = useCallback(
    debounce(serverSync, 2000, {
      leading: true,
      trailing: true,
      maxWait: 10000,
    }),
    [serverSync],
  );

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

    debouncedSessionSync({
      id: interviewId,
      network: currentSession.network,
      currentStep: currentSession.currentStep ?? 0,
      stageMetadata: currentSession.stageMetadata, // Temporary storage used by tiestrengthcensus/dyadcensus to store negative responses
    });
  }, [
    currentSession,
    prevCurrentSession,
    interviewId,
    init,
    debouncedSessionSync,
  ]);

  if (!init) {
    return <div>Sync Loading (no init)...</div>;
  }

  return children;
};

export default ServerSync;

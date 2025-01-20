'use client';

import { debounce, isEqual } from 'es-toolkit';
import { omit } from 'es-toolkit/compat';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { SyncInterview } from '~/actions/interviews';
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
  serverSync: SyncInterview;
}) => {
  const [init, setInit] = useState(false);
  // Current stage
  const currentSession = useSelector(getActiveSession);
  const prevCurrentSession = usePrevious(currentSession);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSessionSync = useCallback(
    debounce(serverSync, 2000, {
      edges: ['trailing', 'leading'],
    }),
    [serverSync],
  );

  useEffect(() => {
    if (!init) {
      setInit(true);
      return;
    }

    if (
      isEqual(
        omit(currentSession, ['passphrase', 'encryptionEnabled']),
        omit(prevCurrentSession, ['passphrase', 'encryptionEnabled']),
      ) ||
      !currentSession ||
      !prevCurrentSession
    ) {
      console.log('no change');
      return;
    }

    console.log('syncing', currentSession);
    void debouncedSessionSync({
      id: interviewId,
      network: currentSession.network,
      currentStep: currentSession.currentStep,
      stageMetadata: currentSession.stageMetadata, // Temporary storage used by tiestrengthcensus/dyadcensus to store negative responses
      lastUpdated: currentSession.lastUpdated,
    });
  }, [
    currentSession,
    prevCurrentSession,
    interviewId,
    init,
    debouncedSessionSync,
  ]);

  return children;
};

export default ServerSync;

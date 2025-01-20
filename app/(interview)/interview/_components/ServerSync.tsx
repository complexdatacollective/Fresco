'use client';

import { debounce, isEqual } from 'es-toolkit';
import { omit } from 'es-toolkit/compat';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useToast } from '~/components/ui/use-toast';
import usePrevious from '~/hooks/usePrevious';
import { getActiveSession } from '~/lib/interviewer/selectors/session';
import { ensureError } from '~/utils/ensureError';

// The job of ServerSync is to listen to actions in the redux store, and to sync
// data with the server.
const ServerSync = () => {
  const [initialized, setInitialized] = useState(false);
  const params = useParams<{ interviewId: string }>();
  const currentSession = useSelector(getActiveSession);
  const prevCurrentSession = usePrevious(currentSession);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const syncSession = async (data) => {
    setLoading(true);

    try {
      const response = await fetch(`/interview/${params.interviewId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Try to get error message from response
        const errorData = await response.json();
        console.log(errorData);

        toast({
          title: 'Sync Error',
          description:
            'There was an error syncing your interview data with the server.',
          variant: 'destructive',
          duration: 3000,
        });

        return;
      }

      console.log('🚀 Interview synced with server!');
    } catch (err) {
      const error = ensureError(err).message;
      console.log(error);

      toast({
        title: 'Sync Error',
        description:
          'There was an error syncing your interview data with the server.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSessionSync = useCallback(
    debounce(syncSession, 2000, {
      edges: ['trailing', 'leading'],
    }),
    [syncSession],
  );

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
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
      return;
    }

    console.log('⏱️ Syncing interview with server...');
    void debouncedSessionSync({
      id: params.interviewId,
      network: currentSession.network,
      currentStep: currentSession.currentStep,
      stageMetadata: currentSession.stageMetadata, // Temporary storage used by tiestrengthcensus/dyadcensus to store negative responses
      lastUpdated: currentSession.lastUpdated,
    });
  }, [
    currentSession,
    prevCurrentSession,
    params.interviewId,
    initialized,
    debouncedSessionSync,
  ]);

  return null;
};

export default ServerSync;

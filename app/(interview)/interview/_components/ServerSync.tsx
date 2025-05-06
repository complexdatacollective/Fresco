/* eslint-disable no-console */
'use client';

import { type NcNetwork } from '@codaco/shared-consts';
import { debounce, isEqual } from 'es-toolkit';
import { omit } from 'es-toolkit/compat';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { type SyncInterview } from '~/actions/interviews';
import { useToast } from '~/components/ui/use-toast';
import usePrevious from '~/hooks/usePrevious';
import {
  StageMetadataSchema,
  type StageMetadata,
} from '~/lib/interviewer/ducks/modules/session';
import { getActiveSession } from '~/lib/interviewer/selectors/session';
import { ensureError } from '~/utils/ensureError';

// The job of ServerSync is to listen to actions in the redux store, and to sync
// data with the server.
const ServerSync = ({ syncInterview }: { syncInterview: SyncInterview }) => {
  const [initialized, setInitialized] = useState(false);
  const params = useParams<{ interviewId: string }>();
  const currentSession = useSelector(getActiveSession);
  const prevCurrentSession = usePrevious(currentSession);
  const [, setLoading] = useState(false);
  const { toast } = useToast();

  const syncSession = useCallback(
    async (data: {
      id: string;
      network: NcNetwork;
      currentStep: number;
      stageMetadata: StageMetadata | undefined;
      lastUpdated: string;
    }) => {
      console.log('⏱️ Syncing interview with server...');
      setLoading(true);

      try {
        StageMetadataSchema.optional().parse(data.stageMetadata);
        const result = await syncInterview(params.interviewId, data);

        if (result.error) {
          console.log(result.message);

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
    },
    [params.interviewId, syncInterview, toast],
  );

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
        omit(currentSession, [
          'promptIndex',
          'passphrase',
          'encryptionEnabled',
        ]),
        omit(prevCurrentSession, [
          'promptIndex',
          'passphrase',
          'encryptionEnabled',
        ]),
      ) ||
      !currentSession ||
      !prevCurrentSession
    ) {
      return;
    }
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

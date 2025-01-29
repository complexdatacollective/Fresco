'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import type { SyncInterviewType } from '~/actions/interviews';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import {
  SET_SERVER_SESSION,
  type SetServerSessionAction,
} from '~/lib/interviewer/ducks/modules/setServerSession';
import { store } from '~/lib/interviewer/store';
import type { getInterviewById } from '~/queries/interviews';
import ServerSync from './ServerSync';

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = ({
  interview,
  syncInterview,
}: {
  interview: Awaited<ReturnType<typeof getInterviewById>>;
  syncInterview: SyncInterviewType;
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

    // You can't store dates in the redux store, so we need to convert them.
    // If the date is already an ISOstring, we don't need to convert it.

    const toRequiredISOString = (date: string | Date): string => {
      if (date && date instanceof Date) {
        return date.toISOString();
      }
      return date;
    };

    const toOptionalISOString = (date: string | Date | null): string | null => {
      if (!date) return null;
      if (date instanceof Date) {
        return date.toISOString();
      }
      return date;
    };

    const serialisableServerSession = {
      ...serverSession,
      startTime: toRequiredISOString(serverSession.startTime),
      lastUpdated: toRequiredISOString(serverSession.lastUpdated),
      // optional - can be null
      finishTime: toOptionalISOString(serverSession.finishTime),
      exportTime: toOptionalISOString(serverSession.exportTime),
    };

    const serialisableProtocol = {
      ...protocol,
      importedAt: toRequiredISOString(protocol.importedAt),
      lastModified: toRequiredISOString(protocol.lastModified),
    };

    // If there's no current stage in the URL bar, set it.
    store.dispatch<SetServerSessionAction>({
      type: SET_SERVER_SESSION,
      payload: {
        protocol: serialisableProtocol,
        session: serialisableServerSession,
      },
    });

    setInitialized(true);
  }, [initialized, setInitialized, currentStage, setCurrentStage, interview]);

  if (!initialized || !interview) {
    return null;
  }

  return (
    <Provider store={store}>
      <ServerSync interviewId={interview.id} serverSync={syncInterview}>
        <ProtocolScreen />
      </ServerSync>
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

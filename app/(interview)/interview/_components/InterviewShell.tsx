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
import { Spinner } from '~/lib/ui/components';
import { type RouterOutputs } from '~/trpc/shared';

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = ({
  interview,
}: {
  interview: RouterOutputs['interview']['get']['byId'];
}) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('effect');
    if (initialized || !interview) {
      return;
    }

    const { protocol, ...serverSession } = interview;

    // If there's no current stage in the URL bar, set it.
    store.dispatch<SetServerSessionAction>({
      type: SET_SERVER_SESSION,
      payload: {
        protocol,
        session: serverSession,
      },
    });

    setInitialized(true);
  }, [interview, initialized, setInitialized]);

  if (!initialized || !interview) {
    return <Spinner />;
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

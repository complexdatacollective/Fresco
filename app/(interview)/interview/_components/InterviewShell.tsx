'use client';

import { Provider } from 'react-redux';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import { store } from '~/lib/interviewer/store';
import UserBanner from './UserBanner';
import { useEffect, useState } from 'react';
import { parseAsInteger, useQueryState } from 'next-usequerystate';
import type { Protocol } from '@codaco/shared-consts';
import type { ServerSession } from '../[interviewId]/page';
import {
  SET_SERVER_SESSION,
  type SetServerSessionAction,
} from '~/lib/interviewer/ducks/modules/setServerSession';

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = ({
  serverProtocol,
  serverSession,
}: {
  serverProtocol: Protocol;
  serverSession: ServerSession;
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.dispatch<SetServerSessionAction>({
      type: SET_SERVER_SESSION,
      payload: {
        protocol: serverProtocol,
        session: serverSession,
      },
    });
    setLoading(false);
  }, [serverSession, serverProtocol]);

  if (loading) {
    return 'Second loading stage...';
  }

  return (
    <Provider store={store}>
      <UserBanner />
      <ProtocolScreen />
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

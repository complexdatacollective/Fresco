'use client';

import { Provider, useSelector } from 'react-redux';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import { store } from '~/lib/interviewer/store';
import UserBanner from './UserBanner';
import { useEffect, useState } from 'react';
import type { Protocol } from '@codaco/shared-consts';
import type { ServerSession } from '../[interviewId]/page';
import {
  SET_SERVER_SESSION,
  type SetServerSessionAction,
} from '~/lib/interviewer/ducks/modules/setServerSession';
import { getStageIndex } from '~/lib/interviewer/selectors/session';
import { api } from '~/trpc/client';

// The job of ServerSync is to listen to actions in the redux store, and to sync
// data with the server.
const ServerSync = ({ interviewId }: { interviewId: string }) => {
  const [init, setInit] = useState(false);
  // Current stage
  const currentStage = useSelector(getStageIndex);
  const { mutate: updateStage } =
    api.interview.sync.updateStageIndex.useMutation();

  useEffect(() => {
    if (!init) {
      setInit(true);
      return;
    }

    console.log(`⬆️ Syncing stage index (${currentStage}) to server...`);
    updateStage({ interviewId, stageIndex: currentStage });
  }, [currentStage, updateStage, interviewId, init]);

  return null;
};

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = ({
  interviewID,
  serverProtocol,
  serverSession,
}: {
  interviewID: string;
  serverProtocol: Protocol;
  serverSession: ServerSession;
}) => {
  const [loading, setLoading] = useState(true);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (init) {
      return;
    }

    store.dispatch<SetServerSessionAction>({
      type: SET_SERVER_SESSION,
      payload: {
        protocol: serverProtocol,
        session: serverSession,
      },
    });
    setLoading(false);
    setInit(true);
  }, [serverSession, serverProtocol, init]);

  if (loading) {
    return 'Second loading stage...';
  }

  return (
    <Provider store={store}>
      <ServerSync interviewId={interviewID} />
      <UserBanner />
      <ProtocolScreen />
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

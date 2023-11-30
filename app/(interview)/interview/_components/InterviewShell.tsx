'use client';

import { parseAsInteger, useQueryState } from 'next-usequerystate';
import { useEffect, useRef } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import configureAppStore from '~/lib/interviewer/store';
import UserBanner from './UserBanner';
import { getActiveSession } from '~/lib/interviewer/selectors/session';
import { actionCreators as sessionActions } from '~/lib/interviewer/ducks/modules/session';
import { useSession } from '~/providers/SessionProvider';

const TestRedirect = () => {
  // const dispatch = useDispatch();

  const session = useSelector(getActiveSession);

  // const updateStage = (stage) =>
  //   dispatch(sessionActions.updateStage({ stageIndex: stage }));

  // Sync when session changes
  useEffect(() => {
    console.log('syncing sesssion with server...');
  }, [session]);

  return null;
};

const InterviewShell = ({ serverProtocol, serverSession }) => {
  const { session } = useSession();
  const store = useRef(
    configureAppStore({ protocol: serverProtocol, session: serverSession }),
  );

  return (
    <Provider store={store.current}>
      {session && <UserBanner />}
      <TestRedirect />
      <ProtocolScreen />
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

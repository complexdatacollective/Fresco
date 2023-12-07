'use client';

import { Provider } from 'react-redux';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import { store } from '~/lib/interviewer/store';
import UserBanner from './UserBanner';
import { useSession } from '~/providers/SessionProvider';

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = ({ serverProtocol, serverSession }) => {
  const { session } = useSession();

  return (
    <Provider store={store}>
      {session && <UserBanner />}
      <ProtocolScreen />
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

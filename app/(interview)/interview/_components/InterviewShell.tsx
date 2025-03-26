'use client';

import { Provider } from 'react-redux';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import { store } from '~/lib/interviewer/store';
import { type FetchInterviewReturnType } from '../[interviewId]/page';
import ServerSync from './ServerSync';

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = (props: {
  serverPayload: Awaited<FetchInterviewReturnType>;
}) => {
  return (
    <Provider store={store(props.serverPayload!)}>
      <ServerSync />
      <ProtocolScreen />
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

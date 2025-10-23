'use client';

import { Provider } from 'react-redux';
import SuperJSON from 'superjson';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import { store } from '~/lib/interviewer/store';
import { type GetInterviewByIdQuery } from '~/queries/interviews';

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = (props: {
  rawPayload: string; // superjson encoded interview
}) => {
  const decodedPayload = SuperJSON.parse<NonNullable<GetInterviewByIdQuery>>(
    props.rawPayload,
  );

  return (
    <Provider store={store(decodedPayload)}>
      <ProtocolScreen />
    </Provider>
  );
};

export default InterviewShell;

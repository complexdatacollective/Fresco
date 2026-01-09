'use client';

import { Provider } from 'react-redux';
import SuperJSON from 'superjson';
import { DndStoreProvider } from '~/lib/dnd';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import { store } from '~/lib/interviewer/store';
import { type GetInterviewByIdQuery } from '~/queries/interviews';

// The job of interview shell is to receive the server-side session and protocol
// and create a redux store with that data.
// Eventually it will handle syncing this data back.
const InterviewShell = (props: {
  rawPayload: string; // superjson encoded interview
  disableSync?: boolean; // Disable syncing to database (for preview mode)
}) => {
  const decodedPayload = SuperJSON.parse<NonNullable<GetInterviewByIdQuery>>(
    props.rawPayload,
  );

  return (
    <Provider store={store(decodedPayload, { disableSync: props.disableSync })}>
      <DndStoreProvider>
        <ProtocolScreen />
        <DialogManager />
      </DndStoreProvider>
    </Provider>
  );
};

export default InterviewShell;

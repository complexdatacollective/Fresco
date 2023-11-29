'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import configureAppStore from '~/lib/interviewer/store';
import { useInterview } from '~/providers/InterviewProvider';

const InterviewShell = () => {
  const { protocol, network, currentStageIndex } = useInterview();

  // I'm not sure this needs to be in a ref?
  const store = useRef(
    configureAppStore({ protocol, network, currentStageIndex }),
  );

  return (
    <Provider store={store.current}>
      <ProtocolScreen />
      <DialogManager />
    </Provider>
  );
};

export default InterviewShell;

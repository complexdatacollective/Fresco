'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { Provider } from 'react-redux';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import { SettingsMenu } from '~/lib/interviewer/components/SettingsMenu';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import configureAppStore from '~/lib/interviewer/store';
import { useInterview } from '~/providers/InterviewProvider';

const InterviewShell = () => {
  const { protocol, network, currentStageIndex } = useInterview();

  const store = useRef(
    configureAppStore({ protocol, network, currentStageIndex }),
  );

  return (
    <motion.div className="grid h-[100vh] grid-cols-2">
      <Provider store={store.current}>
        <ProtocolScreen />
        <SettingsMenu />
        <DialogManager />
      </Provider>
    </motion.div>
  );
};

export default InterviewShell;

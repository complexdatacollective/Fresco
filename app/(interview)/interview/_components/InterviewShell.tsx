'use client';

import { motion } from 'framer-motion';
import { Provider } from 'react-redux';
import DialogManager from '~/lib/interviewer/components/DialogManager';
import { SettingsMenu } from '~/lib/interviewer/components/SettingsMenu';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import configureAppStore from '~/lib/interviewer/store';
import { useInterview } from '~/providers/InterviewProvider';

const InterviewShell = () => {
  const { protocol, network, currentStageIndex } = useInterview();

  return (
    <motion.div className="grid h-[100vh] grid-cols-2">
      <Provider
        store={configureAppStore({ protocol, network, currentStageIndex })}
      >
        <ProtocolScreen />
        <SettingsMenu />
        <DialogManager />
      </Provider>
    </motion.div>
  );
};

export default InterviewShell;

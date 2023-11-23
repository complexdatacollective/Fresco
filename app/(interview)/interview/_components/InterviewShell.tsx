'use client';

import { motion } from 'framer-motion';
import { Provider } from 'react-redux';
import ProtocolScreen from '~/lib/interviewer/containers/ProtocolScreen';
import { store } from '~/lib/interviewer/store';

const InterviewShell = () => {
  return (
    <motion.div className="grid h-[100vh] grid-cols-2">
      <Provider store={store}>
        <ProtocolScreen stageIndex={0} />
      </Provider>
    </motion.div>
  );
};

export default InterviewShell;

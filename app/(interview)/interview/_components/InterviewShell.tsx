'use client';

import { motion } from 'framer-motion';
import { Provider } from 'react-redux';
import { store } from '~/lib/interviewer/ducks/store';
import { useInterview } from '~/providers/InterviewProvider';

const InterviewShell = () => {
  const { stageConfig } = useInterview();

  useEffect(() => {
    store.dispatch(deviceActions.deviceReady());
  }, []);

  return (
    <motion.div className="grid grid-cols-2">
      <Provider store={store}>
        <h1>Hello</h1>
      </Provider>
    </motion.div>
  );
};

export default InterviewShell;

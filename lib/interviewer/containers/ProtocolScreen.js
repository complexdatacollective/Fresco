import React from 'react';
import Stage from './Stage';
import { AnimatePresence, motion } from 'framer-motion';
import { getCurrentStage } from '../selectors/session';
import { useSelector } from 'react-redux';
import Navigation from '../components/Navigation';

const registerBeforeNext = () => {
  // console.log('TODO: implement registerBeforeNext lib/interviewer/containers/ProtocolScreen.js');
};

const onComplete = () => {
  // console.log('TODO: implement onComplete lib/interviewer/containers/ProtocolScreen.js');
};

const ProtocolScreen = () => {
  const currentStage = useSelector(getCurrentStage);

  if (!currentStage) {
    return null;
  }

  return (
    <motion.div className='flex flex-1 w-screen flex-row' initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Navigation />
      <AnimatePresence mode='wait' initial={false}>
        <Stage
          key={currentStage.id}
          stage={currentStage}
          registerBeforeNext={registerBeforeNext}
          onComplete={onComplete}
        />
      </AnimatePresence>
    </motion.div>
  )
}

export default ProtocolScreen;
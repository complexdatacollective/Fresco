import React from 'react';
import Stage from './Stage';
import { AnimatePresence, motion } from 'framer-motion';
import { useInterview } from '~/providers/InterviewProvider';
import { getProtocolStages } from '../selectors/protocol';
import { getSessionProgress } from '../selectors/session';
import { getSkipMap } from '../selectors/skip-logic';
import { useSelector } from 'react-redux';
import Navigation from '../components/Navigation';

const ProtocolScreen = () => {

  const {
    currentStageIndex,
    previousPage,
    nextPage,
    goToPage,
    registerBeforeNext,
    onComplete,
  } = useInterview();

  // "mapStateToProps"
  const protocolStages = useSelector(getProtocolStages);
  const stage = protocolStages[currentStageIndex] || {};
  const { percentProgress, currentPrompt: promptId } = useSelector(getSessionProgress);
  const skipMap = useSelector(getSkipMap); // TODO: move this to useInterview
  const isSkipped = (index) => skipMap[index].isSkipped;


  console.log('progress', percentProgress);

  return (
    <motion.div className='flex h-screen w-screen flex-row' initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Navigation />
      <AnimatePresence mode='wait' initial={false}>
        <Stage
          key={stage.id}
          stage={stage}
          promptId={promptId}
          stageIndex={currentStageIndex}
          registerBeforeNext={registerBeforeNext}
          onComplete={onComplete}
        />
      </AnimatePresence>
    </motion.div>
  )
}

export default ProtocolScreen;
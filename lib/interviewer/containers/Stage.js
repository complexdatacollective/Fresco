import React, { useCallback, useLayoutEffect } from 'react';
import getInterface from './Interfaces';
import StageErrorBoundary from '../components/StageErrorBoundary';
import { motion } from 'framer-motion';


const Stage = (props) => {
  const { stage, registerBeforeNext: register, ...rest } = props;

  const registerBeforeNext = useCallback((beforeNext) => register(
    beforeNext,
    stage.id,
  ), [register, stage.id]);

  useLayoutEffect(() => {
    return () => {
      register(null, stage.id)
    }
  }, [register, stage.id])

  const CurrentInterface = getInterface(stage.type);

  return (
    <motion.div
      className="flex-grow-1 basis-full"
      key={stage.id}
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        type: 'spring',
        damping: 20,
      }}>
      <StageErrorBoundary>
        {CurrentInterface
          && (
            <CurrentInterface
              registerBeforeNext={registerBeforeNext}
              stage={stage}
            />
          )}
      </StageErrorBoundary>
    </motion.div>
  );
}

export default Stage;

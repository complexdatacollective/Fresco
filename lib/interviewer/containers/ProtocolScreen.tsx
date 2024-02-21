'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import Navigation from '../components/Navigation';
import { getCurrentStage } from '../selectors/session';
import Stage from './Stage';
import { useNavigationHelpers } from '../hooks/useNavigationHelpers';
import { sessionAtom } from '~/providers/SessionProvider';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';

const ProtocolScreen = () => {
  const currentStage = useSelector(getCurrentStage);
  const session = useAtomValue(sessionAtom);

  // Maybe something like this?
  const beforeNextFunction = useRef(null);

  const registerBeforeNext = useCallback((fn) => {
    console.log('registerbeforeNext');
    beforeNextFunction.current = fn;
  }, []);

  useEffect(() => {
    console.log('resetting beforeNextFunction');
    beforeNextFunction.current = null;
  }, [currentStage]);

  const navigationHelpers = useNavigationHelpers(beforeNextFunction);

  // If current stage is null, we are waiting for the stage to be set
  if (!currentStage) {
    return <div>Waiting for stage to be set...</div>;
  }

  // TODO: If it is undefined, we have landed on an invalid stage. This should have been caught higher up the tree.

  return (
    <>
      {session && <FeedbackBanner />}
      <motion.div
        className="flex h-4/5 w-full flex-1 flex-row"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Navigation
          moveBackward={navigationHelpers.moveBackward}
          moveForward={navigationHelpers.moveForward}
          canMoveForward={navigationHelpers.canMoveForward}
          canMoveBackward={navigationHelpers.canMoveBackward}
          progress={navigationHelpers.progress}
          isReadyForNextStage={navigationHelpers.isReadyForNextStage}
        />
        {currentStage && (
          <Stage
            key={currentStage.id}
            stage={currentStage}
            registerBeforeNext={registerBeforeNext}
            setForceNavigationDisabled={
              navigationHelpers.setForceNavigationDisabled
            }
            navigationHelpers={navigationHelpers}
          />
        )}
        {!currentStage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 items-center justify-center"
            exit={{ opacity: 0 }}
          >
            Other loading?
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default ProtocolScreen;

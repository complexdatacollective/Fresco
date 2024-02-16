import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import Navigation from '../components/Navigation';
import { getCurrentStage } from '../selectors/session';
import Stage from './Stage';
import { useNavigationHelpers } from '../hooks/useNavigationHelpers';
import { useSession } from '~/providers/SessionProvider';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';

const ProtocolScreen = () => {
  const currentStage = useSelector(getCurrentStage);
  const { session } = useSession();

  const {
    moveBackward,
    canMoveForward,
    moveForward,
    canMoveBackward,
    progress,
    registerBeforeNext,
    isReadyForNextStage,
  } = useNavigationHelpers();

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
          moveBackward={moveBackward}
          moveForward={moveForward}
          canMoveForward={canMoveForward}
          canMoveBackward={canMoveBackward}
          progress={progress}
          isReadyForNextStage={isReadyForNextStage}
        />
        <AnimatePresence mode="wait" initial={false}>
          {currentStage && (
            <Stage
              key={currentStage.id}
              stage={currentStage}
              registerBeforeNext={registerBeforeNext}
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
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default ProtocolScreen;

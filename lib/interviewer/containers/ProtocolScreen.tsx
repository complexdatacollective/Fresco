import { AnimatePresence, motion } from 'framer-motion';
import { parseAsInteger, useQueryState } from 'next-usequerystate';
import { useSelector } from 'react-redux';
import Navigation from '../components/Navigation';
import { getCurrentStage } from '../selectors/session';
import Stage from './Stage';
import { useNavigationHelpers } from '../hooks/useNavigationHelpers';

const ProtocolScreen = () => {
  const currentStage = useSelector(getCurrentStage);
  const [currentStageNumber, setCurrentStageNumber] = useQueryState(
    'stage',
    parseAsInteger,
  );

  const {
    moveBackward,
    canMoveBackward,
    moveForward,
    canMoveForward,
    progress,
    registerBeforeNext,
    onComplete,
    isReadyForNextStage,
  } = useNavigationHelpers(currentStageNumber, setCurrentStageNumber);

  return (
    <motion.div
      className="flex w-full flex-1 flex-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Navigation
        moveBackward={moveBackward}
        canMoveBackward={canMoveBackward}
        moveForward={moveForward}
        canMoveForward={canMoveForward}
        progress={progress}
        isReadyForNextStage={isReadyForNextStage}
      />
      <AnimatePresence mode="wait" initial={false}>
        {currentStage && (
          <Stage
            key={currentStage.id}
            stage={currentStage}
            registerBeforeNext={registerBeforeNext}
            onComplete={onComplete}
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
  );
};

export default ProtocolScreen;

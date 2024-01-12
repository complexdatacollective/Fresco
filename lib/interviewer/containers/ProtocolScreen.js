import { AnimatePresence, motion } from 'framer-motion';
import { parseAsInteger, useQueryState } from 'next-usequerystate';
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Navigation, { useNavigationHelpers } from '../components/Navigation';
import { getCurrentStage } from '../selectors/session';
import Stage from './Stage';
import { get } from '../utils/lodash-replacements';

const ProtocolScreen = () => {
  const beforeNextFunctions = useRef({});
  const currentStage = useSelector(getCurrentStage);
  const [pendingDirection, setPendingDirection] = useState(1);
  const [currentStageNumber, setCurrentStageNumber] = useQueryState(
    'stage',
    parseAsInteger,
  );

  const { moveBackward, moveForward } = useNavigationHelpers(
    currentStageNumber,
    setCurrentStageNumber,
  );

  const onComplete = (directionOverride) => {
    console.log('onComplete', directionOverride);
    const nextDirection = directionOverride || pendingDirection;
    const beforeNext = get(beforeNextFunctions, currentStage?.id);

    if (nextDirection >= currentStageNumber) {
      if (!beforeNext) {
        moveForward();
      } else {
        beforeNext(nextDirection);
      }
    } else {
      moveBackward();
    }

    setPendingDirection(1);
  };

  const registerBeforeNext = (beforeNext) => {
    console.log('registerbeforenext', currentStage.id);

    if (beforeNext === null || !currentStage.id) return;

    // Ignore if function already exists
    if (beforeNextFunctions.current[currentStage.id]) return;

    beforeNextFunctions.current = { ...beforeNextFunctions.current, [currentStage.id]: beforeNext };
  };

  console.log('beforeNextFunctions', beforeNextFunctions.current);

  return (
    <motion.div
      className="flex h-full w-full flex-1 flex-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Navigation />
      <AnimatePresence mode="wait" initial={false}>
        {currentStage && (
          <Stage
            key={currentStage.id}
            stage={currentStage}
            registerBeforeNext={registerBeforeNext}
            onComplete={onComplete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProtocolScreen;

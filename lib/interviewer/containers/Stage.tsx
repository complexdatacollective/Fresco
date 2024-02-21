import getInterface from './Interfaces';
import StageErrorBoundary from '../components/StageErrorBoundary';
import { motion } from 'framer-motion';
import type { directions } from '../hooks/useNavigationHelpers';
import { type ElementType } from 'react';

type StageProps = {
  stage: {
    id: string;
    type: string;
  };
  registerBeforeNext: (fn: (direction: directions) => Promise<boolean>) => void;
  setForceNavigationDisabled: (value: boolean) => void;
};

const Stage = (props: StageProps) => {
  const {
    stage,
    registerBeforeNext,
    setForceNavigationDisabled,
    navigationHelpers,
  } = props;
  const CurrentInterface = getInterface(
    stage.type,
  ) as unknown as ElementType<StageProps>;

  const handleAnimationStart = () => {
    setForceNavigationDisabled(true);
  };
  const handleAnimationComplete = () => {
    setForceNavigationDisabled(false);
  };

  return (
    <motion.div
      id="stage"
      className="flex-grow-1 relative basis-full overflow-hidden"
      key={stage.id}
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
        transition: {
          duration: 1,
        },
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.1,
        },
      }}
      onAnimationStart={handleAnimationStart}
      onAnimationComplete={handleAnimationComplete}
    >
      <StageErrorBoundary>
        {CurrentInterface && (
          <CurrentInterface
            setForceNavigationDisabled={setForceNavigationDisabled}
            registerBeforeNext={registerBeforeNext}
            stage={stage}
            navigationHelpers={navigationHelpers}
          />
        )}
      </StageErrorBoundary>
    </motion.div>
  );
};

export default Stage;

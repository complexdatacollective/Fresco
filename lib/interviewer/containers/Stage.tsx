import getInterface from './Interfaces';
import StageErrorBoundary from '../components/StageErrorBoundary';
import { motion } from 'framer-motion';
import type { directions } from '../hooks/useNavigationHelpers';
<<<<<<< HEAD
import { useNavigationHelpers } from '../hooks/useNavigationHelpers';
=======
import { type ElementType } from 'react';
>>>>>>> 862f622f0098fe3ded3a97916259972e6b30b905

type StageProps = {
  stage: {
    id: string;
    type: string;
  };
  registerBeforeNext: (fn: (direction: directions) => Promise<boolean>) => void;
};

const Stage = (props: StageProps) => {
  const { stage, registerBeforeNext } = props;
  const CurrentInterface = getInterface(
    stage.type,
  ) as unknown as ElementType<StageProps>;

  const { setIsAnimating } = useNavigationHelpers();

  const handleAnimationStart = () => {
    setIsAnimating(true);
  };
  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

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
      }}
      onAnimationStart={handleAnimationStart}
      onAnimationComplete={handleAnimationComplete}
    >
      <StageErrorBoundary>
        {CurrentInterface && (
          <CurrentInterface
            registerBeforeNext={registerBeforeNext}
            stage={stage}
          />
        )}
      </StageErrorBoundary>
    </motion.div>
  );
};

export default Stage;

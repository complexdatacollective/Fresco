'use client';
'use no memo';

import { AnimatePresence, motion } from 'motion/react';
import { Provider } from 'react-redux';
import SuperJSON from 'superjson';
import useMediaQuery from '~/hooks/useMediaQuery';
import StageErrorBoundary from '~/lib/interviewer/components/StageErrorBoundary';
import Navigation from '~/lib/interviewer/components/Navigation';
import useInterviewNavigation from '~/lib/interviewer/hooks/useInterviewNavigation';
import { store } from '~/lib/interviewer/store';
import { type GetInterviewByIdQuery } from '~/queries/interviews';
import { cx } from '~/utils/cva';

const variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: { when: 'beforeChildren' },
  },
  exit: {
    opacity: 0,
    transition: { when: 'afterChildren' },
  },
};

function Interview() {
  const {
    stage,
    currentStep,
    CurrentInterface,
    showStage,
    registerBeforeNext,
    getNavigationHelpers,
    handleExitComplete,
    moveForward,
    moveBackward,
    disableMoveForward,
    disableMoveBackward,
    pulseNext,
    progress,
  } = useInterviewNavigation();

  const isPortraitAspectRatio = useMediaQuery('(max-aspect-ratio: 3/4)');
  const navigationOrientation = isPortraitAspectRatio
    ? 'horizontal'
    : 'vertical';

  return (
    <div
      className={cx(
        'relative flex size-full flex-1 overflow-hidden',
        isPortraitAspectRatio ? 'flex-col' : 'flex-row-reverse',
      )}
    >
      <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
        {showStage && stage && (
          <motion.div
            key={currentStep}
            className="flex min-h-0 flex-1"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
          >
            <div
              className="flex size-full flex-col items-center"
              id="stage"
              key={stage.id}
            >
              <StageErrorBoundary>
                {CurrentInterface && (
                  <CurrentInterface
                    key={stage.id}
                    registerBeforeNext={registerBeforeNext}
                    stage={stage}
                    getNavigationHelpers={getNavigationHelpers}
                  />
                )}
              </StageErrorBoundary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Navigation
        moveBackward={moveBackward}
        moveForward={moveForward}
        disableMoveForward={disableMoveForward}
        disableMoveBackward={disableMoveBackward}
        pulseNext={pulseNext}
        progress={progress}
        orientation={navigationOrientation}
      />
    </div>
  );
}

const InterviewShell = (props: {
  rawPayload: string;
  disableSync?: boolean;
}) => {
  const decodedPayload = SuperJSON.parse<NonNullable<GetInterviewByIdQuery>>(
    props.rawPayload,
  );

  return (
    <Provider store={store(decodedPayload, { disableSync: props.disableSync })}>
      <Interview />
    </Provider>
  );
};

export default InterviewShell;

'use client';
'use no memo';

import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';
import { Provider } from 'react-redux';
import DialogProvider from '~/lib/dialogs/DialogProvider';
import useMediaQuery from '~/hooks/useMediaQuery';
import { InterviewToastProvider } from '~/lib/interviewer/components/InterviewToast';
import Navigation from '~/lib/interviewer/components/Navigation';
import StageErrorBoundary from '~/lib/interviewer/components/StageErrorBoundary';
import { ContractProvider } from '~/lib/interviewer/contract/context';
import type {
  AssetRequestHandler,
  FinishHandler,
  InterviewPayload,
  InterviewerFlags,
  SyncHandler,
} from '~/lib/interviewer/contract/types';
import { StageMetadataProvider } from '~/lib/interviewer/contexts/StageMetadataContext';
import useInterviewNavigation from '~/lib/interviewer/hooks/useInterviewNavigation';
import { store } from '~/lib/interviewer/store';
import { cx } from '~/utils/cva';

const variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { when: 'beforeChildren', duration: 0.5 },
  },
  exit: {
    opacity: 0,
    transition: { when: 'afterChildren', duration: 0.5 },
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

  const forwardButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

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
      <StageMetadataProvider value={registerBeforeNext}>
        <InterviewToastProvider
          forwardButtonRef={forwardButtonRef}
          backButtonRef={backButtonRef}
          orientation={navigationOrientation}
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
                  className="flex size-full flex-col items-center justify-center"
                  id="stage"
                  key={stage.id}
                >
                  <StageErrorBoundary>
                    {CurrentInterface && (
                      <CurrentInterface
                        key={stage.id}
                        stage={stage}
                        getNavigationHelpers={getNavigationHelpers}
                      />
                    )}
                  </StageErrorBoundary>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </InterviewToastProvider>
      </StageMetadataProvider>
      <Navigation
        moveBackward={moveBackward}
        moveForward={moveForward}
        disableMoveForward={disableMoveForward}
        disableMoveBackward={disableMoveBackward}
        pulseNext={pulseNext}
        progress={progress}
        orientation={navigationOrientation}
        forwardButtonRef={forwardButtonRef}
        backButtonRef={backButtonRef}
      />
    </div>
  );
}

type InterviewShellProps = {
  payload: InterviewPayload;
  onSync: SyncHandler;
  onFinish: FinishHandler;
  onRequestAsset: AssetRequestHandler;
  flags?: InterviewerFlags;
};

const InterviewShell = ({
  payload,
  onSync,
  onFinish,
  onRequestAsset,
  flags,
}: InterviewShellProps) => {
  return (
    <Provider store={store(payload, { onSync })}>
      <ContractProvider
        onFinish={onFinish}
        onRequestAsset={onRequestAsset}
        flags={flags}
      >
        <DialogProvider>
          <Interview />
        </DialogProvider>
      </ContractProvider>
    </Provider>
  );
};

export default InterviewShell;

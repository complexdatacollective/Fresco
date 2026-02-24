'use client';

import { type Stage } from '@codaco/protocol-validation';
import { type Store } from '@reduxjs/toolkit';
import { AnimatePresence, motion } from 'motion/react';
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Provider, useSelector } from 'react-redux';
import useMediaQuery from '~/hooks/useMediaQuery';
import Information from '~/lib/interviewer/Interfaces/Information';
import { InterviewToastProvider } from '~/lib/interviewer/components/InterviewToast';
import Navigation from '~/lib/interviewer/components/Navigation';
import { StageMetadataProvider } from '~/lib/interviewer/contexts/StageMetadataContext';
import { formIsReady } from '~/lib/interviewer/ducks/modules/ui';
import { type StoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import { cx } from '~/utils/cva';
import { InterviewNavigationBridge } from './interview-navigation-bridge';

type StoryState = {
  session: { promptIndex?: number; currentStep: number };
  protocol: { stages: unknown[] };
};

const stageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { when: 'beforeChildren' as const } },
  exit: { opacity: 0 },
};

/**
 * Inner content component that lives inside <Provider>, so it can use
 * useSelector to reactively read FORM_IS_READY from the Redux store.
 *
 * Previously we used store.subscribe() in the parent, but React runs child
 * effects before parent effects — so child dispatches (e.g. updateReady(true))
 * were missed by the subscription.
 */
function StoryShellContent<S extends StoryState>({
  store,
  nav,
  stages,
  mainStageIndex,
  children,
}: {
  store: Store<S>;
  nav: StoryNavigation;
  stages: Stage[];
  mainStageIndex: number;
  children: ReactNode;
}) {
  const forwardButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const pulseNext = useSelector(formIsReady);

  // Two-phase rendering: start with no child in AnimatePresence, then flip
  // to true so the child "enters" with a proper animation. This matches the
  // real InterviewShell and ensures NodeList's onAnimationComplete fires.
  const [showStage, setShowStage] = useState(false);

  useLayoutEffect(() => {
    setShowStage(true);
  }, []);

  const [storyState, setStoryState] = useState(() => {
    const state = store.getState();
    return {
      currentStep: state.session.currentStep,
      promptIndex: state.session.promptIndex ?? 0,
    };
  });

  useEffect(() => {
    return store.subscribe(() => {
      const state = store.getState();
      setStoryState({
        currentStep: state.session.currentStep,
        promptIndex: state.session.promptIndex ?? 0,
      });
    });
  }, [store]);

  const { currentStep } = storyState;
  const totalStages = stages.length;
  const progress = ((currentStep + 1) / totalStages) * 100;
  const helpers = nav.getNavigationHelpers();

  const isPortraitAspectRatio = useMediaQuery('(max-aspect-ratio: 3/4)');
  const navigationOrientation = isPortraitAspectRatio
    ? 'horizontal'
    : 'vertical';

  const renderContent = () => {
    if (currentStep === mainStageIndex) {
      return children;
    }

    const stage = stages[currentStep];
    if (stage?.type === 'Information') {
      return (
        <div
          id="stage"
          className="relative flex size-full flex-col items-center"
        >
          <Information
            stage={stage}
            getNavigationHelpers={nav.getNavigationHelpers}
          />
        </div>
      );
    }

    return children;
  };

  return (
    <StageMetadataProvider value={nav.registerBeforeNext}>
      <div
        className={cx(
          'relative flex size-full flex-1 overflow-hidden',
          isPortraitAspectRatio ? 'flex-col' : 'flex-row-reverse',
        )}
      >
        <InterviewToastProvider
          forwardButtonRef={forwardButtonRef}
          backButtonRef={backButtonRef}
          orientation={navigationOrientation}
        >
          <AnimatePresence mode="wait">
            {showStage && (
              <motion.div
                key={currentStep}
                className="flex min-h-0 flex-1"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={stageVariants}
              >
                {renderContent()}
              </motion.div>
            )}
          </AnimatePresence>
        </InterviewToastProvider>
        <Navigation
          moveBackward={() => void helpers.moveBackward()}
          moveForward={() => void helpers.moveForward()}
          disableMoveForward={false}
          disableMoveBackward={currentStep <= 0 && storyState.promptIndex <= 0}
          pulseNext={pulseNext}
          progress={progress}
          orientation={navigationOrientation}
          forwardButtonRef={forwardButtonRef}
          backButtonRef={backButtonRef}
        />
      </div>
      <InterviewNavigationBridge store={store} storyNavigation={nav} />
    </StageMetadataProvider>
  );
}

export function InterviewStoryShell<S extends StoryState>({
  store,
  nav,
  stages,
  mainStageIndex,
  children,
}: {
  store: Store<S>;
  nav: StoryNavigation;
  stages: Stage[];
  mainStageIndex: number;
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full">
      <Provider store={store}>
        <StoryShellContent
          store={store}
          nav={nav}
          stages={stages}
          mainStageIndex={mainStageIndex}
        >
          {children}
        </StoryShellContent>
      </Provider>
    </div>
  );
}

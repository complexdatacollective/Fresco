'use client';

import { type Stage } from '@codaco/protocol-validation';
import { type Store } from '@reduxjs/toolkit';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import useMediaQuery from '~/hooks/useMediaQuery';
import Information from '~/lib/interviewer/Interfaces/Information';
import { InterviewToastProvider } from '~/lib/interviewer/components/InterviewToast';
import Navigation from '~/lib/interviewer/components/Navigation';
import { StageMetadataProvider } from '~/lib/interviewer/contexts/StageMetadataContext';
import { type StoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import { cx } from '~/utils/cva';
import { InterviewNavigationBridge } from './interview-navigation-bridge';

type StoryState = {
  session: { promptIndex?: number; currentStep: number };
  protocol: { stages: unknown[] };
};

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
  const forwardButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const [sessionState, setSessionState] = useState(() => {
    const s = store.getState().session;
    return { currentStep: s.currentStep, promptIndex: s.promptIndex ?? 0 };
  });

  useEffect(() => {
    return store.subscribe(() => {
      const s = store.getState().session;
      setSessionState({
        currentStep: s.currentStep,
        promptIndex: s.promptIndex ?? 0,
      });
    });
  }, [store]);

  const { currentStep } = sessionState;
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
    <Provider store={store}>
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
            <div className="flex min-h-0 flex-1">{renderContent()}</div>
          </InterviewToastProvider>
          <Navigation
            moveBackward={() => void helpers.moveBackward()}
            moveForward={() => void helpers.moveForward()}
            disableMoveForward={false}
            disableMoveBackward={
              currentStep <= 0 && sessionState.promptIndex <= 0
            }
            pulseNext={false}
            progress={progress}
            orientation={navigationOrientation}
            forwardButtonRef={forwardButtonRef}
            backButtonRef={backButtonRef}
          />
        </div>
        <InterviewNavigationBridge store={store} storyNavigation={nav} />
      </StageMetadataProvider>
    </Provider>
  );
}

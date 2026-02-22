'use client';

import { type Stage } from '@codaco/protocol-validation';
import { type Store } from '@reduxjs/toolkit';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import Information from '~/lib/interviewer/Interfaces/Information';
import { InterviewToastProvider } from '~/lib/interviewer/components/InterviewToast';
import Navigation from '~/lib/interviewer/components/Navigation';
import { StageMetadataProvider } from '~/lib/interviewer/contexts/StageMetadataContext';
import { type StoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
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
        <div className="relative flex size-full flex-1 flex-row-reverse overflow-hidden">
          <InterviewToastProvider
            forwardButtonRef={forwardButtonRef}
            backButtonRef={backButtonRef}
            orientation="vertical"
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
            orientation="vertical"
            forwardButtonRef={forwardButtonRef}
            backButtonRef={backButtonRef}
          />
        </div>
        <InterviewNavigationBridge store={store} storyNavigation={nav} />
      </StageMetadataProvider>
    </Provider>
  );
}

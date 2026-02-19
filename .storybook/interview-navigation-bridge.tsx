'use client';

import { useEffect, useRef } from 'react';
import { addons } from 'storybook/preview-api';
import {
  type PromptNavigableStore,
  type StoryNavigation,
} from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import { EVENTS, type PromptState } from './interview-navigation-events';

function getStagePromptCount(stage: unknown): number {
  if (
    typeof stage === 'object' &&
    stage !== null &&
    'prompts' in stage &&
    Array.isArray(stage.prompts)
  ) {
    return stage.prompts.length;
  }
  return 1;
}

function getPromptState(store: PromptNavigableStore): PromptState {
  const s = store.getState();
  const stage = s.protocol.stages[s.session.currentStep];
  return {
    promptIndex: s.session.promptIndex ?? 0,
    promptCount: getStagePromptCount(stage),
  };
}

/**
 * Invisible bridge between a Redux store + StoryNavigation and the
 * Storybook toolbar addon channel. Emits prompt state updates and listens
 * for navigation commands from the toolbar.
 *
 * For static stories (Sociogram/Narrative), this is rendered by the global
 * decorator in preview.tsx. For dynamic stories (NameGenerator), render it
 * directly inside the wrapper component.
 */
export function InterviewNavigationBridge({
  store,
  storyNavigation,
}: {
  store: PromptNavigableStore;
  storyNavigation: StoryNavigation;
}) {
  const navRef = useRef(storyNavigation);
  navRef.current = storyNavigation;

  useEffect(() => {
    const channel = addons.getChannel();

    channel.emit(EVENTS.PROMPT_STATE, getPromptState(store));

    const unsubscribe = store.subscribe(() => {
      channel.emit(EVENTS.PROMPT_STATE, getPromptState(store));
    });

    const handleForward = () => {
      const helpers = navRef.current.getNavigationHelpers();
      void helpers.moveForward();
    };
    const handleBackward = () => {
      const helpers = navRef.current.getNavigationHelpers();
      void helpers.moveBackward();
    };
    const handleLeave = () => {
      void navRef.current.simulateLeaveStage();
    };

    channel.on(EVENTS.NAV_FORWARD, handleForward);
    channel.on(EVENTS.NAV_BACKWARD, handleBackward);
    channel.on(EVENTS.LEAVE_STAGE, handleLeave);

    return () => {
      unsubscribe();
      channel.off(EVENTS.NAV_FORWARD, handleForward);
      channel.off(EVENTS.NAV_BACKWARD, handleBackward);
      channel.off(EVENTS.LEAVE_STAGE, handleLeave);
    };
  }, [store]);

  return null;
}

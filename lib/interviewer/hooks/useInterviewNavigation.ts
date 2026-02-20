'use client';

import { invariant } from 'es-toolkit';
import { parseAsInteger, useQueryState } from 'nuqs';
import {
  type ElementType,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type {
  BeforeNextFunction,
  Direction,
  RegisterBeforeNext,
  StageProps,
} from '~/lib/interviewer/types';
import {
  updatePrompt,
  updateStage,
} from '~/lib/interviewer/ducks/modules/session';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import getInterface from '~/lib/interviewer/Interfaces';
import {
  getCurrentStage,
  getNavigationInfo,
  getPromptCount,
  getStageCount,
} from '~/lib/interviewer/selectors/session';
import { getNavigableStages } from '~/lib/interviewer/selectors/skip-logic';
import { calculateProgress } from '~/lib/interviewer/selectors/utils';

export default function useInterviewNavigation() {
  const dispatch = useDispatch();

  // State
  const [queryStep, setQueryStep] = useQueryState(
    'step',
    parseAsInteger.withOptions({ history: 'push' }),
  );
  const [forceNavigationDisabled, setForceNavigationDisabled] = useState(false);

  // Two-phase navigation state.
  // Starts false so that AnimatePresence sees the first child as "entering"
  // rather than "appearing", which enables variant propagation to descendants.
  const [showStage, setShowStage] = useState(false);
  const pendingStepRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);

  // Show the stage on mount (before paint so there's no visual delay).
  useLayoutEffect(() => {
    setShowStage(true);
  }, []);

  // Selectors
  const stage = useSelector(getCurrentStage);
  const CurrentInterface = stage
    ? (getInterface(stage.type) as ElementType<StageProps>)
    : null;

  const { isReady: isReadyForNextStage } = useReadyForNextStage();
  const { currentStep, isLastPrompt, isFirstPrompt, promptIndex } =
    useSelector(getNavigationInfo);
  const { nextValidStageIndex, previousValidStageIndex, isCurrentStepValid } =
    useSelector(getNavigableStages);
  const stageCount = useSelector(getStageCount);
  const promptCount = useSelector(getPromptCount);

  // Refs to avoid stale closures in navigation callbacks
  const nextValidStageIndexRef = useRef(nextValidStageIndex);
  const previousValidStageIndexRef = useRef(previousValidStageIndex);

  useEffect(() => {
    nextValidStageIndexRef.current = nextValidStageIndex;
  }, [nextValidStageIndex]);

  useEffect(() => {
    previousValidStageIndexRef.current = previousValidStageIndex;
  }, [previousValidStageIndex]);

  const [progress, setProgress] = useState(
    calculateProgress(currentStep, stageCount, promptIndex, promptCount),
  );

  useEffect(() => {
    setProgress(
      calculateProgress(currentStep, stageCount, promptIndex, promptCount),
    );
  }, [currentStep, stageCount, promptIndex, promptCount]);

  // beforeNext registration (multiple keyed handlers)
  const beforeNextHandlers = useRef(new Map<string, BeforeNextFunction>());
  const registerBeforeNext: RegisterBeforeNext = useCallback(
    (
      ...args: [BeforeNextFunction | null] | [string, BeforeNextFunction | null]
    ) => {
      if (args.length === 1) {
        const [fn] = args;
        if (fn === null) {
          beforeNextHandlers.current.clear();
        } else {
          beforeNextHandlers.current.set('default', fn);
        }
      } else {
        const [key, fn] = args;
        if (fn === null) {
          beforeNextHandlers.current.delete(key);
        } else {
          beforeNextHandlers.current.set(key, fn);
        }
      }
    },
    [],
  ) as RegisterBeforeNext;

  /**
   * Before navigation is allowed, we iterate all registered beforeNext handlers
   * in insertion order. If any returns false, navigation is blocked. If any
   * returns 'FORCE' (and none returned false), the prompt boundary is skipped.
   */
  const canNavigate = async (direction: Direction) => {
    const handlers = beforeNextHandlers.current;
    if (handlers.size === 0) {
      return true;
    }

    let hasForce = false;
    for (const fn of handlers.values()) {
      const result = await fn(direction);

      invariant(
        result === true || result === false || result === 'FORCE',
        `beforeNextFunction must return a boolean or the string 'FORCE'`,
      );

      if (result === false) {
        return false;
      }
      if (result === 'FORCE') {
        hasForce = true;
      }
    }

    return hasForce ? 'FORCE' : true;
  };

  const moveForward = useCallback(async () => {
    if (isTransitioningRef.current) return;
    setForceNavigationDisabled(true);

    await (async () => {
      const stageAllowsNavigation = await canNavigate('forwards');

      if (!stageAllowsNavigation) {
        return;
      }

      // Advance the prompt if we're not at the last one.
      if (stageAllowsNavigation !== 'FORCE' && !isLastPrompt) {
        dispatch(updatePrompt(promptIndex + 1));
        return;
      }

      // From this point on we are definitely navigating stages
      const fakeProgress = calculateProgress(
        nextValidStageIndexRef.current,
        stageCount,
        0,
        promptCount,
      );
      setProgress(fakeProgress);
      registerBeforeNext(null);

      void setQueryStep(nextValidStageIndexRef.current);
    })();

    setForceNavigationDisabled(false);
  }, [
    dispatch,
    isLastPrompt,
    promptIndex,
    registerBeforeNext,
    stageCount,
    promptCount,
    setQueryStep,
  ]);

  const moveBackward = useCallback(async () => {
    if (isTransitioningRef.current) return;
    setForceNavigationDisabled(true);

    await (async () => {
      const stageAllowsNavigation = await canNavigate('backwards');

      if (!stageAllowsNavigation) {
        return;
      }

      if (stageAllowsNavigation !== 'FORCE' && !isFirstPrompt) {
        dispatch(updatePrompt(promptIndex - 1));
        return;
      }

      const fakeProgress = calculateProgress(
        previousValidStageIndexRef.current,
        stageCount,
        0,
        promptCount,
      );
      setProgress(fakeProgress);
      registerBeforeNext(null);
      void setQueryStep(previousValidStageIndexRef.current);
    })();

    setForceNavigationDisabled(false);
  }, [
    setQueryStep,
    dispatch,
    isFirstPrompt,
    promptIndex,
    registerBeforeNext,
    stageCount,
    promptCount,
  ]);

  const getNavigationHelpers = useCallback(
    () => ({
      moveForward,
      moveBackward,
    }),
    [moveForward, moveBackward],
  );

  const handleExitComplete = useCallback(() => {
    const target = pendingStepRef.current;
    if (target === null) return;

    // Clear any stale beforeNext handlers that were re-registered by the
    // exiting stage during its exit animation renders. Without this,
    // interfaces that call registerBeforeNext() during render (e.g.
    // DyadCensus, EgoForm, SlidesForm) leave behind handlers with stale
    // closures that block navigation on the incoming stage.
    beforeNextHandlers.current.clear();

    dispatch(updateStage(target));
    pendingStepRef.current = null;
    setShowStage(true);
    isTransitioningRef.current = false;
  }, [dispatch]);

  // Initialize URL step param on first load
  useEffect(() => {
    if (queryStep === null) {
      void setQueryStep(currentStep, { history: 'replace' });
    }
  }, [queryStep, currentStep, setQueryStep]);

  // Two-phase navigation: when URL changes, start exit animation.
  // Redux currentStep is NOT updated here — it's deferred to handleExitComplete.
  useEffect(() => {
    if (queryStep !== null && queryStep !== currentStep) {
      pendingStepRef.current = queryStep;
      if (!isTransitioningRef.current) {
        isTransitioningRef.current = true;
        setShowStage(false);
      }
    }
  }, [queryStep, currentStep]);

  // If the current stage should be skipped, move to the previous valid stage.
  useEffect(() => {
    if (!isCurrentStepValid) {
      // eslint-disable-next-line no-console
      console.log(
        '⚠️ Invalid stage! Moving you to the previous valid stage...',
      );
      void setQueryStep(previousValidStageIndex, { history: 'replace' });
    }
  }, [setQueryStep, isCurrentStepValid, previousValidStageIndex]);

  const { canMoveForward, canMoveBackward } = useSelector(getNavigationInfo);

  return {
    // Stage rendering
    stage,
    currentStep,
    CurrentInterface,
    showStage,
    registerBeforeNext,
    getNavigationHelpers,
    handleExitComplete,

    // Navigation controls
    moveForward,
    moveBackward,
    disableMoveForward:
      forceNavigationDisabled || !showStage || !canMoveForward,
    disableMoveBackward:
      forceNavigationDisabled ||
      !showStage ||
      (!canMoveBackward && beforeNextHandlers.current.size === 0),
    pulseNext: isReadyForNextStage,
    progress,
  };
}

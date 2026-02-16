'use client';
'use no memo';

import { invariant } from 'es-toolkit';
import { AnimatePresence, motion } from 'motion/react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useMediaQuery from '~/hooks/useMediaQuery';
import { cx } from '~/utils/cva';
import { updatePrompt, updateStage } from '../ducks/modules/session';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import {
  getCurrentStage,
  getNavigationInfo,
  getPromptCount,
  getStageCount,
} from '../selectors/session';
import { getNavigableStages } from '../selectors/skip-logic';
import { calculateProgress } from '../selectors/utils';
import Navigation from './Navigation';
import Stage from './Stage';

export type Direction = 'forwards' | 'backwards';

export type BeforeNextFunction = (
  direction: Direction,
) => Promise<boolean | 'FORCE'> | boolean | 'FORCE';

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

export default function ProtocolScreen() {
  const dispatch = useDispatch();

  // State
  const [queryStep, setQueryStep] = useQueryState(
    'step',
    parseAsInteger.withOptions({ history: 'push' }),
  );
  const [forceNavigationDisabled, setForceNavigationDisabled] = useState(false);

  // Two-phase navigation state
  const [showStage, setShowStage] = useState(true);
  const pendingStepRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);

  // Selectors
  const stage = useSelector(getCurrentStage); // null = loading, undefined = not found

  const { isReady: isReadyForNextStage } = useReadyForNextStage();
  const { currentStep, isLastPrompt, isFirstPrompt, promptIndex } =
    useSelector(getNavigationInfo);
  const { nextValidStageIndex, previousValidStageIndex, isCurrentStepValid } =
    useSelector(getNavigableStages);
  const stageCount = useSelector(getStageCount);
  const promptCount = useSelector(getPromptCount);

  // Refs
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

  // Refs
  const beforeNextFunction = useRef<BeforeNextFunction | null>(null);
  const registerBeforeNext = useCallback((fn: BeforeNextFunction | null) => {
    beforeNextFunction.current = fn;
  }, []);

  /**
   * Before navigation is allowed, we check if there is a beforeNextFunction
   * and if it exists we evaluate it and use the return value to determine if
   * navigation continues. This allows stages to 'hijack' the navigation
   * process and prevent navigation if necessary.
   */
  const canNavigate = async (direction: Direction) => {
    if (!beforeNextFunction.current) {
      return true;
    }

    const beforeNextResult = await beforeNextFunction.current(direction);

    // Throw an error if beforeNextFunction returns an invalid value
    invariant(
      beforeNextResult === true ||
        beforeNextResult === false ||
        beforeNextResult === 'FORCE',
      `beforeNextFunction must return a boolean or the string 'FORCE'`,
    );

    return beforeNextResult;
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

      // from this point on we are definitely navigating, so set up the animation
      const fakeProgress = calculateProgress(
        nextValidStageIndexRef.current,
        stageCount,
        0,
        promptCount,
      );
      setProgress(fakeProgress);
      // If the result is true or 'FORCE' we can reset the function here:
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

      // Advance the prompt if we're not at the last one.
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

  // Two-phase navigation: when URL changes, start exit animation
  // Redux currentStep is NOT updated here — it's deferred to handleExitComplete
  useEffect(() => {
    if (queryStep !== null && queryStep !== currentStep) {
      pendingStepRef.current = queryStep;
      if (!isTransitioningRef.current) {
        isTransitioningRef.current = true;
        setShowStage(false);
      }
    }
  }, [queryStep, currentStep]);

  // Check if the current stage is valid for us to be on.
  useEffect(() => {
    // If the current stage should be skipped, move to the previous available
    // stage that isn't.
    if (!isCurrentStepValid) {
      // eslint-disable-next-line no-console
      console.log(
        '⚠️ Invalid stage! Moving you to the previous valid stage...',
      );
      // This should always return a valid stage, because we know that the
      // first stage is always valid.
      void setQueryStep(previousValidStageIndex, { history: 'replace' });
    }
  }, [setQueryStep, isCurrentStepValid, previousValidStageIndex]);

  const { canMoveForward, canMoveBackward } = useSelector(getNavigationInfo);

  const isPortraitAspectRatio = useMediaQuery('(max-aspect-ratio: 3/4)');
  const navigationOrientation = isPortraitAspectRatio
    ? 'horizontal'
    : 'vertical';

  return (
    <>
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
              <Stage
                stage={stage}
                registerBeforeNext={registerBeforeNext}
                getNavigationHelpers={getNavigationHelpers}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <Navigation
          moveBackward={moveBackward}
          moveForward={moveForward}
          disableMoveForward={
            forceNavigationDisabled || !showStage || !canMoveForward
          }
          disableMoveBackward={
            forceNavigationDisabled ||
            !showStage ||
            (!canMoveBackward && !beforeNextFunction.current)
          }
          pulseNext={isReadyForNextStage}
          progress={progress}
          orientation={navigationOrientation}
        />
      </div>
    </>
  );
}

'use client';

import type { AnyAction } from '@reduxjs/toolkit';
import {
  motion,
  useAnimate,
  type ValueAnimationTransition,
} from 'motion/react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import usePrevious from '~/hooks/usePrevious';
import Navigation from '../components/Navigation';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import {
  getCurrentStage,
  getNavigationInfo,
  makeGetFakeSessionProgress,
} from '../selectors/session';
import { getNavigableStages } from '../selectors/skip-logic';
import Stage from './Stage';

type directions = 'forwards' | 'backwards';

export type BeforeNextFunction = (
  direction: directions,
) => Promise<boolean | 'FORCE'>;

const animationOptions: ValueAnimationTransition = {
  type: 'spring',
  damping: 20,
  stiffness: 150,
  mass: 1,
};

const variants = {
  initial: ({
    current,
    previous,
  }: {
    current: number;
    previous: number | undefined;
  }) => {
    if (!previous) {
      return { opacity: 0, y: 0 };
    }

    return current > previous ? { y: '100vh' } : { y: '-100vh' };
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: { when: 'beforeChildren', ...animationOptions },
  },
};

export default function ProtocolScreen() {
  const [scope, animate] = useAnimate();
  const dispatch = useDispatch();

  // State
  const [, setQueryStep] = useQueryState('step', parseAsInteger.withDefault(0));
  const [forceNavigationDisabled, setForceNavigationDisabled] = useState(false);
  const makeFakeSessionProgress = useSelector(makeGetFakeSessionProgress);

  // Selectors
  const stage = useSelector(getCurrentStage); // null = loading, undefined = not found
  const { isReady: isReadyForNextStage } = useReadyForNextStage();
  const { currentStep, isLastPrompt, isFirstPrompt, promptIndex } =
    useSelector(getNavigationInfo);
  const prevCurrentStep = usePrevious(currentStep);
  const { nextValidStageIndex, previousValidStageIndex, isCurrentStepValid } =
    useSelector(getNavigableStages);

  const [progress, setProgress] = useState(
    makeFakeSessionProgress(currentStep, promptIndex),
  );

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
  const canNavigate = async (direction: directions) => {
    if (!beforeNextFunction.current) {
      return true;
    }

    const beforeNextResult = await beforeNextFunction.current(direction);

    // Throw an error if beforeNextFunction returns an invalid value
    if (
      beforeNextResult !== true &&
      beforeNextResult !== false &&
      beforeNextResult !== 'FORCE'
    ) {
      throw new Error(
        `beforeNextFunction must return a boolean or the string 'FORCE'`,
      );
    }

    return beforeNextResult;
  };

  const moveForward = useCallback(async () => {
    setForceNavigationDisabled(true);

    await (async () => {
      const stageAllowsNavigation = await canNavigate('forwards');

      if (!stageAllowsNavigation) {
        return;
      }

      // Advance the prompt if we're not at the last one.
      if (stageAllowsNavigation !== 'FORCE' && !isLastPrompt) {
        dispatch(
          sessionActions.updatePrompt(promptIndex + 1) as unknown as AnyAction,
        );
        return;
      }

      // from this point on we are definitely navigating, so set up the animation
      setProgress(makeFakeSessionProgress(nextValidStageIndex, 0));
      await animate(scope.current, { y: '-100vh' }, animationOptions);
      // If the result is true or 'FORCE' we can reset the function here:
      registerBeforeNext(null);
      dispatch(
        sessionActions.updateStage(nextValidStageIndex) as unknown as AnyAction,
      );
    })();

    setForceNavigationDisabled(false);
  }, [
    animate,
    dispatch,
    isLastPrompt,
    nextValidStageIndex,
    promptIndex,
    registerBeforeNext,
    scope,
    makeFakeSessionProgress,
  ]);

  const moveBackward = useCallback(async () => {
    setForceNavigationDisabled(true);

    await (async () => {
      const stageAllowsNavigation = await canNavigate('backwards');

      if (!stageAllowsNavigation) {
        return;
      }

      // Advance the prompt if we're not at the last one.
      if (stageAllowsNavigation !== 'FORCE' && !isFirstPrompt) {
        dispatch(
          sessionActions.updatePrompt(promptIndex - 1) as unknown as AnyAction,
        );
        return;
      }

      setProgress(makeFakeSessionProgress(previousValidStageIndex, 0));

      // from this point on we are definitely navigating, so set up the animation
      await animate(scope.current, { y: '100vh' }, animationOptions);
      registerBeforeNext(null);
      dispatch(
        sessionActions.updateStage(
          previousValidStageIndex,
        ) as unknown as AnyAction,
      );
    })();

    setForceNavigationDisabled(false);
  }, [
    animate,
    dispatch,
    isFirstPrompt,
    previousValidStageIndex,
    promptIndex,
    registerBeforeNext,
    scope,
    makeFakeSessionProgress,
  ]);

  const getNavigationHelpers = useCallback(
    () => ({
      moveForward,
      moveBackward,
    }),
    [moveForward, moveBackward],
  );

  useEffect(() => {
    if (currentStep !== prevCurrentStep) {
      void setQueryStep(currentStep);
    }
  }, [currentStep, prevCurrentStep, setQueryStep]);

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
      dispatch(
        sessionActions.updateStage(
          previousValidStageIndex,
        ) as unknown as AnyAction,
      );
    }
  }, [dispatch, isCurrentStepValid, previousValidStageIndex]);

  return (
    <>
      <motion.div
        className="relative flex h-full w-full flex-1 flex-row overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Navigation
          moveBackward={moveBackward}
          moveForward={moveForward}
          disabled={forceNavigationDisabled}
          pulseNext={isReadyForNextStage}
          progress={progress}
        />
        <motion.div
          key={currentStep}
          ref={scope}
          className="flex h-full w-full"
          initial="initial"
          animate="animate"
          variants={variants}
          custom={{ current: currentStep, previous: prevCurrentStep }}
        >
          {stage && (
            <Stage
              stage={stage}
              registerBeforeNext={registerBeforeNext}
              getNavigationHelpers={getNavigationHelpers}
            />
          )}
        </motion.div>
      </motion.div>
    </>
  );
}

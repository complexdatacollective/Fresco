'use client';

import {
  type ValueAnimationTransition,
  motion,
  useAnimate,
} from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import Navigation from '../components/Navigation';
import { getCurrentStage } from '../selectors/session';
import Stage from './Stage';
import { sessionAtom } from '~/providers/SessionProvider';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';
import { useAtomValue } from 'jotai';
import { useCallback, useRef, useState } from 'react';
import { getNavigationInfo } from '../selectors/session';
import { getNavigableStages } from '../selectors/skip-logic';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import type { AnyAction } from '@reduxjs/toolkit';
import usePrevious from '~/hooks/usePrevious';

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
  const session = useAtomValue(sessionAtom);
  const [forceNavigationDisabled, setForceNavigationDisabled] = useState(false);

  // Selectors
  const stage = useSelector(getCurrentStage);
  const { isReady: isReadyForNextStage } = useReadyForNextStage();
  const { currentStep, isLastPrompt, isFirstPrompt, promptIndex } =
    useSelector(getNavigationInfo);
  const prevCurrentStep = usePrevious(currentStep);
  const { nextValidStageIndex, previousValidStageIndex } =
    useSelector(getNavigableStages);

  // Refs
  const beforeNextFunction = useRef<BeforeNextFunction | null>(null);

  const registerBeforeNext = useCallback((fn: BeforeNextFunction) => {
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
      return false;
    }

    return beforeNextFunction.current(direction);
  };

  const moveForward = useCallback(async () => {
    const stageAllowsNavigation = await canNavigate('forwards');

    if (!stageAllowsNavigation) {
      return;
    }

    beforeNextFunction.current = null;

    // Advance the prompt if we're not at the last one.
    if (stageAllowsNavigation !== 'FORCE' && !isLastPrompt) {
      dispatch(
        sessionActions.updatePrompt(promptIndex + 1) as unknown as AnyAction,
      );
      return;
    }

    // from this point on we are definitely navigating, so set up the animation
    setForceNavigationDisabled(true);
    await animate(scope.current, { y: '-100vh' }, animationOptions);

    dispatch(
      sessionActions.updateStage(nextValidStageIndex) as unknown as AnyAction,
    );
    setForceNavigationDisabled(false);
  }, [
    animate,
    dispatch,
    isLastPrompt,
    nextValidStageIndex,
    promptIndex,
    scope,
  ]);

  const moveBackward = useCallback(async () => {
    const stageAllowsNavigation = await canNavigate('backwards');

    if (!stageAllowsNavigation) {
      return;
    }

    beforeNextFunction.current = null;

    // Advance the prompt if we're not at the last one.
    if (stageAllowsNavigation !== 'FORCE' && !isFirstPrompt) {
      dispatch(
        sessionActions.updatePrompt(promptIndex - 1) as unknown as AnyAction,
      );
      return;
    }

    // from this point on we are definitely navigating, so set up the animation
    setForceNavigationDisabled(true);
    await animate(scope.current, { y: '100vh' }, animationOptions);

    dispatch(
      sessionActions.updateStage(
        previousValidStageIndex,
      ) as unknown as AnyAction,
    );
    setForceNavigationDisabled(false);
  }, [
    animate,
    dispatch,
    isFirstPrompt,
    previousValidStageIndex,
    promptIndex,
    scope,
  ]);

  const getNavigationHelpers = useCallback(
    () => ({
      moveForward,
      moveBackward,
    }),
    [moveForward, moveBackward],
  );

  return (
    <>
      {session && <FeedbackBanner />}
      <motion.div
        className="relative flex flex-1 flex-row overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Navigation
          moveBackward={moveBackward}
          moveForward={moveForward}
          disabled={forceNavigationDisabled}
          pulseNext={isReadyForNextStage}
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
          <Stage
            stage={stage}
            registerBeforeNext={registerBeforeNext}
            getNavigationHelpers={getNavigationHelpers}
          />
        </motion.div>
      </motion.div>
    </>
  );
}

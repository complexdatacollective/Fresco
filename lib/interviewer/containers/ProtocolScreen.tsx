'use client';

import { motion, useAnimate } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import Navigation from '../components/Navigation';
import { getCurrentStage } from '../selectors/session';
import Stage from './Stage';
import { sessionAtom } from '~/providers/SessionProvider';
import FeedbackBanner from '~/components/Feedback/FeedbackBanner';
import { useAtomValue } from 'jotai';
import { useCallback, useRef } from 'react';
import { getNavigationInfo } from '../selectors/session';
import { getSkipMap } from '../selectors/skip-logic';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import type { AnyAction } from '@reduxjs/toolkit';
import { atom, useAtom } from 'jotai';
import usePrevious from '~/hooks/usePrevious';

const forceNavigationDisabledAtom = atom(false);

type directions = 'forwards' | 'backwards';

type NavigationOptions = {
  forceChangeStage?: boolean;
};

export type BeforeNextFunction = (direction: directions) => Promise<boolean>;

const animationOptions = {
  type: 'spring',
  damping: 20,
  stiffness: 150,
  mass: 1,
};

export default function ProtocolScreen() {
  const session = useAtomValue(sessionAtom);
  const [scope, animate] = useAnimate();

  // Maybe something like this?
  const beforeNextFunction = useRef<BeforeNextFunction | null>(null);

  const registerBeforeNext = useCallback((fn: BeforeNextFunction) => {
    // eslint-disable-next-line no-console
    // console.log('registerbeforeNext');
    beforeNextFunction.current = fn;
  }, []);

  const dispatch = useDispatch();
  const skipMap = useSelector(getSkipMap);

  const { isReady: isReadyForNextStage } = useReadyForNextStage();

  const [forceNavigationDisabled, setForceNavigationDisabled] = useAtom(
    forceNavigationDisabledAtom,
  );

  const {
    progress,
    currentStep,
    isLastPrompt,
    isFirstPrompt,
    isLastStage,
    promptIndex,
    canMoveForward,
    canMoveBackward,
  } = useSelector(getNavigationInfo);

  const calculateNextStage = useCallback(() => {
    const nextStage = Object.keys(skipMap).find(
      (stage) =>
        parseInt(stage) > currentStep && skipMap[parseInt(stage)] === false,
    );

    if (!nextStage) {
      return currentStep;
    }

    return parseInt(nextStage);
  }, [currentStep, skipMap]);

  const setCurrentStage = (index) =>
    dispatch(sessionActions.updateStage(index));

  const calculatePreviousStage = useCallback(() => {
    const previousStage = Object.keys(skipMap)
      .reverse()
      .find(
        (stage) =>
          parseInt(stage) < currentStep && skipMap[parseInt(stage)] === false,
      );

    if (!previousStage) {
      return currentStep;
    }

    return parseInt(previousStage);
  }, [currentStep, skipMap]);

  const checkCanNavigate = useCallback(
    async (direction: directions) => {
      if (beforeNextFunction.current) {
        const canNavigate = await beforeNextFunction.current(direction);
        if (!canNavigate) {
          return false;
        }
      }

      return true;
    },
    [beforeNextFunction],
  );

  const moveForward = async (options?: NavigationOptions) => {
    if (!(await checkCanNavigate('forwards'))) {
      return;
    }

    // Advance the prompt if we're not at the last one.
    // forceChangeStage used in Dyad Census and Tie Strength Census when there are no steps
    if (!isLastPrompt && !options?.forceChangeStage) {
      dispatch(
        sessionActions.updatePrompt(promptIndex + 1) as unknown as AnyAction,
      );
      return;
    }

    // from this point on we are definitely navigating, so set up the animation
    setForceNavigationDisabled(true);
    await animate(
      scope.current,
      {
        y: '-100vh',
      },
      animationOptions,
    );

    const nextStage = calculateNextStage();
    setCurrentStage(nextStage);
    setForceNavigationDisabled(false);
  };

  const moveBackward = async (options?: NavigationOptions) => {
    if (!(await checkCanNavigate('backwards'))) {
      return;
    }

    // forceChangeStage used in Dyad Census and Tie Strength Census when there are no steps
    if (!isFirstPrompt && !options?.forceChangeStage) {
      dispatch(
        sessionActions.updatePrompt(promptIndex - 1) as unknown as AnyAction,
      );
      return;
    }

    setForceNavigationDisabled(true);
    await animate(
      scope.current,
      {
        y: '100vh',
      },
      animationOptions,
    );

    const previousStage = calculatePreviousStage();
    void setCurrentStage(previousStage);
    setForceNavigationDisabled(false);
  };

  const stage = useSelector(getCurrentStage);

  const prevCurrentStep = usePrevious(currentStep);

  return (
    <>
      {session && <FeedbackBanner />}
      <motion.div
        className="relative flex h-4/5 w-full flex-1 flex-row overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Navigation
          moveBackward={moveBackward}
          moveForward={moveForward}
          canMoveForward={!forceNavigationDisabled && canMoveForward}
          canMoveBackward={!forceNavigationDisabled && canMoveBackward}
          progress={progress}
          isReadyForNextStage={isReadyForNextStage}
        />
        <motion.div
          key={currentStep}
          ref={scope}
          className="stage-animation-wrapper flex h-full w-full"
          initial={
            prevCurrentStep
              ? { y: currentStep > prevCurrentStep ? '100vh' : '-100vh' }
              : {}
          }
          animate={{ y: 0 }}
          transition={animationOptions}
        >
          <Stage
            stage={stage}
            registerBeforeNext={registerBeforeNext}
            setForceNavigationDisabled={setForceNavigationDisabled}
          />
        </motion.div>
      </motion.div>
    </>
  );
}

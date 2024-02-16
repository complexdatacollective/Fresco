import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getNavigationInfo } from '../selectors/session';
import { getSkipMap } from '../selectors/skip-logic';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import usePrevious from '~/hooks/usePrevious';
import type { AnyAction } from '@reduxjs/toolkit';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useAtom } from 'jotai';
import { forceNavigationDisabledAtom } from '~/providers/SessionProvider';

export type directions = 'forwards' | 'backwards';

type NavigationOptions = {
  forceChangeStage?: boolean;
};

export const useNavigationHelpers = () => {
  const dispatch = useDispatch();
  const skipMap = useSelector(getSkipMap);

  const [currentStage, setCurrentStage] = useQueryState(
    'stage',
    parseAsInteger.withDefault(0),
  );

  const prevCurrentStage = usePrevious(currentStage);

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

  useEffect(() => {
    if (currentStep && currentStage === null) {
      void setCurrentStage(currentStep);
      return;
    }
  }, [currentStage, currentStep, setCurrentStage]);

  const beforeNextFunction = useRef<
    ((direction: directions) => Promise<boolean>) | null
  >(null);

  // Stages call this to register a function to be called before
  // moving to the next stage. Return true to allow the move, false to
  // prevent it.
  const registerBeforeNext = useCallback(
    (beforeNext: (direction: directions) => Promise<boolean>) => {
      beforeNextFunction.current = beforeNext;
    },
    [],
  );

  const calculateNextStage = useCallback(() => {
    const nextStage = Object.keys(skipMap).find(
      (stage) =>
        parseInt(stage) > currentStage && skipMap[parseInt(stage)] === false,
    );

    if (!nextStage) {
      return currentStage;
    }

    return parseInt(nextStage);
  }, [currentStage, skipMap]);

  const calculatePreviousStage = useCallback(() => {
    const previousStage = Object.keys(skipMap)
      .reverse()
      .find(
        (stage) =>
          parseInt(stage) < currentStage && skipMap[parseInt(stage)] === false,
      );

    if (!previousStage) {
      return currentStage;
    }

    return parseInt(previousStage);
  }, [currentStage, skipMap]);

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

    // forceChangeStage used in Dyad Census and Tie Strength Census when there are no steps
    if (isLastPrompt || options?.forceChangeStage) {
      const nextStage = calculateNextStage();
      void setCurrentStage(nextStage);
      return;
    }

    dispatch(
      sessionActions.updatePrompt(promptIndex + 1) as unknown as AnyAction,
    );
  };

  const moveBackward = async (options?: NavigationOptions) => {
    if (!(await checkCanNavigate('backwards'))) {
      return;
    }

    // forceChangeStage used in Dyad Census and Tie Strength Census when there are no steps
    if (isFirstPrompt || options?.forceChangeStage) {
      const previousStage = calculatePreviousStage();
      void setCurrentStage(previousStage);
      return;
    }

    dispatch(
      sessionActions.updatePrompt(promptIndex - 1) as unknown as AnyAction,
    );
  };

  const resetBeforeNext = () => {
    beforeNextFunction.current = null;
  };

  // Check the stage changes, reset the beforeNextFunction
  useEffect(() => {
    resetBeforeNext();
  }, [currentStage]);

  // Check if the current stage is valid for us to be on.
  useEffect(() => {
    if (!currentStage) {
      return;
    }

    // If the current stage should be skipped, move to the previous available
    // stage that isn't.
    if (!skipMap[currentStage] === false) {
      // This should always return a valid stage, because we know that the
      // first stage is always valid.
      const previousValidStage = calculatePreviousStage();

      if (previousValidStage) {
        void setCurrentStage(previousValidStage);
      }
    }
  }, [currentStage, skipMap, setCurrentStage, calculatePreviousStage]);

  const setReduxStage = useCallback(
    (stage: number) =>
      dispatch(sessionActions.updateStage(stage) as unknown as AnyAction),
    [dispatch],
  );

  // When currentStage changes, dispatch an action to update currentStep
  useEffect(() => {
    if (currentStage === null) {
      return;
    }

    if (currentStage === prevCurrentStage) {
      return;
    }

    setReduxStage(currentStage);
  }, [currentStage, prevCurrentStage, setReduxStage]);

  return {
    progress,
    isReadyForNextStage,
    canMoveForward: !forceNavigationDisabled && canMoveForward,
    canMoveBackward: !forceNavigationDisabled && canMoveBackward,
    moveForward,
    moveBackward,
    isFirstPrompt,
    isLastPrompt,
    isLastStage,
    registerBeforeNext,
    currentStep,
    setForceNavigationDisabled,
  };
};

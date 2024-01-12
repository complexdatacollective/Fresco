import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getNavigationInfo } from '../selectors/session';
import { getSkipMap } from '../selectors/skip-logic';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import usePrevious from '~/hooks/usePrevious';
import type { AnyAction } from '@reduxjs/toolkit';

type directions = 'forwards' | 'backwards';

export const useNavigationHelpers = (
  currentStage: number | null,
  setCurrentStage: (stage: number) => void,
) => {
  const dispatch = useDispatch();
  const skipMap = useSelector(getSkipMap);

  const { isReady: isReadyForNextStage } = useReadyForNextStage();

  const {
    progress,
    currentStep,
    isLastPrompt,
    isFirstPrompt,
    isLastStage,
    promptIndex,
    canMoveBackward,
    canMoveForward,
  } = useSelector(getNavigationInfo);

  const beforeNextFunction = useRef<
    ((direction: directions) => Promise<boolean>) | null
  >(null);

  // Stages call this to register a function to be called before
  // moving to the next stage. This disables navigation until onComplete is
  // called.
  const registerBeforeNext = (
    beforeNext: (direction: directions) => Promise<boolean>,
  ) => {
    const wrappedFunction = async (direction: directions) => {
      const result = await beforeNext(direction);

      console.log('result', result);
      return result;
    };

    beforeNextFunction.current = wrappedFunction;
  };

  const calculateNextStage = useCallback(() => {
    if (!currentStage) {
      return 0;
    }

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
      .find((stage) => parseInt(stage) < currentStage);

    if (!previousStage) {
      return currentStage;
    }

    return parseInt(previousStage);
  }, [currentStage, skipMap]);

  const validateCurrentStage = useCallback(() => {
    if (!skipMap[currentStage] === false) {
      const previousValidStage = calculatePreviousStage();

      if (previousValidStage) {
        setCurrentStage(previousValidStage);
      }
    }
  }, [calculatePreviousStage, setCurrentStage, currentStage, skipMap]);

  const checkCanNavigate = useCallback(
    async (direction: directions) => {
      if (beforeNextFunction.current) {
        const canNavigate = await beforeNextFunction.current(direction);
        if (!canNavigate) {
          return false;
        }
      }

      // Make sure to reset the function before we return true, because the
      // stage will have changed!
      beforeNextFunction.current = null;
      return true;
    },
    [beforeNextFunction],
  );

  const moveForward = async () => {
    if (!(await checkCanNavigate('forwards'))) {
      return;
    }

    if (isLastPrompt) {
      const nextStage = calculateNextStage();
      setCurrentStage(nextStage);
      return;
    }

    dispatch(
      sessionActions.updatePrompt(promptIndex + 1) as unknown as AnyAction,
    );
  };

  // Move to the previous available stage in the interview based on the current stage and skip logic
  const moveBackward = async () => {
    if (!(await checkCanNavigate('backwards'))) {
      return;
    }

    if (isFirstPrompt) {
      const previousStage = calculatePreviousStage();
      setCurrentStage(previousStage);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    dispatch(sessionActions.updatePrompt(promptIndex - 1));
  };

  const prevCurrentStage = usePrevious(currentStage);

  const needToDispatch = useCallback(() => {
    if (currentStage === prevCurrentStage) {
      return false;
    }

    if (currentStage === currentStep) {
      return false;
    }

    return true;
  }, [currentStage, prevCurrentStage, currentStep]);

  useEffect(() => {
    if (!needToDispatch()) {
      return;
    }

    dispatch(sessionActions.updateStage(currentStage) as unknown as AnyAction);
  }, [currentStage, dispatch, needToDispatch]);

  // Check the stage changes, reset the beforeNextFunction
  useEffect(() => {
    beforeNextFunction.current = null;
  }, [currentStage]);

  // Check if the current stage is valid for us to be on.
  useEffect(() => {
    validateCurrentStage();
  }, [validateCurrentStage]);

  return {
    progress,
    isReadyForNextStage,
    canMoveForward,
    canMoveBackward,
    moveForward,
    moveBackward,
    validateCurrentStage,
    isFirstPrompt,
    isLastPrompt,
    isLastStage,
    registerBeforeNext,
  };
};

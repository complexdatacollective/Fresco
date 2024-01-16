import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getNavigationInfo } from '../selectors/session';
import { getSkipMap } from '../selectors/skip-logic';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import usePrevious from '~/hooks/usePrevious';
import type { AnyAction } from '@reduxjs/toolkit';
import { parseAsInteger, useQueryState } from 'nuqs';

type directions = 'forwards' | 'backwards';

export const useNavigationHelpers = () => {
  const dispatch = useDispatch();
  const skipMap = useSelector(getSkipMap);

  const [currentStage, setCurrentStage] = useQueryState(
    'stage',
    parseAsInteger.withDefault(0),
  );

  const prevCurrentStage = usePrevious(currentStage);

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

  useEffect(() => {
    if (currentStep && currentStage === null) {
      console.log('current step was defined and current stage was null', {
        currentStep,
        currentStage,
      });
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
      const wrappedFunction = async (direction: directions) => {
        const result = await beforeNext(direction);

        console.log('beforeNext result:', result);
        return result;
      };

      beforeNextFunction.current = wrappedFunction;
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
      .find((stage) => parseInt(stage) < currentStage);

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

  const moveForward = async () => {
    if (!(await checkCanNavigate('forwards'))) {
      return;
    }

    if (isLastPrompt) {
      const nextStage = calculateNextStage();
      void setCurrentStage(nextStage);
      return;
    }

    dispatch(
      sessionActions.updatePrompt(promptIndex + 1) as unknown as AnyAction,
    );
  };

  const moveBackward = async () => {
    if (!(await checkCanNavigate('backwards'))) {
      return;
    }

    if (isFirstPrompt) {
      const previousStage = calculatePreviousStage();
      void setCurrentStage(previousStage);
      return;
    }

    dispatch(
      sessionActions.updatePrompt(promptIndex - 1) as unknown as AnyAction,
    );
  };

  // Check the stage changes, reset the beforeNextFunction
  useEffect(() => {
    if (beforeNextFunction.current === null) {
      return;
    }

    console.log('Resetting before next function because currentStage changed');
    beforeNextFunction.current = null;
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
    canMoveForward,
    canMoveBackward,
    moveForward,
    moveBackward,
    isFirstPrompt,
    isLastPrompt,
    isLastStage,
    registerBeforeNext,
  };
};

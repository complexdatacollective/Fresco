import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getNavigationInfo } from '../selectors/session';
import { getSkipMap } from '../selectors/skip-logic';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import usePrevious from '~/hooks/usePrevious';

export const useNavigationHelpers = (
  currentStage: number,
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

  // const prevStageIndex = usePrevious(currentStep);

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

  const validateCurrentStage = useCallback(() => {
    if (!skipMap[currentStage] === false) {
      const previousValidStage = calculatePreviousStage();

      if (previousValidStage) {
        setCurrentStage(previousValidStage);
      }
    }
  }, [calculatePreviousStage, setCurrentStage, currentStage, skipMap]);

  const moveForward = useCallback(() => {
    if (isLastPrompt) {
      const nextStage = calculateNextStage();
      setCurrentStage(nextStage);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    dispatch(sessionActions.updatePrompt(promptIndex + 1));
  }, [
    dispatch,
    isLastPrompt,
    promptIndex,
    calculateNextStage,
    setCurrentStage,
  ]);

  // Move to the previous available stage in the interview based on the current stage and skip logic
  const moveBackward = () => {
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

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    dispatch(sessionActions.updateStage(currentStage));
  }, [currentStage, dispatch, needToDispatch]);

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
  };
};

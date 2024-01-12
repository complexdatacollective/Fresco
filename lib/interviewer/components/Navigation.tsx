import React, { useCallback, useEffect } from 'react';
import ProgressBar from '~/lib/ui/components/ProgressBar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '~/utils/shadcn';
import { useDispatch, useSelector } from 'react-redux';
import { getNavigationInfo } from '../selectors/session';
import { getSkipMap } from '../selectors/skip-logic';
import { parseAsInteger, useQueryState } from 'next-usequerystate';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import usePrevious from '~/hooks/usePrevious';
import { SettingsMenu } from './SettingsMenu/SettingsMenu';

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

export const NavigationButton = ({
  disabled,
  onClick,
  className,
  children,
}: {
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        `session-navigation__button m-4 flex h-[4.8rem] w-[4.8rem] basis-[4.8rem] cursor-pointer items-center justify-center rounded-full transition-all`,
        'hover:bg-[#4a4677]',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
        className,
      )}
      role="button"
      tabIndex={0}
      onClick={!disabled ? onClick : undefined}
    >
      {children}
    </div>
  );
};

const Navigation = () => {
  const [currentStage, setCurrentStage] = useQueryState(
    'stage',
    parseAsInteger,
  );

  const {
    validateCurrentStage,
    moveBackward,
    moveForward,
    canMoveBackward,
    canMoveForward,
    progress,
    isReadyForNextStage,
  } = useNavigationHelpers(currentStage!, setCurrentStage);

  // Check if the current stage is valid for us to be on.
  useEffect(() => {
    validateCurrentStage();
  }, [validateCurrentStage]);

  return (
    <div
      role="navigation"
      className="flex flex-shrink-0 flex-grow-0 flex-col items-center justify-between bg-[#36315f] [--nc-light-background:#4a4677]"
    >
      <SettingsMenu />
      <NavigationButton onClick={moveBackward} disabled={!canMoveBackward}>
        <ChevronUp className="h-[2.4rem] w-[2.4rem]" strokeWidth="3px" />
      </NavigationButton>
      <div className="m-6 flex flex-grow">
        <ProgressBar percentProgress={progress} />
      </div>
      <NavigationButton
        className={cn(
          'bg-[var(--nc-light-background)]',
          'hover:bg-[var(--nc-primary)]',
          isReadyForNextStage && 'animate-pulse',
        )}
        onClick={moveForward}
        disabled={!canMoveForward}
      >
        <ChevronDown className="h-[2.4rem] w-[2.4rem]" strokeWidth="3px" />
      </NavigationButton>
    </div>
  );
};

export default Navigation;

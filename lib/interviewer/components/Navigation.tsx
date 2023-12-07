import React, { useEffect } from 'react';
import ProgressBar from '~/lib/ui/components/ProgressBar';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import { ChevronDown, ChevronUp, SettingsIcon } from 'lucide-react';
import { cn } from '~/utils/shadcn';
import { useDispatch, useSelector } from 'react-redux';
import { type State, getNavigationInfo } from '../selectors/session';
import { getSkipMap } from '../selectors/skip-logic';
import { parseAsInteger, useQueryState } from 'next-usequerystate';

type SkipMap = Record<string, boolean>;

const useNavigation = () => {
  const dispatch = useDispatch();

  const [isReadyForNextStage] = useReadyForNextStage();
  const skipMap: SkipMap = useSelector(getSkipMap);
  const {
    progress,
    isFirstPrompt,
    isLastPrompt,
    isLastStage,
    currentStageIndex,
    currentPromptIndex,
  } = useSelector((state: State) => getNavigationInfo(state));

  const [currentStage, setCurrentStage] = useQueryState(
    'stage',
    parseAsInteger.withDefault(1),
  );

  // Ddetermine if we can navigate to a given stage based on the skip logic
  const canNavigateToStage = (stage: number) => {
    return skipMap[stage];
  };

  // Move to the next available stage in the interview based on the current stage and skip logic
  const moveForward = () => {
    const nextAvailableStage = Object.keys(skipMap).find(
      (stage) => parseInt(stage) > currentStage && skipMap[stage] === false,
    );

    dispatch(sessionActions.updateStage({ stageIndex: nextAvailableStage }));
  };

  // Move to the previous available stage in the interview based on the current stage and skip logic
  const moveBackward = () => {
    const previousAvailableStage = Object.keys(skipMap)
      .reverse()
      .find(
        (stage) => parseInt(stage) < currentStage && skipMap[stage] === false,
      );

    dispatch(
      sessionActions.updateStage({ stageIndex: previousAvailableStage }),
    );
  };

  // When the current stage changes, try to set the session currentStage to the new value using the
  // `canNavigateToStage` method.
  useEffect(() => {
    if (canNavigateToStage(currentStage)) {
      dispatch(sessionActions.updateStage({ stageIndex: currentStage }));
    }
  }, [currentStage, canNavigateToStage, dispatch]);

  return {
    progress,
    isReadyForNextStage: true,
    canMoveForward: true,
    canMoveBackward: true,
    moveForward,
    moveBackward,
  };
};

const NavigationButton = ({
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
  const {
    progress,
    isReadyForNextStage,
    canMoveForward,
    canMoveBackward,
    moveForward,
    moveBackward,
  } = useNavigation();

  return (
    <div
      role="navigation"
      className="flex flex-shrink-0 flex-grow-0 flex-col items-center justify-between bg-[#36315f] [--nc-light-background:#4a4677]"
    >
      <NavigationButton>
        <SettingsIcon className="h-[2.4rem] w-[2.4rem]" />
      </NavigationButton>
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

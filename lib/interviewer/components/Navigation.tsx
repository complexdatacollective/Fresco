import { useEffect } from 'react';
import ProgressBar from '~/lib/ui/components/ProgressBar';
import { ChevronDown, ChevronUp, SettingsIcon } from 'lucide-react';
import { cn } from '~/utils/shadcn';
import { parseAsInteger, useQueryState } from 'next-usequerystate';
import { useNavigationHelpers } from '../hooks/useNavigationHelpers';

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

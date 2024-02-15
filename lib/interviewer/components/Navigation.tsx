import ProgressBar from '~/lib/ui/components/ProgressBar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '~/utils/shadcn';

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
        disabled && 'hover:bg-transparent cursor-not-allowed opacity-50',
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

type NavigationProps = {
  moveBackward: () => void;
  canMoveBackward: boolean;
  moveForward: () => void;
  canMoveForward: boolean;
  progress: number;
  isReadyForNextStage: boolean;
  isAnimating: boolean;
};

const Navigation = ({
  moveBackward,
  canMoveBackward,
  moveForward,
  canMoveForward,
  progress,
  isReadyForNextStage,
  isAnimating,
}: NavigationProps) => {
  return (
    <div
      role="navigation"
      className="flex flex-shrink-0 flex-grow-0 flex-col items-center justify-between bg-[#36315f] [--nc-light-background:#4a4677]"
    >
      {/* <SettingsMenu /> */}
      <NavigationButton
        onClick={moveBackward}
        disabled={!canMoveBackward || isAnimating}
      >
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
        disabled={!canMoveForward || isAnimating}
      >
        <ChevronDown className="h-[2.4rem] w-[2.4rem]" strokeWidth="3px" />
      </NavigationButton>
    </div>
  );
};

export default Navigation;

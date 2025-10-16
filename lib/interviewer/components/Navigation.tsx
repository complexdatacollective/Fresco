import { ChevronDown, ChevronUp } from 'lucide-react';
import ProgressBar from '~/lib/ui/components/ProgressBar';
import { cn } from '~/utils/shadcn';
import PassphrasePrompter from './PassphrasePrompter';

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

type NavigationProps = {
  moveBackward: () => void;
  moveForward: () => void;
  disableMoveForward?: boolean;
  disableMoveBackward?: boolean;
  pulseNext: boolean;
  progress: number;
};

const Navigation = ({
  moveBackward,
  moveForward,
  disableMoveForward,
  disableMoveBackward,
  pulseNext,
  progress,
}: NavigationProps) => {
  return (
    <div
      role="navigation"
      className="flex shrink-0 grow-0 flex-col items-center justify-between bg-[#36315f] [--nc-light-background:#4a4677]"
    >
      <NavigationButton onClick={moveBackward} disabled={disableMoveBackward}>
        <ChevronUp className="h-[2.4rem] w-[2.4rem]" strokeWidth="3px" />
      </NavigationButton>
      <PassphrasePrompter />
      <div className="m-6 flex grow">
        <ProgressBar percentProgress={progress} />
      </div>
      <NavigationButton
        className={cn(
          'bg-[var(--nc-light-background)]',
          'hover:bg-[var(--nc-primary)]',
          pulseNext && 'bg-success animate-pulse-glow',
        )}
        onClick={moveForward}
        disabled={disableMoveForward}
      >
        <ChevronDown className="h-[2.4rem] w-[2.4rem]" strokeWidth="3px" />
      </NavigationButton>
    </div>
  );
};

export default Navigation;

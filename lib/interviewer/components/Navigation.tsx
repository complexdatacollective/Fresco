import { ChevronDown, ChevronUp } from 'lucide-react';
import { type ComponentProps } from 'react';
import Surface from '~/components/layout/Surface';
import { IconButton } from '~/components/ui/Button';
import ProgressBar from '~/lib/ui/components/ProgressBar';
import { cx } from '~/utils/cva';
import PassphrasePrompter from './PassphrasePrompter';

const NavigationButton = ({
  disabled,
  onClick,
  className,
  ...props
}: ComponentProps<typeof IconButton> & {}) => {
  return (
    <IconButton
      variant="text"
      className={cx('m-2 [&>.lucide]:h-[2em]', className)}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      {...props}
      size="lg"
    ></IconButton>
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
    <Surface
      level={2}
      role="navigation"
      elevation="none"
      className="flex max-h-none w-auto shrink-0 grow-0 flex-col items-center justify-between rounded-none !p-0"
      noContainer
    >
      <NavigationButton
        onClick={moveBackward}
        disabled={disableMoveBackward}
        icon={<ChevronUp />}
        aria-label="Previous Step"
      />
      <PassphrasePrompter />
      <div className="m-6 flex grow">
        <ProgressBar percentProgress={progress} />
      </div>
      <NavigationButton
        className={cx(pulseNext && 'bg-success animate-pulse-glow')}
        onClick={moveForward}
        disabled={disableMoveForward}
        icon={<ChevronDown className="h-8 w-8" strokeWidth="3px" />}
        aria-label="Next Step"
      />
    </Surface>
  );
};

export default Navigation;

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';
import { type ComponentProps } from 'react';
import Surface from '~/components/layout/Surface';
import { IconButton } from '~/components/ui/Button';
import ProgressBar from '~/components/ui/ProgressBar';
import { cva, cx } from '~/utils/cva';
import PassphrasePrompter from './PassphrasePrompter';

const NavigationButton = ({
  disabled,
  className,
  ...props
}: ComponentProps<typeof IconButton>) => {
  return (
    <IconButton
      variant="text"
      className={cx('[&>.lucide]:h-[2em]', className)}
      disabled={disabled}
      {...props}
      size="lg"
    />
  );
};

const navigationVariants = cva({
  base: 'flex max-h-none shrink-0 grow-0 items-center justify-between overflow-visible rounded-none',
  variants: {
    orientation: {
      vertical: 'w-auto flex-col',
      horizontal: 'h-auto w-full flex-row',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

const progressContainerVariants = cva({
  base: 'm-6 flex grow',
  variants: {
    orientation: {
      vertical: '',
      horizontal: 'mx-4',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

type NavigationProps = {
  moveBackward: () => void;
  moveForward: () => void;
  disableMoveForward?: boolean;
  disableMoveBackward?: boolean;
  pulseNext: boolean;
  progress: number;
  orientation?: 'horizontal' | 'vertical';
};

const Navigation = ({
  moveBackward,
  moveForward,
  disableMoveForward,
  disableMoveBackward,
  pulseNext,
  progress,
  orientation = 'vertical',
}: NavigationProps) => {
  const BackIcon = orientation === 'vertical' ? ChevronUp : ChevronLeft;
  const ForwardIcon = orientation === 'vertical' ? ChevronDown : ChevronRight;

  return (
    <Surface
      level={2}
      role="navigation"
      elevation="none"
      className={navigationVariants({ orientation })}
      spacing="sm"
      noContainer
    >
      <NavigationButton
        onClick={moveBackward}
        disabled={disableMoveBackward}
        icon={<BackIcon />}
        aria-label="Previous Step"
      />
      {orientation === 'vertical' && <PassphrasePrompter />}
      <div className={progressContainerVariants({ orientation })}>
        <ProgressBar percentProgress={progress} orientation={orientation} />
      </div>
      <NavigationButton
        className={cx(pulseNext && 'bg-success animate-pulse-glow')}
        onClick={moveForward}
        disabled={disableMoveForward}
        icon={<ForwardIcon className="size-8" strokeWidth="3px" />}
        aria-label="Next Step"
      />
    </Surface>
  );
};

export default Navigation;

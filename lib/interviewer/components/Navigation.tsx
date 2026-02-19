import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { type ComponentProps, type Ref } from 'react';
import { MotionSurface } from '~/components/layout/Surface';
import { IconButton } from '~/components/ui/Button';
import ProgressBar from '~/components/ui/ProgressBar';
import { cva, cx } from '~/utils/cva';
import PassphrasePrompter from './PassphrasePrompter';

const variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

const containerVariants = {
  initial: (orientation: 'vertical' | 'horizontal') => ({
    opacity: 0,
    x: orientation === 'vertical' ? '-100%' : 0,
    y: orientation === 'horizontal' ? '100%' : 0,
  }),
  animate: () => ({
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      when: 'beforeChildren',
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
    },
  }),
  exit: (orientation: 'vertical' | 'horizontal') => ({
    opacity: 0,
    x: orientation === 'vertical' ? '-100%' : 0,
    y: orientation === 'horizontal' ? '100%' : 0,
    transition: { when: 'afterChildren' },
  }),
};

const NavigationButton = ({
  disabled,
  className,
  buttonRef,
  ...props
}: ComponentProps<typeof IconButton> & {
  buttonRef?: Ref<HTMLButtonElement>;
}) => {
  return (
    <motion.div variants={variants}>
      <IconButton
        ref={buttonRef}
        color="dynamic"
        variant="text"
        className={cx('[&>.lucide]:h-[2em]', className)}
        disabled={disabled}
        {...props}
        size="xl"
      />
    </motion.div>
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
  forwardButtonRef?: Ref<HTMLButtonElement>;
  backButtonRef?: Ref<HTMLButtonElement>;
};

const Navigation = ({
  moveBackward,
  moveForward,
  disableMoveForward,
  disableMoveBackward,
  pulseNext,
  progress,
  orientation = 'vertical',
  forwardButtonRef,
  backButtonRef,
}: NavigationProps) => {
  const BackIcon = orientation === 'vertical' ? ChevronUp : ChevronLeft;
  const ForwardIcon = orientation === 'vertical' ? ChevronDown : ChevronRight;

  return (
    <MotionSurface
      role="navigation"
      elevation="none"
      className={navigationVariants({ orientation })}
      spacing="xs"
      noContainer
      variants={containerVariants}
      custom={orientation}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <NavigationButton
        onClick={moveBackward}
        disabled={disableMoveBackward}
        icon={<BackIcon />}
        aria-label="Previous Step"
        buttonRef={backButtonRef}
      />
      {orientation === 'vertical' && <PassphrasePrompter />}
      <motion.div
        className={progressContainerVariants({ orientation })}
        variants={variants}
      >
        <ProgressBar percentProgress={progress} orientation={orientation} />
      </motion.div>
      <NavigationButton
        className={cx(
          pulseNext &&
            'bg-success animate-pulse-glow hover:enabled:bg-success outline-success',
        )}
        onClick={moveForward}
        disabled={disableMoveForward}
        icon={<ForwardIcon className="size-8" strokeWidth="3px" />}
        aria-label="Next Step"
        buttonRef={forwardButtonRef}
      />
    </MotionSurface>
  );
};

export default Navigation;

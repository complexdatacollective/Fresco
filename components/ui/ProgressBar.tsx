import { Progress } from '@base-ui/react/progress';
import { cx } from '~/utils/cva';

type ProgressBarProps = {
  indeterminate?: boolean;
  onClick?: () => void;
  orientation?: 'horizontal' | 'vertical';
  percentProgress?: number;
  nudge?: boolean;
  label?: string;
};

const ProgressBar = ({
  indeterminate = false,
  onClick,
  orientation = 'vertical',
  percentProgress = 0,
  nudge = true,
  label,
}: ProgressBarProps) => {
  const isIndeterminate = indeterminate || percentProgress === null;
  const value = isIndeterminate ? null : percentProgress;

  return (
    <Progress.Root
      value={value}
      aria-label={label ?? 'Progress indicator'}
      onClick={onClick}
      className={cx(
        // Base styles
        'relative size-full grow overflow-hidden',
        'rounded-full',
        // Background using color-mix
        '[background-color:color-mix(in_oklch,currentColor_10%,transparent)]',
        // Orientation-specific styles
        orientation === 'vertical' && 'w-[0.7rem]',
        orientation === 'horizontal' && 'h-[0.7rem]',
        // Complete state - pulse glow animation
        nudge && 'data-complete:animate-pulse-glow',
        // Clickable cursor
        onClick && 'cursor-pointer',
      )}
      data-orientation={orientation}
    >
      <Progress.Track className="size-full">
        <Progress.Indicator
          className={cx(
            'absolute rounded-[inherit]',
            // Background using color-mix
            '[background-color:color-mix(in_oklch,currentColor_20%,transparent)]',
            // Complete state
            'data-complete:bg-primary',
            // Orientation-specific sizing and transitions
            // Base UI automatically sets width for horizontal, so we need to override for vertical
            orientation === 'vertical' && [
              // Override Base UI's automatic width and use height instead
              'w-full!',
              // Height will be controlled by inline style below
              'transition-[height] duration-[calc(var(--animation-duration-standard,200ms)*3)] ease-(--animation-easing,ease)',
            ],
            orientation === 'horizontal' && [
              // Base UI automatically handles width, just set height and transition
              'h-full!',
              'transition-[width] duration-(--animation-duration-standard,200ms) ease-(--animation-easing,ease)',
            ],
            // Indeterminate state
            'data-indeterminate:animate-indeterminate-progress-bar',
            'data-indeterminate:bg-linear-to-r',
            'data-indeterminate:from-[color-mix(in_oklch,currentColor_15%,transparent)]',
            'data-indeterminate:via-[color-mix(in_oklch,currentColor_30%,transparent)]',
            'data-indeterminate:to-[color-mix(in_oklch,currentColor_15%,transparent)]',
            'data-indeterminate:bg-[length:400%]',
          )}
          style={
            // For vertical orientation, override Base UI's width and set height instead
            orientation === 'vertical' && !isIndeterminate
              ? { width: '100%', height: `${percentProgress}%` }
              : undefined
          }
        />
      </Progress.Track>
    </Progress.Root>
  );
};

export default ProgressBar;

'use client';

import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { AnimatePresence } from 'motion/react';
import * as React from 'react';
import { cx } from '~/utils/cva';
import { MotionSurface } from '../layout/Surface';

const TooltipProvider = BaseTooltip.Provider;

const Tooltip = BaseTooltip.Root;

const TooltipTrigger = BaseTooltip.Trigger;

type TooltipContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof BaseTooltip.Popup>,
  'children'
> & {
  sideOffset?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  showArrow?: boolean;
  children?: React.ReactNode;
};

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof BaseTooltip.Popup>,
  TooltipContentProps
>(
  (
    {
      className,
      sideOffset = 10,
      side = 'top',
      align = 'center',
      showArrow = true,
      children,
      ...props
    },
    ref,
  ) => (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} sideOffset={sideOffset} align={align}>
        <AnimatePresence>
          <BaseTooltip.Popup
            ref={ref}
            render={
              <MotionSurface
                level="popover"
                elevation="none"
                className={cx(
                  '@container-normal max-w-(--available-width) overflow-visible text-sm shadow-xl',
                  className,
                )}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                noContainer
                transition={{ type: 'spring', duration: 0.5 }}
              />
            }
            {...props}
          >
            {showArrow && <TooltipArrow />}
            {children}
          </BaseTooltip.Popup>
        </AnimatePresence>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  ),
);
TooltipContent.displayName = 'TooltipContent';

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="30" height="20" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-surface-popover"
      />
    </svg>
  );
}

type TooltipArrowProps = React.ComponentPropsWithoutRef<
  typeof BaseTooltip.Arrow
>;

const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof BaseTooltip.Arrow>,
  TooltipArrowProps
>(({ className, ...props }, ref) => (
  <BaseTooltip.Arrow
    ref={ref}
    className={cx(
      'data-[side=bottom]:top-[-15px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-14px] data-[side=top]:rotate-180',
      className,
    )}
    {...props}
  >
    <ArrowSvg />
  </BaseTooltip.Arrow>
));
TooltipArrow.displayName = 'TooltipArrow';

export {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
};

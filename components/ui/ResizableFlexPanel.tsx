'use client';

import { Children, forwardRef, type ReactNode } from 'react';
import { useMergeRefs } from 'react-best-merge-refs';
import useResizablePanel from '~/hooks/useResizablePanel';
import { cx } from '~/utils/cva';

type Breakpoint = {
  value: number;
  label: string;
};

type ResizableFlexPanelProps = {
  'storageKey': string;
  'defaultBasis'?: number;
  'min'?: number;
  'max'?: number;
  'breakpoints'?: Breakpoint[];

  'orientation'?: 'horizontal' | 'vertical';
  'keyboardStep'?: number;
  'overrideBasis'?: number;
  'children': [ReactNode, ReactNode];
  'className'?: string;
  'aria-label'?: string;
};

const ResizableFlexPanel = forwardRef<HTMLDivElement, ResizableFlexPanelProps>(
  (
    {
      storageKey,
      defaultBasis = 30,
      min = 10,
      max = 90,
      breakpoints = [],
      orientation = 'horizontal',
      keyboardStep = 2,
      overrideBasis,
      children,
      className,
      'aria-label': ariaLabel,
    },
    forwardedRef,
  ) => {
    const { basis, isDragging, containerRef, handleProps } = useResizablePanel({
      storageKey,
      defaultBasis,
      min,
      max,
      breakpoints,
      orientation,
      keyboardStep,
    });

    const mergedRef = useMergeRefs({ containerRef, forwardedRef });

    const activeBasis = overrideBasis ?? basis;
    const isOverridden = overrideBasis !== undefined;
    const isHorizontal = orientation === 'horizontal';

    const [firstChild, secondChild] = Children.toArray(children);

    return (
      <div
        ref={mergedRef}
        className={cx(
          'flex',
          isHorizontal ? 'flex-row' : 'flex-col',
          isDragging && 'cursor-col-resize select-none',
          !isHorizontal && isDragging && 'cursor-row-resize',
          className,
        )}
      >
        {/* First panel */}
        <div
          className={cx(
            'shrink-0 overflow-hidden',
            isOverridden &&
              'transition-[flex-basis] duration-(--animation-duration-standard) ease-(--animation-easing)',
          )}
          style={{
            flexBasis: `${activeBasis}%`,
            flexGrow: 0,
          }}
        >
          {firstChild}
        </div>

        {/* Resize handle */}
        <div
          role="separator"
          aria-orientation={orientation}
          aria-valuenow={Math.round(activeBasis)}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-label={ariaLabel ?? 'Resize panels'}
          tabIndex={0}
          className={cx(
            'group',
            'focusable relative z-10 flex shrink-0 items-center justify-center',
            'touch-none select-none',
            isHorizontal ? 'w-4 cursor-col-resize' : 'h-4 cursor-row-resize',
            isOverridden && 'pointer-events-none opacity-0',
            'transition-opacity duration-(--animation-duration-standard) ease-(--animation-easing)',
          )}
          {...handleProps}
        >
          {/* Visual grip indicator */}
          <div
            className={cx(
              'rounded-full bg-white/30',
              'spring-[0.5,0.6]',
              'ease-in-out',
              'transition-[background-color,transform] duration-150',
              isHorizontal ? 'h-8 w-1' : 'h-1 w-8',
              isDragging && 'scale-150 bg-white/70',
              !isDragging &&
                !isOverridden &&
                'group-hover:bg-white/50 hover:scale-125 hover:bg-white/50',
            )}
          />
        </div>

        {/* Second panel */}
        <div className={cx('min-h-0 min-w-0 flex-1')}>{secondChild}</div>
      </div>
    );
  },
);

ResizableFlexPanel.displayName = 'ResizableFlexPanel';

export { ResizableFlexPanel };

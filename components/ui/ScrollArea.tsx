'use client';

import { ScrollArea as BaseScrollArea } from '@base-ui-components/react/scroll-area';
import { type ComponentProps, forwardRef } from 'react';
import { cx } from '~/utils/cva';

type ScrollSnapType = 'mandatory' | 'proximity';

type ScrollSnapAxis = 'x' | 'y' | 'both';

type ScrollAreaProps = {
  className?: string;
  viewportClassName?: string;
  children: React.ReactNode;
  /** Whether to show gradient fade at scroll edges. Defaults to true. */
  fade?: boolean;
  /** Enable scroll-snap behavior. Children should use 'snap-start', 'snap-center', or 'snap-end' classes. */
  snap?: ScrollSnapType;
  /** Axis for scroll-snap. Defaults to 'both'. Only applies when snap is set. */
  snapAxis?: ScrollSnapAxis;
} & Omit<ComponentProps<typeof BaseScrollArea.Root>, 'children'>;

const scrollbarClasses = cx(
  // Layout
  'absolute z-2 m-1 flex',
  // Sizing
  'rounded-[1rem]',
  // Appearance
  'bg-current/10 opacity-0',
  // Transitions
  'pointer-events-none transition-opacity duration-250',
  // Hover state
  'data-hovering:pointer-events-auto',
  'data-hovering:opacity-100',
  'data-hovering:duration-75',
  // Scrolling state
  'data-scrolling:pointer-events-auto',
  'data-scrolling:opacity-100',
  'data-scrolling:duration-75',
);

const verticalScrollbarClasses = cx(
  scrollbarClasses,
  // Positioning
  'top-0 right-0 bottom-0',
  // Width
  'tablet:w-[0.325rem] w-[0.25rem]',
);

const horizontalScrollbarClasses = cx(
  scrollbarClasses,
  // Positioning
  'right-0 bottom-0 left-0',
  // Height
  'tablet:h-[0.325rem] h-[0.25rem]',
);

const thumbClasses = cx(
  'rounded-[inherit] bg-current',
  // Larger hit area for easier grabbing
  'before:absolute before:top-1/2 before:left-1/2',
  'before:h-[calc(100%+1rem)] before:w-[calc(100%+1rem)]',
  'before:-translate-x-1/2 before:-translate-y-1/2',
  'before:content-[""]',
);

const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      viewportClassName,
      children,
      fade = true,
      snap,
      snapAxis = 'both',
      ...props
    },
    ref,
  ) => {
    const getSnapClasses = () => {
      if (!snap) return null;
      const snapType =
        snap === 'mandatory' ? 'snap-mandatory' : 'snap-proximity';
      if (snapAxis === 'x') return `snap-x ${snapType}`;
      if (snapAxis === 'y') return `snap-y ${snapType}`;
      return `snap-both ${snapType}`;
    };

    return (
      <BaseScrollArea.Root
        ref={ref}
        className={cx(
          'focusable-after relative flex min-h-0 flex-1',
          className,
        )}
        {...props}
      >
        <BaseScrollArea.Viewport
          className={cx(
            // Required by focusable-after
            'focusable-after-trigger',
            // Layout
            'min-h-0 flex-1 overflow-auto overscroll-contain',
            // Gradient fade effect
            fade && 'scroll-area-viewport',
            // Scroll snap
            getSnapClasses(),
            // Padding when scrollbars are visible (scrollbar width + margin)
            'data-has-overflow-y:pr-[calc(0.25rem+0.5rem)]',
            'data-has-overflow-y:tablet:pr-[calc(0.325rem+0.5rem)]',
            'data-has-overflow-x:pb-[calc(0.25rem+0.5rem)]',
            'data-has-overflow-x:tablet:pb-[calc(0.325rem+0.5rem)]',
            viewportClassName,
          )}
        >
          <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
        </BaseScrollArea.Viewport>

        <BaseScrollArea.Scrollbar
          orientation="vertical"
          className={verticalScrollbarClasses}
        >
          <BaseScrollArea.Thumb className={cx(thumbClasses, 'w-full')} />
        </BaseScrollArea.Scrollbar>

        <BaseScrollArea.Scrollbar
          orientation="horizontal"
          className={horizontalScrollbarClasses}
        >
          <BaseScrollArea.Thumb className={cx(thumbClasses, 'h-full')} />
        </BaseScrollArea.Scrollbar>

        <BaseScrollArea.Corner />
      </BaseScrollArea.Root>
    );
  },
);

ScrollArea.displayName = 'ScrollArea';

export {
  ScrollArea,
  type ScrollAreaProps,
  type ScrollSnapAxis,
  type ScrollSnapType,
};

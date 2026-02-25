'use client';

import { motion } from 'motion/react';
import {
  type CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useMergeRefs } from 'react-best-merge-refs';
import { cx } from '~/utils/cva';

type ScrollSnapType = 'mandatory' | 'proximity';

type ScrollSnapAxis = 'x' | 'y' | 'both';

// Props that should go on the viewport (inner scrollable element) rather than the container
type ViewportProps = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  'onKeyDown' | 'onKeyUp' | 'onFocus' | 'onBlur' | 'tabIndex'
>;

type ScrollAreaProps = {
  viewportClassName?: string;
  /** Whether to show gradient fade at scroll edges. Defaults to true. */
  fade?: boolean;
  /** Scroll orientation. Defaults to 'vertical'. */
  orientation?: 'vertical' | 'horizontal';
  /** Enable scroll-snap behavior. Children should use 'snap-start', 'snap-center', or 'snap-end' classes. */
  snap?: ScrollSnapType;
  /** Axis for scroll-snap. Defaults to 'both'. Only applies when snap is set. */
  snapAxis?: ScrollSnapAxis;
  /**
   * Change this value to force a re-measurement of scroll dimensions.
   * Useful when children run layout animations (e.g. Framer Motion `layout`)
   * that temporarily distort scrollWidth/clientWidth. Pass a value that
   * changes when the animation completes to trigger a fresh measurement.
   */
  remeasureKey?: unknown;
} & ViewportProps &
  Omit<
    React.HTMLAttributes<HTMLDivElement>,
    | 'onDrag'
    | 'onDragEnd'
    | 'onDragStart'
    | 'onAnimationStart'
    | 'onAnimationEnd'
    | 'onAnimationIteration'
    // Viewport props - handled separately
    | 'onKeyDown'
    | 'onKeyUp'
    | 'onFocus'
    | 'onBlur'
    | 'tabIndex'
  >;

const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      viewportClassName,
      children,
      fade = true,
      orientation = 'vertical',
      snap,
      snapAxis = 'both',
      remeasureKey,
      // Viewport props - these go on the inner scrollable element
      onKeyDown,
      onKeyUp,
      onFocus,
      onBlur,
      tabIndex,
      ...rest
    },
    ref,
  ) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const rafIdRef = useRef<number | null>(null);

    const updateScrollVariables = useCallback(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      // Cancel any pending rAF to avoid stale updates during animations
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;

        // Verify viewport still exists after async callbacks
        if (!viewportRef.current) return;

        const {
          scrollTop,
          scrollHeight,
          clientHeight,
          scrollLeft,
          scrollWidth,
          clientWidth,
        } = viewportRef.current;

        // Vertical overflow
        const hasVerticalOverflow = scrollHeight > clientHeight;
        const overflowYStart = hasVerticalOverflow ? scrollTop : 0;
        const overflowYEnd = hasVerticalOverflow
          ? Math.max(0, scrollHeight - clientHeight - scrollTop)
          : 0;

        viewportRef.current.style.setProperty(
          '--scroll-area-overflow-y-start',
          `${overflowYStart}px`,
        );
        viewportRef.current.style.setProperty(
          '--scroll-area-overflow-y-end',
          `${overflowYEnd}px`,
        );

        // Inset fade pseudo-elements to avoid covering the scrollbar
        const scrollbarWidth =
          viewportRef.current.offsetWidth - viewportRef.current.clientWidth;
        viewportRef.current.style.setProperty(
          '--scrollbar-width',
          `${scrollbarWidth}px`,
        );

        // Horizontal overflow
        const hasHorizontalOverflow = scrollWidth > clientWidth;
        const overflowXStart = hasHorizontalOverflow ? scrollLeft : 0;
        const overflowXEnd = hasHorizontalOverflow
          ? Math.max(0, scrollWidth - clientWidth - scrollLeft)
          : 0;

        viewportRef.current.style.setProperty(
          '--scroll-area-overflow-x-start',
          `${overflowXStart}px`,
        );
        viewportRef.current.style.setProperty(
          '--scroll-area-overflow-x-end',
          `${overflowXEnd}px`,
        );

        const scrollbarHeight =
          viewportRef.current.offsetHeight - viewportRef.current.clientHeight;
        viewportRef.current.style.setProperty(
          '--scrollbar-height',
          `${scrollbarHeight}px`,
        );
      });
    }, []);

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport || !fade) return;

      // Initial update
      updateScrollVariables();

      // Update on scroll
      viewport.addEventListener('scroll', updateScrollVariables, {
        passive: true,
      });

      // Update on resize (content or viewport size changes)
      const resizeObserver = new ResizeObserver(updateScrollVariables);
      resizeObserver.observe(viewport);

      return () => {
        viewport.removeEventListener('scroll', updateScrollVariables);
        resizeObserver.disconnect();
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }
      };
    }, [fade, updateScrollVariables]);

    useEffect(() => {
      updateScrollVariables();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remeasureKey]);

    const getSnapClasses = () => {
      if (!snap) return null;
      const snapType =
        snap === 'mandatory' ? 'snap-mandatory' : 'snap-proximity';
      if (snapAxis === 'x') return `snap-x ${snapType}`;
      if (snapAxis === 'y') return `snap-y ${snapType}`;
      return `snap-both ${snapType}`;
    };

    const isHorizontal = orientation === 'horizontal';

    return (
      <motion.div
        className={cx('relative flex h-full min-h-0 flex-1', className)}
      >
        <motion.div
          layoutScroll
          ref={useMergeRefs({ viewportRef, ref })}
          tabIndex={tabIndex ?? 0}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cx(
            'focusable',
            'p-2',
            // Layout
            isHorizontal
              ? 'min-w-0 flex-auto overflow-x-auto overflow-y-hidden overscroll-contain'
              : 'min-h-0 flex-1 overflow-auto overscroll-contain',
            // Gradient fade effect
            fade &&
              (isHorizontal
                ? 'scroll-area-viewport-x'
                : 'scroll-area-viewport'),
            // Scroll snap
            getSnapClasses(),
            viewportClassName,
          )}
          style={
            {
              '--scroll-area-overflow-y-start': '0px',
              '--scroll-area-overflow-y-end': '0px',
              '--scrollbar-width': '0px',
              '--scroll-area-overflow-x-start': '0px',
              '--scroll-area-overflow-x-end': '0px',
              '--scrollbar-height': '0px',
            } as CSSProperties
          }
          {...rest}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  },
);

ScrollArea.displayName = 'ScrollArea';

export { ScrollArea, type ScrollAreaProps };

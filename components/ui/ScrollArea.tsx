'use client';

import { motion } from 'motion/react';
import {
  type CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
} from 'react';
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
};

const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      viewportClassName,
      children,
      fade = true,
      snap,
      snapAxis = 'both',
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

        const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;

        // Only show fade when there's actual overflow
        const hasOverflow = scrollHeight > clientHeight;

        // Calculate distance from top and bottom edges
        const overflowStart = hasOverflow ? scrollTop : 0;
        const overflowEnd = hasOverflow
          ? Math.max(0, scrollHeight - clientHeight - scrollTop)
          : 0;

        // Set CSS variables for the fade effect
        viewportRef.current.style.setProperty(
          '--scroll-area-overflow-y-start',
          `${overflowStart}px`,
        );
        viewportRef.current.style.setProperty(
          '--scroll-area-overflow-y-end',
          `${overflowEnd}px`,
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

    const getSnapClasses = () => {
      if (!snap) return null;
      const snapType =
        snap === 'mandatory' ? 'snap-mandatory' : 'snap-proximity';
      if (snapAxis === 'x') return `snap-x ${snapType}`;
      if (snapAxis === 'y') return `snap-y ${snapType}`;
      return `snap-both ${snapType}`;
    };

    return (
      <motion.div
        ref={ref}
        className={cx(
          'focusable-after relative flex min-h-0 flex-1',
          // Negative margin to offset the Viewport's internal padding
          '-mx-4 -my-2',
          className,
        )}
        {...rest}
      >
        <motion.div
          layoutScroll
          ref={viewportRef}
          tabIndex={0}
          className={cx(
            // Required by focusable-after
            'focusable-after-trigger',
            // Layout
            'min-h-0 flex-1 overflow-auto overscroll-contain',
            // Padding to prevent animated elements from clipping (inside scroll bounds)
            'px-4',
            // Extra padding at bottom to prevent clipping of shadows/effects
            'py-2',
            // Gradient fade effect
            fade && 'scroll-area-viewport',
            // Scroll snap
            getSnapClasses(),
            viewportClassName,
          )}
          style={
            {
              // Initialize CSS variables for fade effect
              '--scroll-area-overflow-y-start': '0px',
              '--scroll-area-overflow-y-end': '0px',
            } as CSSProperties
          }
        >
          {children}
        </motion.div>
      </motion.div>
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

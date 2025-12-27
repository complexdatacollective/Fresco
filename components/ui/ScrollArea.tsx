'use client';

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

/**
 * Check if any ancestor element has an active CSS transform applied.
 * This indicates a layout animation (e.g., motion layoutId) is in progress.
 */
function hasAncestorTransform(element: HTMLElement): boolean {
  let current: HTMLElement | null = element.parentElement;
  while (current) {
    const transform = current.style.transform;
    if (transform && transform !== 'none') {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      viewportClassName,
      children,
      fade = true,
      snap,
      snapAxis = 'both',
    },
    ref,
  ) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updateScrollVariables = useCallback(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      // Cancel any pending retry to avoid stale updates
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Check if an ancestor has an active transform (animation in progress).
      // During layout animations (e.g., motion layoutId), scrollHeight can
      // return incorrect values. If animation detected, retry after a delay.
      if (hasAncestorTransform(viewport)) {
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          updateScrollVariables();
        }, 50);
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = viewport;

      // Only show fade when there's actual overflow
      const hasOverflow = scrollHeight > clientHeight;

      // Calculate distance from top and bottom edges
      const overflowStart = hasOverflow ? scrollTop : 0;
      const overflowEnd = hasOverflow
        ? Math.max(0, scrollHeight - clientHeight - scrollTop)
        : 0;

      // Set CSS variables for the fade effect
      viewport.style.setProperty(
        '--scroll-area-overflow-y-start',
        `${overflowStart}px`,
      );
      viewport.style.setProperty(
        '--scroll-area-overflow-y-end',
        `${overflowEnd}px`,
      );
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
        if (retryTimeoutRef.current !== null) {
          clearTimeout(retryTimeoutRef.current);
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
      <div
        ref={ref}
        className={cx(
          'focusable-after relative flex min-h-0 flex-1',
          // Negative margin to offset the Viewport's internal padding
          '-mx-4 -my-2',
          className,
        )}
      >
        <div
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
        </div>
      </div>
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

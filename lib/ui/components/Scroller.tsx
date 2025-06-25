import cx from 'classnames';
import { clamp } from 'es-toolkit';
import React, { forwardRef, useCallback, type ReactNode } from 'react';

type ScrollerProps = {
  /** Content to be scrolled */
  children: ReactNode;
  /** Additional class names to apply to the scroller */
  className?: string;
  /** Callback fired when scrolling occurs */
  onScroll?: (
    scrollTop: number,
    clampedScrollAmount: number,
    scrollAmount: number,
  ) => void;
  /** Whether to use smooth scrolling behavior */
  useSmoothScrolling?: boolean;
}

const Scroller = forwardRef<HTMLDivElement, ScrollerProps>(function Scroller(
  { className, children, useSmoothScrolling = true, onScroll },
  ref,
) {
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onScroll) return;

      const element = e.currentTarget;
      const { scrollTop } = element;
      const maxScrollPosition = element.scrollHeight - element.clientHeight;
      const scrollAmount = scrollTop / maxScrollPosition;

      // iOS inertial scrolling takes values out of range
      const clampedScrollAmount = clamp(scrollAmount, 0, 1);

      onScroll(scrollTop, clampedScrollAmount, scrollAmount);
    },
    [onScroll],
  );

  return (
    <div
      className={cx('scrollable', className)}
      onScroll={handleScroll}
      style={{ scrollBehavior: useSmoothScrolling ? 'smooth' : 'unset' }}
      ref={ref}
    >
      {children}
    </div>
  );
});

export default Scroller;

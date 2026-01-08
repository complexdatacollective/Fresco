'use client';

import { cx } from '~/utils/cva';
import { type DropTarget } from './types';

export type DropIndicatorProps = {
  /** Target describing where items will be dropped */
  target: DropTarget;
  /** Additional CSS classes */
  className?: string;
};

/**
 * Visual indicator showing where items will be dropped.
 * Renders a horizontal line at the insertion point.
 */
export function DropIndicator({ target, className }: DropIndicatorProps) {
  const isOnDrop = target.position === 'on';

  if (isOnDrop) {
    return (
      <div
        className={cx(
          'border-primary bg-primary/10 pointer-events-none absolute inset-0 rounded border-2',
          className,
        )}
        data-drop-indicator="on"
        data-target-key={target.key}
      />
    );
  }

  return (
    <div
      className={cx(
        'bg-primary pointer-events-none absolute right-0 left-0 z-10 h-1',
        target.position === 'before' ? '-top-0.5' : '-bottom-0.5',
        className,
      )}
      data-drop-indicator={target.position}
      data-target-key={target.key}
    >
      <div className="bg-primary absolute top-1/2 left-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg" />
      <div className="bg-primary absolute top-1/2 right-0 h-3 w-3 translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg" />
    </div>
  );
}

'use client';

import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { cx } from '~/utils/cva';

export type RangeItem = {
  value: number;
  label: string;
  disabled?: boolean;
};

type RangePickerProps = {
  type: 'year' | 'month' | 'day';
  range: RangeItem[];
  value: number | null;
  today?: number | null;
  onSelect: (value: number) => void;
  offset?: number;
  className?: string;
};

export function RangePicker({
  type,
  range,
  value,
  today,
  onSelect,
  offset = 0,
  className,
}: RangePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to selected or today's value
  useEffect(() => {
    if (type !== 'year') return;

    const scrollTarget = value ? selectedRef.current : todayRef.current;
    if (scrollTarget && containerRef.current) {
      const { offsetTop, offsetHeight } = scrollTarget;
      containerRef.current.scrollTop = offsetTop - offsetHeight * 0.5;
    }
  }, [type, value]);

  // Add empty cells for offset (for calendar grid alignment)
  const offsetCells =
    offset > 0
      ? Array.from({ length: offset }, (_, i) => (
          <div key={`offset-${i}`} className="w-full" aria-hidden="true" />
        ))
      : [];

  // console.log(`RangePicker ${type}: Items:`, range.length, 'Value:', value, 'Today:', today);

  const getGridClasses = () => {
    switch (type) {
      case 'year':
        return 'grid grid-cols-5 gap-1 p-2'; // 5 columns for years
      case 'month':
        return 'grid grid-cols-3 gap-2 p-2'; // 3 columns for months
      case 'day':
        return 'grid grid-cols-7 gap-1 p-2'; // 7 columns for days of week
      default:
        return 'grid gap-1 p-2';
    }
  };

  return (
    <div
      ref={containerRef}
      className={cx(
        'w-full',
        type === 'year' && 'h-64 overflow-y-auto',
        className,
      )}
    >
      <div className={getGridClasses()}>
        {offsetCells}
        {range.map((item) => {
          const isSelected = value === item.value;
          const isToday = today === item.value;
          const ref = isSelected ? selectedRef : isToday ? todayRef : undefined;

          return (
            <motion.button
              key={item.value}
              ref={ref}
              onClick={() => !item.disabled && onSelect(item.value)}
              disabled={item.disabled}
              className={cx(
                'relative rounded-md text-sm transition-colors',
                'hover:bg-muted',
                'focus:ring-ring focus:ring-2 focus:ring-offset-1 focus:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center justify-center',
                type === 'year' && 'min-w-[60px] px-2 py-2',
                type === 'month' && 'min-w-[80px] px-3 py-2',
                type === 'day' && 'aspect-square p-2',
                isSelected &&
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                isToday && !isSelected && 'text-primary font-semibold',
              )}
              data-value={item.value}
              aria-label={`${type} ${item.label}`}
              aria-selected={isSelected}
              aria-current={isToday ? 'date' : undefined}
            >
              {item.label}
              {isToday && !isSelected && (
                <span className="bg-primary absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 transform rounded-full" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { type ComponentPropsWithoutRef } from 'react';

type DataTableCheckboxProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'type' | 'role'
> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Lightweight checkbox for DataTable row/header selection.
 * Avoids the ~15-hook overhead of @base-ui/react's CheckboxRoot
 * which causes rendering bottlenecks when many checkboxes update
 * simultaneously (e.g. "select all" toggling 10+ rows).
 */
export function DataTableCheckbox({
  checked,
  onCheckedChange,
  className,
  ...props
}: DataTableCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-checked={checked ? '' : undefined}
      onClick={() => onCheckedChange(!checked)}
      className={[
        'focusable flex aspect-square h-6 items-center justify-center rounded-full',
        'bg-input text-input-contrast border-2',
        'transition-colors duration-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="text-primary size-full p-[0.1em]"
        stroke="currentColor"
        strokeWidth="3"
      >
        <path
          d="M4 12L10 18L20 6"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: checked ? 0 : 1,
            strokeLinecap: checked ? 'round' : 'butt',
            transition: 'stroke-dashoffset 0.2s ease-out',
          }}
        />
      </svg>
    </button>
  );
}

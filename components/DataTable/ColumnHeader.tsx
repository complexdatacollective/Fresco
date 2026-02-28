import { type Column } from '@tanstack/react-table';
import { ArrowUp, ArrowUpDown } from 'lucide-react';

import { motion } from 'motion/react';
import React, { type ReactNode } from 'react';
import { cx } from '~/utils/cva';
import Button, { buttonVariants } from '../ui/Button';

const MotionArrow = motion.create(ArrowUp);

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>;

/**
 * A column header component for a data table that supports sorting.
 *
 * If the column is sortable, and the current column is the active sort column,
 * it displays a green arrow indicating the sort direction (ascending or descending).
 *
 * If the column is sortable but not the active sort column, it displays a neutral
 * dual arrow icon.
 *
 * If the column is not sortable, it simply displays the title.
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  'use no memo';
  const headerClasses = cx(
    buttonVariants({ variant: 'text', size: 'sm' }),
    'pointer-events-none -mx-4 min-w-max px-4! text-base',
    className,
  );

  if (!column.getCanSort()) {
    return <div className={headerClasses}>{title}</div>;
  }

  const isActive = column.getIsSorted() !== false;

  return (
    <Button
      size="sm"
      className="-mx-4 min-w-max px-4! text-base"
      variant={isActive ? 'default' : 'text'}
      onClick={() => column.toggleSorting()}
      color={isActive ? 'primary' : 'default'}
      iconPosition="right"
      icon={
        column.getIsSorted() !== false ? (
          <MotionArrow
            className="text-success size-4"
            animate={column.getIsSorted() === 'asc' ? { rotate: 180 } : {}}
          />
        ) : (
          <ArrowUpDown className="size-4" />
        )
      }
    >
      {title}
    </Button>
  );
}

'use client';

import { type Table } from '@tanstack/react-table';
import { CrossIcon } from 'lucide-react';
import React from 'react';
import { Button } from '~/components/ui/Button';
import { cx } from '~/utils/cva';
import Surface from '../layout/Surface';

type DataTableFloatingBarProps<TData> = {
  table: Table<TData>;
} & React.HTMLAttributes<HTMLElement>;

export function DataTableFloatingBar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableFloatingBarProps<TData>) {
  if (table.getFilteredSelectedRowModel().rows.length <= 0) return null;

  return (
    <Surface
      className={cx('mx-auto flex w-fit items-center gap-2 rounded', className)}
      {...props}
    >
      <Button
        aria-label="Clear selection"
        title="Clear"
        onClick={() => table.toggleAllRowsSelected(false)}
      >
        <CrossIcon className="size-4" aria-hidden="true" />
      </Button>
      {table.getFilteredSelectedRowModel().rows.length} row(s) selected
      {children}
    </Surface>
  );
}

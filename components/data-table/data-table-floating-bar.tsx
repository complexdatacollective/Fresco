'use client';

import React from 'react';
import { type Table } from '@tanstack/react-table';
import { Button } from '~/components/ui/Button';
import { cx } from '~/utils/cva';
import { CrossIcon } from 'lucide-react';

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
    <div
      className={cx(
        'mx-auto flex w-fit items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-white',
        className,
      )}
      {...props}
    >
      <Button
        aria-label="Clear selection"
        title="Clear"
        className="h-auto bg-transparent p-1 text-white hover:bg-zinc-700"
        onClick={() => table.toggleAllRowsSelected(false)}
      >
        <CrossIcon className="size-4" aria-hidden="true" />
      </Button>
      {table.getFilteredSelectedRowModel().rows.length} row(s) selected
      {children}
    </div>
  );
}

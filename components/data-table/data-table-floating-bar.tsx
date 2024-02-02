'use client';

import React from 'react';
import { type Table } from '@tanstack/react-table';
import { Button } from '~/components/ui/Button';
import { cn } from '~/utils/shadcn';
import { CrossIcon } from 'lucide-react';

type DataTableFloatingBarProps<TData> = {
  table: Table<TData>;
} & React.HTMLAttributes<HTMLElement>

export function DataTableFloatingBar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableFloatingBarProps<TData>) {
  if (table.getFilteredSelectedRowModel().rows.length <= 0) return null;

  return (
    <div
      className={cn(
        'bg-zinc-900 text-white mx-auto flex w-fit items-center gap-2 rounded-md px-4 py-2',
        className,
      )}
      {...props}
    >
      <Button
        aria-label="Clear selection"
        title="Clear"
        className="bg-transparent text-white hover:bg-zinc-700 h-auto p-1"
        onClick={() => table.toggleAllRowsSelected(false)}
      >
        <CrossIcon className="size-4" aria-hidden="true" />
      </Button>
      {table.getFilteredSelectedRowModel().rows.length} row(s) selected
      {children}
    </div>
  );
}

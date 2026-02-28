'use client';

import { type Table } from '@tanstack/react-table';
import { CrossIcon } from 'lucide-react';
import { type HTMLAttributes } from 'react';
import { Button } from '~/components/ui/Button';
import { cx } from '~/utils/cva';
import Surface from '../layout/Surface';

type DataTableFloatingBarProps<TData> = {
  table: Table<TData>;
} & HTMLAttributes<HTMLElement>;

export function DataTableFloatingBar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableFloatingBarProps<TData>) {
  'use no memo';
  if (table.getFilteredSelectedRowModel().rows.length <= 0) return null;

  return (
    <Surface
      className={cx(
        'fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2',
        className,
      )}
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

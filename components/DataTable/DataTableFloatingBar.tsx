'use client';

import { type Table } from '@tanstack/react-table';
import { type HTMLAttributes } from 'react';
import { cx } from '~/utils/cva';
import Surface from '../layout/Surface';
import Paragraph from '../typography/Paragraph';
import CloseButton from '../ui/CloseButton';

type DataTableFloatingBarProps<TData> = {
  table: Table<TData>;
} & HTMLAttributes<HTMLElement>;

export function DataTableFloatingBar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableFloatingBarProps<TData>) {
  // TanStack Table returns a mutable ref with stable identity, defeating React Compiler memoization.
  'use no memo';
  if (table.getFilteredSelectedRowModel().rows.length <= 0) return null;

  return (
    <Surface
      className={cx(
        'fixed inset-x-4 bottom-4 z-50 mx-auto flex w-fit flex-wrap items-center justify-center gap-4 rounded',
        className,
      )}
      noContainer
      {...props}
    >
      <Paragraph className="shrink-0 grow" margin="none">
        {table.getFilteredSelectedRowModel().rows.length} row
        {table.getFilteredSelectedRowModel().rows.length === 1 ? '' : 's'}{' '}
        selected
      </Paragraph>
      <div className="flex gap-2">{children}</div>
      <CloseButton
        className="grow"
        onClick={() => table.toggleAllRowsSelected(false)}
        aria-label="Close selection bar"
      />
    </Surface>
  );
}

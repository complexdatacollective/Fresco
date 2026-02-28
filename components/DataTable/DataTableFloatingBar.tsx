'use client';

import { type Table } from '@tanstack/react-table';
import { AnimatePresence } from 'motion/react';
import { type ComponentProps } from 'react';
import { cx } from '~/utils/cva';
import { MotionSurface } from '../layout/Surface';
import Paragraph from '../typography/Paragraph';
import CloseButton from '../ui/CloseButton';

type DataTableFloatingBarProps<TData> = {
  table: Table<TData>;
} & Omit<ComponentProps<typeof MotionSurface>, 'table'>;

export function DataTableFloatingBar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableFloatingBarProps<TData>) {
  // TanStack Table returns a mutable ref with stable identity, defeating React Compiler memoization.
  'use no memo';
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <MotionSurface
          key="floating-bar"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
          className={cx(
            'fixed inset-x-4 bottom-4 z-50 mx-auto flex w-fit flex-wrap items-center justify-center gap-4 rounded',
            className,
          )}
          noContainer
          {...props}
        >
          <Paragraph className="shrink-0 grow" margin="none">
            {selectedCount} row
            {selectedCount === 1 ? '' : 's'} selected
          </Paragraph>
          <div className="flex gap-2">{children}</div>
          <CloseButton
            className="grow"
            onClick={() => table.toggleAllRowsSelected(false)}
            aria-label="Close selection bar"
          />
        </MotionSurface>
      )}
    </AnimatePresence>
  );
}

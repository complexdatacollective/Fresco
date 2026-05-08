'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@codaco/fresco-ui/Table';
import { cx } from '@codaco/fresco-ui/utils/cva';
import {
  type Column,
  flexRender,
  type Row,
  type Table as TTable,
} from '@tanstack/react-table';
import { type ReactNode } from 'react';
import { DataTablePagination } from './DataTablePagination';

function getColumnHighlight<TData>(column: Column<TData, unknown>) {
  const isSorted = column.getIsSorted();
  const isFiltered = column.getIsFiltered();
  if (isSorted && isFiltered)
    return 'bg-[color-mix(in_oklab,var(--sea-green)_5%,var(--selected)_5%)]';
  if (isSorted)
    return 'bg-[color-mix(in_oklab,var(--sea-green)_5%,transparent)]';
  if (isFiltered)
    return 'bg-[color-mix(in_oklab,var(--selected)_5%,transparent)]';
  return undefined;
}

type DataTableProps<TData> = {
  table: TTable<TData>;
  toolbar?: ReactNode;
  floatingBar?: ReactNode;
  showPagination?: boolean;
  surfaceLevel?: 0 | 1 | 2 | 3;
  emptyText?: string;
  getRowClasses?: (row: Row<TData>) => string | undefined;
};

export function DataTable<TData>({
  table,
  toolbar,
  floatingBar,
  showPagination = true,
  surfaceLevel = 0,
  emptyText = 'No results.',
  getRowClasses,
}: DataTableProps<TData>) {
  // TanStack Table returns a mutable ref with stable identity, defeating React Compiler memoization.
  'use no memo';
  const columnCount = table.getAllColumns().length;

  return (
    <div className="flex flex-col gap-6">
      {toolbar}
      <Table surfaceProps={{ level: surfaceLevel }} data-testid="data-table">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cx(getColumnHighlight(header.column))}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={getRowClasses?.(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cx(getColumnHighlight(cell.column))}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-24 text-center">
                {emptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {showPagination && <DataTablePagination table={table} />}
      {floatingBar}
    </div>
  );
}

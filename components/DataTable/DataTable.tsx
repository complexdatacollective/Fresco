'use client';

import {
  flexRender,
  type Row,
  type Table as TTable,
} from '@tanstack/react-table';
import { type ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { DataTablePagination } from './DataTablePagination';

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
  const columnCount = table.getAllColumns().length;

  return (
    <div className="flex flex-col gap-6">
      {toolbar}
      <Table surfaceProps={{ level: surfaceLevel }} data-testid="data-table">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
                  <TableCell key={cell.id}>
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

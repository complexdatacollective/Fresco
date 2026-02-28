'use client';

import {
  type Renderable,
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

// Renders a column definition's header/cell function directly, bypassing
// React's component memoization. This ensures column render functions
// always re-evaluate with current table state.
// TanStack Table's flexRender mounts column render functions as React
// components (<Comp {...props} />), which React Compiler auto-memoizes.
// Since the table object is a mutable ref with stable identity, the
// compiler treats it as "unchanged" and skips re-renders. Calling the
// function directly avoids this memoization boundary.
function renderDirect<TProps extends object>(
  render: Renderable<TProps>,
  props: TProps,
): ReactNode {
  if (!render) return null;
  if (typeof render === 'function') {
    return (render as (props: TProps) => ReactNode)(props);
  }
  return render as ReactNode;
}

type DataTableProps<TData> = {
  table: TTable<TData>;
  // Incrementing counter that forces re-render when table state changes.
  // useReactTable returns a mutable object with stable identity, so React
  // Compiler may skip re-renders without this signal.
  tableVersion?: number;
  toolbar?: ReactNode;
  floatingBar?: ReactNode;
  showPagination?: boolean;
  surfaceLevel?: 0 | 1 | 2 | 3;
  emptyText?: string;
  getRowClasses?: (row: Row<TData>) => string | undefined;
};

export function DataTable<TData>({
  table,
  tableVersion = 0,
  toolbar,
  floatingBar,
  showPagination = true,
  surfaceLevel = 0,
  emptyText = 'No results.',
  getRowClasses,
}: DataTableProps<TData>) {
  'use no memo';
  const columnCount = table.getAllColumns().length;

  return (
    <div className="flex flex-col gap-6" data-table-version={tableVersion}>
      {toolbar}
      <Table surfaceProps={{ level: surfaceLevel }} data-testid="data-table">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : renderDirect(
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
                    {renderDirect(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )}
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

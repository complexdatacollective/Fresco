'use client';

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';

type UseClientDataTableOptions<TData, TValue> = {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  enablePagination?: boolean;
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  defaultSortBy?: { id: string; desc: boolean };
};

export function useClientDataTable<TData, TValue>({
  data,
  columns,
  enablePagination = true,
  enableRowSelection = true,
  defaultSortBy,
}: UseClientDataTableOptions<TData, TValue>) {
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>(
    defaultSortBy ? [{ ...defaultSortBy }] : [],
  );
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(enablePagination && {
      getPaginationRowModel: getPaginationRowModel(),
    }),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection,
    state: {
      sorting,
      rowSelection,
      columnFilters,
    },
  });

  return { table };
}

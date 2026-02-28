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
  type Updater,
} from '@tanstack/react-table';
import { useCallback, useState } from 'react';

type UseClientDataTableOptions<TData, TValue> = {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  enablePagination?: boolean;
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  defaultSortBy?: { id: string; desc: boolean };
};

// TanStack Table's useReactTable returns a mutable object whose identity
// never changes (stored in a ref). React Compiler may skip re-renders of
// child components that receive the table object because the reference is
// stable. The tableVersion counter increments on every state change,
// providing a primitive value that child components can depend on to
// ensure they re-render when table state changes.
export function useClientDataTable<TData, TValue>({
  data,
  columns,
  enablePagination = true,
  enableRowSelection = true,
  defaultSortBy,
}: UseClientDataTableOptions<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(
    defaultSortBy ? [{ ...defaultSortBy }] : [],
  );
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [tableVersion, setTableVersion] = useState(0);

  const trackSorting = useCallback((updater: Updater<SortingState>) => {
    setSorting(updater);
    setTableVersion((v) => v + 1);
  }, []);

  const trackRowSelection = useCallback(
    (updater: Updater<Record<string, boolean>>) => {
      setRowSelection(updater);
      setTableVersion((v) => v + 1);
    },
    [],
  );

  const trackColumnFilters = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      setColumnFilters(updater);
      setTableVersion((v) => v + 1);
    },
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(enablePagination && {
      getPaginationRowModel: getPaginationRowModel(),
    }),
    onSortingChange: trackSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: trackRowSelection,
    onColumnFiltersChange: trackColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection,
    state: {
      sorting,
      rowSelection,
      columnFilters,
    },
  });

  return { table, tableVersion };
}

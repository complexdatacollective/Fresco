'use client';

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type Row,
  type SortingState,
} from '@tanstack/react-table';
import { parseAsJson, useQueryState } from 'nuqs';
import { useState } from 'react';
import { z } from 'zod/mini';

const ColumnFiltersStateSchema = z.array(
  z.object({
    id: z.string(),
    value: z.unknown(),
  }),
);

type UseClientDataTableOptions<TData, TValue> = {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  enablePagination?: boolean;
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  enableUrlFilters?: boolean;
  defaultSortBy?: { id: string; desc: boolean };
};

export function useClientDataTable<TData, TValue>({
  data,
  columns,
  enablePagination = true,
  enableRowSelection = true,
  enableUrlFilters = false,
  defaultSortBy,
}: UseClientDataTableOptions<TData, TValue>) {
  // TanStack Table returns a mutable ref with stable identity, defeating React Compiler memoization.
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>(
    defaultSortBy ? [{ ...defaultSortBy }] : [],
  );
  const [rowSelection, setRowSelection] = useState({});

  const [urlFilters, setUrlFilters] = useQueryState(
    'filters',
    parseAsJson<ColumnFiltersState>(
      // z.unknown() infers value as optional, but ColumnFiltersState requires it
      (value) => ColumnFiltersStateSchema.parse(value) as ColumnFiltersState,
    ).withDefault([]),
  );
  const [localFilters, setLocalFilters] = useState<ColumnFiltersState>([]);
  const columnFilters = enableUrlFilters ? urlFilters : localFilters;

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = enableUrlFilters
    ? (updaterOrValue) => {
        void setUrlFilters((prev) => {
          const current = prev ?? [];
          return typeof updaterOrValue === 'function'
            ? updaterOrValue(current)
            : updaterOrValue;
        });
      }
    : setLocalFilters;

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
    onColumnFiltersChange,
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

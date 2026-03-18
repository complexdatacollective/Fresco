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
import { ColumnFiltersStateSchema } from '~/components/DataTable/filters/types';

type UseClientDataTableOptions<TData, TValue> = {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  enablePagination?: boolean;
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  defaultSortBy?: { id: string; desc: boolean };
  enableUrlFilters?: boolean;
};

export function useClientDataTable<TData, TValue>({
  data,
  columns,
  enablePagination = true,
  enableRowSelection = true,
  defaultSortBy,
  enableUrlFilters,
}: UseClientDataTableOptions<TData, TValue>) {
  // TanStack Table returns a mutable ref with stable identity, defeating React Compiler memoization.
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>(
    defaultSortBy ? [{ ...defaultSortBy }] : [],
  );
  const [rowSelection, setRowSelection] = useState({});

  // ColumnFiltersStateSchema uses z.unknown() for value, which Zod infers
  // as optional. The assertion narrows to TanStack's ColumnFiltersState where
  // value is required — safe because Zod validates the structure.
  const [urlFilters, setUrlFilters] = useQueryState(
    'filters',
    parseAsJson<ColumnFiltersState>(
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

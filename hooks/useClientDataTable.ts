'use client';

import {
  useTable,
  type ColumnFiltersState,
  type OnChangeFn,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { parseAsJson, useQueryState } from 'nuqs';
import { useState } from 'react';
import { z } from 'zod/mini';

import {
  dataTableFeatures,
  type DataTableFeatures,
} from '@codaco/fresco-ui/DataTable/features';
import { type DataTableColumnDef } from '@codaco/fresco-ui/DataTable/types';

const ColumnFiltersStateSchema = z.array(
  z.object({
    id: z.string(),
    value: z.unknown(),
  }),
);

type UseClientDataTableOptions<TData extends RowData> = {
  data: TData[];
  columns: DataTableColumnDef<TData>[];
  enablePagination?: boolean;
  enableRowSelection?:
    | boolean
    | ((row: Row<DataTableFeatures, TData>) => boolean);
  enableUrlFilters?: boolean;
  defaultSortBy?: { id: string; desc: boolean };
};

export function useClientDataTable<TData extends RowData>({
  data,
  columns,
  enablePagination = true,
  enableRowSelection = true,
  enableUrlFilters = false,
  defaultSortBy,
}: UseClientDataTableOptions<TData>) {
  // TanStack Table returns a mutable ref with stable identity, defeating React Compiler memoization.
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>(
    defaultSortBy ? [{ ...defaultSortBy }] : [],
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    // Without pagination every row renders on one page: `manualPagination`
    // skips the paginated row model, as leaving it unregistered did in v8.
    manualPagination: !enablePagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange,
    enableRowSelection,
    state: {
      sorting,
      rowSelection,
      columnFilters,
    },
  });

  return { table };
}

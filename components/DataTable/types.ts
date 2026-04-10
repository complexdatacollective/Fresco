import { type ColumnDef } from '@tanstack/react-table';

export type Option = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
};

/**
 * A stricter `ColumnDef` that requires `sortingFn` on every sortable column.
 * Columns that set `enableSorting: false` are exempt.
 */
export type StrictColumnDef<TData, TValue = unknown> =
  | (ColumnDef<TData, TValue> & { enableSorting: false })
  | (ColumnDef<TData, TValue> & {
      sortingFn: NonNullable<ColumnDef<TData, TValue>['sortingFn']>;
    });

export type DataTableSearchableColumn<TData> = {
  id: keyof TData | (string & {});
  title: string;
};

export type DataTableFilterableColumn<TData> = {
  options: Option[];
} & DataTableSearchableColumn<TData>;

export const pageSizes = [10, 20, 50, 100] as const;

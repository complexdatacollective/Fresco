'use client';

import type { Table } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import { type ReactNode } from 'react';
import {
  type DataTableFilterableColumn,
  type DataTableSearchableColumn,
} from '~/components/DataTable/types';
import { Button } from '~/components/ui/Button';
import InputField from '~/lib/form/components/fields/InputField';
import { DataTableFacetedFilter } from './DataTableFacetedFilter';

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  filterableColumns?: DataTableFilterableColumn<TData>[];
  searchableColumns?: DataTableSearchableColumn<TData>[];
  children?: ReactNode;
};

export function DataTableToolbar<TData>({
  table,
  filterableColumns = [],
  searchableColumns = [],
  children,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters?.length > 0;

  if (
    searchableColumns.length === 0 &&
    filterableColumns.length === 0 &&
    !children
  ) {
    return null;
  }

  return (
    <div className="tablet:flex-row tablet:flex-wrap flex w-full flex-col items-center justify-center gap-2">
      {searchableColumns.length > 0 &&
        searchableColumns.map(
          (column) =>
            table.getColumn(column.id ? String(column.id) : '') && (
              <InputField
                type="search"
                prefixComponent={<Search />}
                name="Filter"
                className="tablet:min-w-0 tablet:flex-1 tablet:max-w-xl w-full min-w-fit"
                key={String(column.id)}
                placeholder={`Filter ${column.title}...`}
                value={
                  (table
                    .getColumn(String(column.id))
                    ?.getFilterValue() as string) ?? ''
                }
                onChange={(value) =>
                  table.getColumn(String(column.id))?.setFilterValue(value)
                }
              />
            ),
        )}
      {filterableColumns.length > 0 &&
        filterableColumns.map(
          (column) =>
            table.getColumn(column.id ? String(column.id) : '') && (
              <DataTableFacetedFilter
                key={String(column.id)}
                column={table.getColumn(column.id ? String(column.id) : '')}
                title={column.title}
                options={column.options}
                className="w-auto shrink-0"
              />
            ),
        )}
      {isFiltered && (
        <Button
          variant="text"
          onClick={() => table.resetColumnFilters()}
          icon={<X className="size-4" aria-hidden="true" />}
        >
          Clear Filters
        </Button>
      )}
      {children}
    </div>
  );
}

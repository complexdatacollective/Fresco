'use client';

import type { Table } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import * as React from 'react';
import { type UrlObject } from 'url';
import { DataTableFacetedFilter } from '~/components/data-table/data-table-faceted-filter';
import {
  type DataTableFilterableColumn,
  type DataTableSearchableColumn,
} from '~/components/DataTable/types';
import { Button } from '~/components/ui/Button';
import InputField from '~/lib/form/components/fields/InputField';

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  filterableColumns?: DataTableFilterableColumn<TData>[];
  searchableColumns?: DataTableSearchableColumn<TData>[];
  newRowLink?: UrlObject;
  deleteRowsAction?: React.MouseEventHandler<HTMLButtonElement>;
};

export function DataTableToolbar<TData>({
  table,
  filterableColumns = [],
  searchableColumns = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters?.length > 0;

  if (searchableColumns.length === 0 && filterableColumns.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2 tablet:flex-row tablet:items-center">
      {searchableColumns.length > 0 &&
        searchableColumns.map(
          (column) =>
            table.getColumn(column.id ? String(column.id) : '') && (
              <InputField
                type="search"
                prefixComponent={<Search />}
                name="Filter"
                className="w-full tablet:min-w-0 tablet:flex-1"
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
    </div>
  );
}

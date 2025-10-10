'use client';

import type { Table } from '@tanstack/react-table';
import { PlusCircle, Trash, X } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { type UrlObject } from 'url';
import { DataTableFacetedFilter } from '~/components/data-table/data-table-faceted-filter';
import {
  type DataTableFilterableColumn,
  type DataTableSearchableColumn,
} from '~/components/DataTable/types';
import { Button, buttonVariants } from '~/components/ui/Button';
import { InputField } from '~/lib/form/components/fields/Input';
import { cx } from '~/utils/cva';

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
  newRowLink,
  deleteRowsAction,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters?.length > 0;
  const [isPending, startTransition] = React.useTransition();

  return (
    <div className="flex w-full items-center justify-between space-y-4 overflow-auto">
      <div className="flex flex-1 items-center space-x-2">
        {searchableColumns.length > 0 &&
          searchableColumns.map(
            (column) =>
              table.getColumn(column.id ? String(column.id) : '') && (
                <InputField
                  name="Filter"
                  key={String(column.id)}
                  placeholder={`Filter ${column.title}...`}
                  value={
                    (table
                      .getColumn(String(column.id))
                      ?.getFilterValue() as string) ?? ''
                  }
                  onChange={(event) =>
                    table
                      .getColumn(String(column.id))
                      ?.setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
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
                />
              ),
          )}
        {isFiltered && (
          <Button
            aria-label="Reset filters"
            variant="link"
            className="px-2 lg:px-3"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <X className="ml-2 size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {deleteRowsAction && table.getSelectedRowModel().rows.length > 0 ? (
          <Button
            aria-label="Delete selected rows"
            variant="outline"
            size="sm"
            onClick={(event) => {
              startTransition(() => {
                table.toggleAllPageRowsSelected(false);
                deleteRowsAction(event);
              });
            }}
            disabled={isPending}
          >
            <Trash className="mr-2 size-4" aria-hidden="true" />
            Delete
          </Button>
        ) : newRowLink ? (
          <Link aria-label="Create new row" href={newRowLink}>
            <div
              className={cx(
                buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                }),
              )}
            >
              <PlusCircle className="mr-2 size-4" aria-hidden="true" />
              New
            </div>
          </Link>
        ) : null}
        {/* <DataTableViewOptions table={table} /> */}
      </div>
    </div>
  );
}

'use client';

import type { Table } from '@tanstack/react-table';
import { PlusCircle, Search, Trash, X } from 'lucide-react';
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

  if (searchableColumns.length === 0 && filterableColumns.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchableColumns.length > 0 &&
          searchableColumns.map(
            (column) =>
              table.getColumn(column.id ? String(column.id) : '') && (
                <InputField
                  type="search"
                  prefixComponent={<Search />}
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
            variant="text"
            onClick={() => table.resetColumnFilters()}
            icon={<X className="size-4" aria-hidden="true" />}
          >
            Reset
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {deleteRowsAction && table.getSelectedRowModel().rows.length > 0 ? (
          <Button
            aria-label="Delete selected rows"
            variant="outline"
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
      </div>
    </div>
  );
}

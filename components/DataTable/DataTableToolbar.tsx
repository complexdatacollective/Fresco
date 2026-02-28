'use client';

import type { Column, Table } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import {
  type DataTableFilterableColumn,
  type DataTableSearchableColumn,
} from '~/components/DataTable/types';
import { Button } from '~/components/ui/Button';
import InputField from '~/lib/form/components/fields/InputField';
import { DataTableFacetedFilter } from './DataTableFacetedFilter';

// Separate component for search input to isolate state from table re-renders.
// TanStack Table's useReactTable returns a mutable object ref that never
// changes identity, so React Compiler may skip re-renders of components
// that only receive the table object. By owning state locally and pushing
// filter updates imperatively, typing remains responsive regardless of
// table rendering cost.
function TableSearchInput<TData>({
  column,
  placeholder,
}: {
  column: Column<TData>;
  placeholder: string;
}) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      const v = newValue ?? '';
      setValue(v);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        column.setFilterValue(v || undefined);
      }, 0);
    },
    [column],
  );

  return (
    <InputField
      type="search"
      prefixComponent={<Search />}
      name="Filter"
      className="tablet:min-w-0 tablet:flex-1 tablet:max-w-xl w-full min-w-fit"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      layout={false}
    />
  );
}

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  tableVersion?: number;
  filterableColumns?: DataTableFilterableColumn<TData>[];
  searchableColumns?: DataTableSearchableColumn<TData>[];
  children?: ReactNode;
};

export function DataTableToolbar<TData>({
  table,
  tableVersion: _tableVersion,
  filterableColumns = [],
  searchableColumns = [],
  children,
}: DataTableToolbarProps<TData>) {
  'use no memo';
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
        searchableColumns.map((searchCol) => {
          const col = table.getColumn(searchCol.id ? String(searchCol.id) : '');
          return col ? (
            <TableSearchInput
              key={String(searchCol.id)}
              column={col}
              placeholder={`Filter ${searchCol.title}...`}
            />
          ) : null;
        })}
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

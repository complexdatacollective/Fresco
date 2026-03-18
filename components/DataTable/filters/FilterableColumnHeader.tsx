'use no memo';
'use client';

import { type ReactNode, useCallback, useState } from 'react';
import { type Column, type Table } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from 'lucide-react';
import { Button, buttonVariants } from '~/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { BooleanFilter } from '~/components/DataTable/filters/BooleanFilter';
import { DateFilter } from '~/components/DataTable/filters/DateFilter';
import { FacetedFilter } from '~/components/DataTable/filters/FacetedFilter';
import { OperatorFilter } from '~/components/DataTable/filters/OperatorFilter';
import { RangeFilter } from '~/components/DataTable/filters/RangeFilter';
import {
  type BooleanFilterValue,
  type DateFilterValue,
  type FacetedFilterValue,
  type FilterConfig,
  type FilterValue,
  type OperatorFilterValue,
  type RangeFilterValue,
} from '~/components/DataTable/filters/types';
import { cn } from '~/utils/shadcn';

type FilterableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: ReactNode;
  table: Table<TData>;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>;

function renderFilter(
  config: FilterConfig,
  value: FilterValue | undefined,
  onChange: (value: FilterValue | undefined) => void,
  data: unknown[],
) {
  switch (config.type) {
    case 'range':
      return (
        <RangeFilter
          value={value as RangeFilterValue | undefined}
          onChange={onChange as (v: RangeFilterValue | undefined) => void}
          config={config}
        />
      );
    case 'date':
      return (
        <DateFilter
          value={value as DateFilterValue | undefined}
          onChange={onChange as (v: DateFilterValue | undefined) => void}
          config={config}
        />
      );
    case 'boolean':
      return (
        <BooleanFilter
          value={value as BooleanFilterValue | undefined}
          onChange={onChange as (v: BooleanFilterValue | undefined) => void}
          config={config}
        />
      );
    case 'faceted':
      return (
        <FacetedFilter
          value={value as FacetedFilterValue | undefined}
          onChange={onChange as (v: FacetedFilterValue | undefined) => void}
          config={config}
          data={data}
        />
      );
    case 'operator':
      return (
        <OperatorFilter
          value={value as OperatorFilterValue | undefined}
          onChange={onChange as (v: OperatorFilterValue | undefined) => void}
          config={config}
          data={data}
        />
      );
  }
}

export function FilterableColumnHeader<TData, TValue>({
  column,
  title,
  table,
  className,
  ...props
}: FilterableColumnHeaderProps<TData, TValue>) {
  const [open, setOpen] = useState(false);
  const [stagedValue, setStagedValue] = useState<FilterValue | undefined>(
    undefined,
  );

  const filterType = column.columnDef.meta?.filterType;
  const filterConfig = column.columnDef.meta?.filterConfig;
  const isFiltered = column.getIsFiltered();

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setStagedValue(column.getFilterValue() as FilterValue | undefined);
      }
      setOpen(nextOpen);
    },
    [column],
  );

  const handleApply = useCallback(() => {
    column.setFilterValue(stagedValue);
    setOpen(false);
  }, [column, stagedValue]);

  const handleClear = useCallback(() => {
    column.setFilterValue(undefined);
    setOpen(false);
  }, [column]);

  if (!column.getCanSort() && !filterType) {
    return (
      <div
        className={cn(
          buttonVariants({ size: 'sm', variant: 'tableHeader' }),
          'pointer-events-none',
          className,
        )}
        {...props}
      >
        {title}
      </div>
    );
  }

  const data = table.getCoreRowModel().rows.map((r) => r.original);

  return (
    <div className={cn('flex items-center', className)} {...props}>
      {column.getCanSort() ? (
        <Button
          variant="tableHeader"
          size="sm"
          onClick={() => column.toggleSorting()}
        >
          <span>{title}</span>
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="text-success ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="text-success ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ) : (
        <span
          className={cn(
            buttonVariants({ size: 'sm', variant: 'tableHeader' }),
            'pointer-events-none',
          )}
        >
          {title}
        </span>
      )}

      {filterType && filterConfig && (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Filter
                className={cn('h-3.5 w-3.5', isFiltered && 'text-success')}
              />
              {isFiltered && (
                <span className="bg-success absolute top-1.5 right-1.5 h-2 w-2 rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <div className="space-y-4">
              {renderFilter(filterConfig, stagedValue, setStagedValue, data)}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleClear}>
                  Clear
                </Button>
                <Button size="sm" onClick={handleApply}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

'use client';

import { type Column, type Table } from '@tanstack/react-table';
import { ArrowUp, ArrowUpDown, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import React, { type ReactNode, useState } from 'react';
import BooleanFilter from '~/components/DataTable/filters/BooleanFilter';
import DateFilter from '~/components/DataTable/filters/DateFilter';
import FacetedFilter from '~/components/DataTable/filters/FacetedFilter';
import OperatorFilter from '~/components/DataTable/filters/OperatorFilter';
import RangeFilter from '~/components/DataTable/filters/RangeFilter';
import {
  type FilterConfig,
  type FilterValue,
} from '~/components/DataTable/filters/types';
import Button from '~/components/ui/Button';
import { IconButton } from '~/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { cx } from '~/utils/cva';

const MotionArrow = motion.create(ArrowUp);

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: ReactNode;
  table?: Table<TData>;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>;

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  table,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  'use no memo';

  const meta = column.columnDef.meta;
  const filterConfig = meta?.filterConfig;
  const hasFilter = !!meta?.filterType && !!filterConfig;
  const isFiltered = column.getIsFiltered();
  const canSort = column.getCanSort();
  const isSorted = column.getIsSorted();
  const isSortActive = isSorted !== false;

  if (!canSort && !hasFilter) {
    return (
      <div className={cx('flex min-w-max items-center text-base', className)}>
        {title}
      </div>
    );
  }

  return (
    <div className={cx('flex min-w-max items-center gap-1', className)}>
      <span className="text-base font-semibold">{title}</span>
      {canSort && (
        <IconButton
          size="sm"
          variant={isSortActive ? 'default' : 'text'}
          color={isSortActive ? 'primary' : 'default'}
          onClick={() => column.toggleSorting()}
          aria-label={`Sort by ${typeof title === 'string' ? title : 'column'}`}
          icon={
            isSorted !== false ? (
              <MotionArrow
                className="text-success size-4"
                animate={isSorted === 'asc' ? { rotate: 180 } : {}}
              />
            ) : (
              <ArrowUpDown className="size-4" />
            )
          }
        />
      )}
      {hasFilter && table && (
        <FilterPopover
          column={column}
          table={table}
          filterConfig={filterConfig}
          isFiltered={isFiltered}
        />
      )}
    </div>
  );
}

function FilterPopover<TData, TValue>({
  column,
  table,
  filterConfig,
  isFiltered,
}: {
  column: Column<TData, TValue>;
  table: Table<TData>;
  filterConfig: FilterConfig;
  isFiltered: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stagedValue, setStagedValue] = useState<FilterValue | undefined>(
    undefined,
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setStagedValue(column.getFilterValue() as FilterValue | undefined);
    }
    setOpen(nextOpen);
  };

  const handleApply = () => {
    column.setFilterValue(stagedValue);
    setOpen(false);
  };

  const handleClear = () => {
    column.setFilterValue(undefined);
    setStagedValue(undefined);
    setOpen(false);
  };

  const data = table.getCoreRowModel().rows.map((r) => r.original);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger>
        <IconButton
          size="sm"
          variant="text"
          color={isFiltered ? 'success' : 'default'}
          aria-label="Filter column"
          icon={
            <span className="relative">
              <Filter className="size-4" />
              {isFiltered && (
                <span className="bg-success absolute -top-0.5 -right-0.5 size-2 rounded-full" />
              )}
            </span>
          }
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <div className="flex flex-col gap-3">
          <FilterRenderer
            filterConfig={filterConfig}
            value={stagedValue}
            onChange={setStagedValue}
            data={data}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="text" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterRenderer({
  filterConfig,
  value,
  onChange,
  data,
}: {
  filterConfig: FilterConfig;
  value: FilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
  data: unknown[];
}) {
  switch (filterConfig.type) {
    case 'range':
      return (
        <RangeFilter
          value={value as Parameters<typeof RangeFilter>[0]['value']}
          onChange={onChange}
          config={filterConfig}
        />
      );
    case 'date':
      return (
        <DateFilter
          value={value as Parameters<typeof DateFilter>[0]['value']}
          onChange={onChange}
          config={filterConfig}
        />
      );
    case 'boolean':
      return (
        <BooleanFilter
          value={value as Parameters<typeof BooleanFilter>[0]['value']}
          onChange={onChange}
          config={filterConfig}
        />
      );
    case 'faceted':
      return (
        <FacetedFilter
          value={value as Parameters<typeof FacetedFilter>[0]['value']}
          onChange={onChange}
          config={filterConfig}
          data={data}
        />
      );
    case 'operator':
      return (
        <OperatorFilter
          value={value as Parameters<typeof OperatorFilter>[0]['value']}
          onChange={onChange}
          config={filterConfig}
          data={data}
        />
      );
    default:
      return null;
  }
}

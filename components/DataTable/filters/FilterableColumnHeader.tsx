'use client';
'use no memo';

import { type Column, type Table } from '@tanstack/react-table';
import { ArrowUp, ArrowUpDown, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useState } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { cx } from '~/utils/cva';

const MotionArrow = motion.create(ArrowUp);

type FilterableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: ReactNode;
  table: Table<TData>;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>;

export default function FilterableColumnHeader<TData, TValue>({
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

  const meta = column.columnDef.meta;
  const filterType = meta?.filterType;
  const filterConfig = meta?.filterConfig;
  const isFiltered = column.getIsFiltered();
  const isSorted = column.getIsSorted();
  const isActive = isSorted !== false;

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
    <div className={cx('flex items-center gap-0.5', className)} {...props}>
      {column.getCanSort() ? (
        <Button
          size="sm"
          className="-mx-4 min-w-max px-4! text-base"
          variant={isActive ? 'default' : 'text'}
          onClick={() => column.toggleSorting()}
          color={isActive ? 'primary' : 'default'}
          iconPosition="right"
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
        >
          {title}
        </Button>
      ) : (
        <span className="text-sm font-medium">{title}</span>
      )}

      {filterType && filterConfig && (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger>
            <button
              type="button"
              className={cx(
                'relative rounded-md p-1 transition-colors',
                isFiltered
                  ? 'text-success'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Filter className="size-3.5" />
              {isFiltered && (
                <span className="bg-success absolute -top-0.5 -right-0.5 size-2 rounded-full" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" showArrow={false} className="w-72 p-3">
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
      )}
    </div>
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

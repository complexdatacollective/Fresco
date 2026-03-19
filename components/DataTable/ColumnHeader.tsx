'use client';

import { type Column, type Table } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, Filter, X } from 'lucide-react';
import React, { type ReactNode, useRef, useState } from 'react';
import BooleanFilter from '~/components/DataTable/filters/BooleanFilter';
import DateFilter from '~/components/DataTable/filters/DateFilter';
import FacetedFilter from '~/components/DataTable/filters/FacetedFilter';
import OperatorFilter from '~/components/DataTable/filters/OperatorFilter';
import RangeFilter from '~/components/DataTable/filters/RangeFilter';
import {
  type FilterConfig,
  type FilterValue,
} from '~/components/DataTable/filters/types';
import Button, { buttonVariants } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Popover, PopoverContent } from '~/components/ui/popover';
import { cx } from '~/utils/cva';

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
  const hasActiveState = isSorted !== false || isFiltered;
  const isInteracting = menuOpen || filterOpen;
  const isActive = hasActiveState || isInteracting;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [stagedValue, setStagedValue] = useState<FilterValue | undefined>(
    undefined,
  );

  if (!canSort && !hasFilter) {
    return (
      <div
        className={cx(
          buttonVariants({ variant: 'text', size: 'sm' }),
          'pointer-events-none -mx-4 min-w-max px-4! text-base',
          className,
        )}
      >
        {title}
      </div>
    );
  }

  const handleOpenFilter = () => {
    setStagedValue(column.getFilterValue() as FilterValue | undefined);
    // Defer opening so the dropdown menu has time to fully close first.
    // Without this, the popover opens and immediately closes because the
    // dropdown's close handler fires after our open.
    requestAnimationFrame(() => {
      setFilterOpen(true);
    });
  };

  const handleApplyFilter = () => {
    column.setFilterValue(stagedValue);
    setFilterOpen(false);
  };

  const handleClearFilter = () => {
    column.setFilterValue(undefined);
    setStagedValue(undefined);
    setFilterOpen(false);
  };

  const icons: ReactNode[] = [];
  if (isSorted === 'asc') icons.push(<ArrowUp key="sort" className="size-4" />);
  if (isSorted === 'desc')
    icons.push(<ArrowDown key="sort" className="size-4" />);
  if (isFiltered) icons.push(<Filter key="filter" className="size-4" />);

  const data =
    hasFilter && table
      ? table.getCoreRowModel().rows.map((r) => r.original)
      : [];

  return (
    <>
      <DropdownMenu onOpenChange={(open) => setMenuOpen(open)}>
        <DropdownMenuTrigger
          ref={buttonRef}
          render={
            <Button
              size="sm"
              className="-mx-4 min-w-max px-4! text-base"
              variant={isActive ? 'default' : 'text'}
              color={isActive ? 'primary' : 'default'}
              iconPosition="right"
              icon={
                icons.length > 0 ? (
                  <span className="flex gap-0.5">{icons}</span>
                ) : undefined
              }
            />
          }
          nativeButton
        >
          {title}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {canSort && (
            <>
              <DropdownMenuItem
                onClick={() => column.toggleSorting(false)}
                icon={<ArrowUp />}
              >
                Sort ascending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => column.toggleSorting(true)}
                icon={<ArrowDown />}
              >
                Sort descending
              </DropdownMenuItem>
              {isSorted !== false && (
                <DropdownMenuItem
                  onClick={() => column.clearSorting()}
                  icon={<X />}
                >
                  Clear sort
                </DropdownMenuItem>
              )}
            </>
          )}
          {canSort && hasFilter && <DropdownMenuSeparator />}
          {hasFilter && (
            <DropdownMenuItem onClick={handleOpenFilter} icon={<Filter />}>
              {isFiltered ? 'Edit filter' : 'Filter'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasFilter && filterConfig && (
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverContent align="start" anchor={buttonRef} className="w-72 p-3">
            <div className="flex flex-col gap-3">
              <FilterRenderer
                filterConfig={filterConfig}
                value={stagedValue}
                onChange={setStagedValue}
                data={data}
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="text" onClick={handleClearFilter}>
                  Clear
                </Button>
                <Button size="sm" onClick={handleApplyFilter}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </>
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

'use client';

import { type Column, type Table } from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowDown01,
  ArrowDownAZ,
  ArrowUp,
  ArrowUp01,
  ArrowUpAZ,
  Filter,
} from 'lucide-react';
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
import Button, { buttonVariants } from '@codaco/fresco-ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@codaco/fresco-ui/dropdown-menu';
import { Popover, PopoverContent } from '@codaco/fresco-ui/popover';
import { cx } from '@codaco/fresco-ui/utils/cva';

const stringSortFns = new Set(['text', 'textCaseSensitive']);

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

  const sortingFn = column.columnDef.sortingFn;
  const isStringSortFn =
    typeof sortingFn === 'string' && stringSortFns.has(sortingFn);

  const isFiltered = column.getIsFiltered();
  const canSort = column.getCanSort();
  const isSorted = column.getIsSorted();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [stagedValue, setStagedValue] = useState<FilterValue | undefined>(
    undefined,
  );

  const isActive = isSorted !== false || isFiltered || menuOpen || filterOpen;

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
  if (isSorted === 'asc')
    icons.push(<ArrowUp key="sort" className="text-sea-green size-4" />);
  if (isSorted === 'desc')
    icons.push(<ArrowDown key="sort" className="text-sea-green size-4" />);
  if (isFiltered)
    icons.push(<Filter key="filter" className="text-selected size-4" />);

  const data =
    hasFilter && table
      ? table.getCoreRowModel().rows.map((r) => r.original)
      : [];

  const canFilter =
    hasFilter &&
    !(
      filterConfig?.type === 'operator' &&
      filterConfig.entitySelector?.getOptions(data).length === 0
    );

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
              color={isActive ? 'primary' : 'dynamic'}
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
            <DropdownMenuRadioGroup
              value={isSorted || undefined}
              onValueChange={(value) => column.toggleSorting(value !== 'asc')}
              className="flex flex-col gap-1"
            >
              <DropdownMenuRadioItem
                value="asc"
                closeOnClick
                icon={isStringSortFn ? <ArrowUpAZ /> : <ArrowUp01 />}
              >
                Sort ascending
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="desc"
                closeOnClick
                icon={isStringSortFn ? <ArrowDownAZ /> : <ArrowDown01 />}
              >
                Sort descending
              </DropdownMenuRadioItem>

              {isSorted !== false && (
                <DropdownMenuItem onClick={() => column.clearSorting()}>
                  Clear sort
                </DropdownMenuItem>
              )}
            </DropdownMenuRadioGroup>
          )}
          {canSort && canFilter && <DropdownMenuSeparator />}
          {canFilter && (
            <DropdownMenuItem
              onClick={handleOpenFilter}
              icon={<Filter />}
              closeOnClick
            >
              {isFiltered ? 'Edit filter' : 'Filter'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canFilter && filterConfig && (
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverContent align="start" anchor={buttonRef}>
            <div className="flex flex-col gap-2">
              <FilterRenderer
                filterConfig={filterConfig}
                value={stagedValue}
                onChange={setStagedValue}
                data={data}
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="text"
                  color="dynamic"
                  onClick={handleClearFilter}
                >
                  Clear
                </Button>
                <Button size="sm" color="primary" onClick={handleApplyFilter}>
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

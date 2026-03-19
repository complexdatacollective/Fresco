'use client';

import { type Table } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import Checkbox from '~/lib/form/components/fields/Checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

type SelectAllHeaderProps<TData> = {
  table: Table<TData>;
};

export function SelectAllHeader<TData>({ table }: SelectAllHeaderProps<TData>) {
  'use no memo';

  const isAllPageSelected = table.getIsAllPageRowsSelected();
  const isSomePage = table.getIsSomePageRowsSelected();
  const isAllSelected = table.getIsAllRowsSelected();
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageRows = table.getRowModel().rows.length;
  const hasMultiplePages = totalRows > pageRows;

  return (
    <div className="flex items-center gap-0.5">
      <Checkbox
        checked={isAllPageSelected || isAllSelected}
        indeterminate={isSomePage && !isAllPageSelected}
        onCheckedChange={(value) => {
          if (isAllSelected) {
            table.toggleAllRowsSelected(false);
          } else {
            table.toggleAllPageRowsSelected(!!value);
          }
        }}
        aria-label="Select all on page"
      />
      {hasMultiplePages && (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button
              type="button"
              className="text-text/40 hover:text-text/80 -ml-1 rounded p-0.5 transition-colors"
              aria-label="Selection options"
            >
              <ChevronDown className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => table.toggleAllPageRowsSelected(true)}
            >
              Select page ({pageRows})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => table.toggleAllRowsSelected(true)}>
              Select all ({totalRows})
            </DropdownMenuItem>
            {(isAllPageSelected || isAllSelected || isSomePage) && (
              <DropdownMenuItem
                onClick={() => table.toggleAllRowsSelected(false)}
              >
                Deselect all
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

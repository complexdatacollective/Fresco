'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '~/components/ui/checkbox';
import { DataTableColumnHeader } from '~/components/data-table/data-table-column-header';
import { Badge } from '~/components/ui/badge';
import type {
  DataTableFilterableColumn,
  DataTableSearchableColumn,
} from '~/lib/data-table/types';
import type { TransitionStartFunction } from 'react';
import { type Activity, activityTypes } from './utils';

export function fetchActivityFeedTableColumnDefs(
  _isPending: boolean,
  _startTransition: TransitionStartFunction,
): ColumnDef<Activity, unknown>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
          }}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
          }}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {<Badge variant="outline">{row.getValue('type')}</Badge>}
          <span className="max-w-[500px] truncate font-medium">
            {row.original.message}
          </span>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'timestamp',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="max-w-[500px] truncate font-medium">
              {row.getValue('timestamp')}
            </span>
          </div>
        );
      },
    },
  ];
}

export const filterableColumns: DataTableFilterableColumn<Activity>[] = [
  {
    id: 'type',
    title: 'Type',
    options: activityTypes.map((status) => ({
      label: status,
      value: status,
    })),
  },
];

export const searchableColumns: DataTableSearchableColumn<Activity>[] = [
  {
    id: 'type',
    title: 'messages',
  },
];

'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '~/components/data-table/data-table-column-header';
import { Badge } from '~/components/ui/badge';
import type {
  DataTableFilterableColumn,
  DataTableSearchableColumn,
} from '~/lib/data-table/types';
import type { TransitionStartFunction } from 'react';
import {
  type Activity,
  activityTypes,
  getBadgeColorsForActivityType,
  type ActivityType,
} from './utils';
import type { Events } from '@prisma/client';

export function fetchActivityFeedTableColumnDefs(
  _isPending: boolean,
  _startTransition: TransitionStartFunction,
): ColumnDef<Events, unknown>[] {
  return [
    {
      accessorKey: 'timestamp',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ row }) => {
        const timestamp: string = row.getValue('timestamp');
        const formattedDate = new Date(timestamp).toLocaleString();
        return (
          <div className="flex space-x-2">
            <span className="max-w-[500px] truncate font-medium">
              {formattedDate}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const activityType: ActivityType = row.getValue('type');
        return (
          <div className="flex space-x-2">
            <Badge className={getBadgeColorsForActivityType(activityType)}>
              {activityType}
            </Badge>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'message',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Details" />
      ),
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.original.message}
          </span>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
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
    id: 'message',
    title: 'activity details',
  },
];

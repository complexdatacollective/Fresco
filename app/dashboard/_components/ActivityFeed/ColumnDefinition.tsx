'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '~/components/ui/badge';
import {
  type ActivityType,
  type DataTableFilterableColumn,
  type DataTableSearchableColumn,
  type Activity,
  activityTypes,
} from '~/lib/data-table/types';
import type { Events } from '~/lib/db/generated/prisma/client';
import TimeAgo from '~/components/ui/TimeAgo';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { getBadgeColorsForActivityType } from './utils';

export function fetchActivityFeedTableColumnDefs(): ColumnDef<
  Events,
  unknown
>[] {
  return [
    {
      accessorKey: 'timestamp',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ row }) => {
        const timestamp: string = row.getValue('timestamp');
        return (
          <div className="flex space-x-2 truncate font-medium">
            <TimeAgo date={timestamp} />
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
        const color = getBadgeColorsForActivityType(activityType);
        return (
          <div className="flex min-w-[140px] space-x-2">
            <Badge className={color}>{activityType}</Badge>
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
          <span className="max-w-full truncate font-medium">
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
] as const;

export const searchableColumns: DataTableSearchableColumn<Activity>[] = [
  {
    id: 'message',
    title: 'by activity details',
  },
] as const;

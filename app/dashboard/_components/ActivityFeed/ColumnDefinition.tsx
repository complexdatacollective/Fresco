'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import type {
  DataTableFilterableColumn,
  DataTableSearchableColumn,
} from '~/components/DataTable/types';
import { Badge } from '~/components/ui/badge';
import TimeAgo from '~/components/ui/TimeAgo';
import type { Events } from '~/lib/db/generated/client';
import { type Activity, type ActivityType, activityTypes } from './types';
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
        return <TimeAgo date={timestamp} />;
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
        return <Badge className={color}>{activityType}</Badge>;
      },
      enableHiding: false,
    },
    {
      accessorKey: 'message',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Details" />
      ),
      cell: ({ row }) => row.original.message,
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

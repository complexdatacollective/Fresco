'use client';

import { Badge } from '@codaco/fresco-ui/Badge';
import { DataTableColumnHeader } from '@codaco/fresco-ui/DataTable/ColumnHeader';
import { type StrictColumnDef } from '@codaco/fresco-ui/DataTable/types';
import TimeAgo from '@codaco/fresco-ui/TimeAgo';
import type { Events } from '~/lib/db/generated/client';

import { getBadgeColorsForActivityType } from './utils';

export function fetchActivityFeedTableColumnDefs(): StrictColumnDef<Events>[] {
  return [
    {
      accessorKey: 'timestamp',
      sortingFn: 'datetime',
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
      sortingFn: 'text',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const activityType: string = row.getValue('type');
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
      cell: ({ row }) => (
        <div className="whitespace-normal">{row.original.message}</div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

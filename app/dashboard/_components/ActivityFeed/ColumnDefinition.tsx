'use client';

import { type StrictColumnDef } from '~/components/DataTable/types';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { Badge } from '@codaco/fresco-ui/Badge';
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
      cell: ({ row }) => row.original.message,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

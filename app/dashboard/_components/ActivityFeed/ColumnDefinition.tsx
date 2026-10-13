'use client';
import { defineMessages } from '@codaco/app-i18n/messages';
import type { IntlShape } from '@codaco/app-i18n/messages';
import { Badge } from '@codaco/fresco-ui/Badge';
import { DataTableColumnHeader } from '@codaco/fresco-ui/DataTable/ColumnHeader';
import { type StrictColumnDef } from '@codaco/fresco-ui/DataTable/types';
import TimeAgo from '@codaco/fresco-ui/TimeAgo';
import { formatActivityDetails } from '~/i18n/activityDetails';
import type { Events } from '~/lib/db/generated/client';

import { formatActivityType } from './messages';
import { getBadgeColorForActivityType } from './utils';

const messages = defineMessages({
  time: {
    id: 'fresco.ActivityFeed.ColumnDefinition.time',
    defaultMessage: 'Time',
    description: 'Researcher-facing ActivityFeed / ColumnDefinition: Time',
  },
  type: {
    id: 'fresco.ActivityFeed.ColumnDefinition.type',
    defaultMessage: 'Type',
    description: 'Researcher-facing ActivityFeed / ColumnDefinition: Type',
  },
  details: {
    id: 'fresco.ActivityFeed.ColumnDefinition.details',
    defaultMessage: 'Details',
    description: 'Researcher-facing ActivityFeed / ColumnDefinition: Details',
  },
});

export function fetchActivityFeedTableColumnDefs(
  intl: IntlShape,
): StrictColumnDef<Events>[] {
  return [
    {
      accessorKey: 'timestamp',
      sortFn: 'datetime',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={intl.formatMessage(messages.time)}
        />
      ),
      cell: ({ row }) => {
        const timestamp: string = row.getValue('timestamp');
        return <TimeAgo date={timestamp} />;
      },
    },
    {
      accessorKey: 'type',
      sortFn: 'text',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={intl.formatMessage(messages.type)}
        />
      ),
      cell: ({ row }) => {
        const activityType: string = row.getValue('type');
        const color = getBadgeColorForActivityType(activityType);
        return (
          <Badge color={color}>{formatActivityType(intl, activityType)}</Badge>
        );
      },
      enableHiding: false,
    },
    {
      accessorKey: 'message',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={intl.formatMessage(messages.details)}
        />
      ),
      cell: ({ row }) => (
        <div className="whitespace-normal">
          {formatActivityDetails(intl, row.original)}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

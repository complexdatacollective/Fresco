'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '~/components/ui/checkbox';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { Progress } from '~/components/ui/progress';
import type { Stage } from '@codaco/shared-consts';
import { Badge } from '~/components/ui/badge';
import type { RouterOutputs } from '~/trpc/shared';
import TimeAgo from '~/components/ui/TimeAgo';
import Image from 'next/image';

type Interviews = RouterOutputs['interview']['get']['all'][0];

export const InterviewColumns = (): ColumnDef<Interviews>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // {
  //   accessorKey: 'id',
  //   header: ({ column }) => {
  //     return <DataTableColumnHeader column={column} title="Interview ID" />;
  //   },
  // },
  // {
  //   accessorKey: 'startTime',
  //   header: 'Start Time',
  //   cell: ({ row }) => {
  //     const date = new Date(row.original.startTime);
  //     return date.toLocaleString();
  //   },
  // },
  // {
  //   accessorKey: 'finishTime',
  //   header: 'Finish Time',
  //   cell: ({ row }) => {
  //     // finishTime is optional
  //     if (!row.original.finishTime) {
  //       return 'Not completed';
  //     }
  //     const date = new Date(row.original.finishTime);
  //     return date.toLocaleString();
  //   },
  // },
  {
    id: 'identifier',
    accessorKey: 'participant.identifier',
    header: ({ column }) => {
      return (
        <DataTableColumnHeader column={column} title="Participant Identifier" />
      );
    },
    cell: ({ row }) => {
      return (
        <div
          className="flex w-full max-w-52 items-center gap-2"
          title={row.original.participant.identifier}
        >
          <Image
            src="/images/participant.svg"
            alt="Protocol icon"
            width={32}
            height={24}
          />
          <span className="truncate">
            {row.original.participant.identifier}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'protocol.name',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Protocol Name" />;
    },
    cell: ({ row }) => {
      return (
        <div
          className="flex w-full max-w-72 items-center gap-2"
          title={row.original.protocol.name}
        >
          <Image
            src="/images/protocol-icon.png"
            alt="Protocol icon"
            width={32}
            height={24}
          />
          <span className="truncate">{row.original.protocol.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'lastUpdated',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Updated" />;
    },
    cell: ({ row }) => {
      const date = new Date(row.original.lastUpdated);
      return <TimeAgo date={date} />;
    },
  },
  {
    id: 'progress',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Progress" />;
    },
    cell: ({ row }) => {
      const stages = row.original.protocol.stages! as unknown as Stage[];
      const progress = (row.original.currentStep / stages.length) * 100;
      return (
        <div className="flex whitespace-nowrap">
          <Progress value={progress} className="w-12" />
          <div className="ml-2 text-center text-xs">{progress.toFixed(0)}%</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'exportTime',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Export Status" />;
    },
    cell: ({ row }) => {
      if (!row.original.exportTime) {
        return <Badge variant="secondary">Not exported</Badge>;
      }

      return <TimeAgo date={row.original.exportTime} />;
    },
  },
];

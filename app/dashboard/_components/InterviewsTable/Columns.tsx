'use client';

import { Badge } from '@codaco/fresco-ui/Badge';
import Checkbox from '@codaco/fresco-ui/form/fields/Checkbox';
import ProgressBar from '@codaco/fresco-ui/ProgressBar';
import TimeAgo from '@codaco/fresco-ui/TimeAgo';
import Image from 'next/image';
import { DataTableColumnHeader } from '@codaco/fresco-ui/DataTable/ColumnHeader';
import { SelectAllHeader } from '@codaco/fresco-ui/DataTable/SelectAllHeader';
import { type StrictColumnDef } from '@codaco/fresco-ui/DataTable/types';
import type { GetInterviewsQuery } from '~/queries/interviews';
import NetworkSummary from './NetworkSummary';

type InterviewRow = GetInterviewsQuery[number];

export const InterviewColumns = (): StrictColumnDef<InterviewRow>[] => [
  {
    id: 'select',
    meta: {
      className: 'sticky left-0',
    },
    header: ({ table }) => <SelectAllHeader table={table} />,
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
  {
    id: 'identifier',
    accessorKey: 'participant.identifier',
    sortingFn: 'text',
    header: ({ column }) => {
      return (
        <DataTableColumnHeader
          column={column}
          title={
            <div className="flex items-center gap-2">
              <Image
                src="/images/participant.svg"
                alt="Participant icon"
                className="size-[24px]"
                width={24}
                height={24}
              />
              Participant Identifier
            </div>
          }
        />
      );
    },
    cell: ({ row }) => {
      return (
        <div
          className="flex items-center gap-2"
          title={row.original.participant.identifier}
        >
          <Badge variant={'outline'} className="max-w-80 truncate">
            {row.original.participant.identifier}
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'protocolName',
    accessorKey: 'protocol.name',
    sortingFn: 'text',
    header: ({ column, table }) => {
      return (
        <DataTableColumnHeader
          column={column}
          table={table}
          title={
            <div className="flex items-center gap-2">
              <Image
                src="/images/protocol-icon.png"
                alt="Protocol icon"
                className="size-[24px]"
                width={24}
                height={24}
              />
              Protocol Name
            </div>
          }
        />
      );
    },
    cell: ({ row }) => {
      const protocolFileName = row.original.protocol.name;
      const protocolName = protocolFileName.replace(/\.netcanvas$/, '');
      return (
        <div
          className="flex w-full max-w-72 items-center gap-2"
          title={row.original.protocol.name}
        >
          <span className="truncate">{protocolName}</span>
        </div>
      );
    },
  },
  {
    id: 'startTime',
    accessorKey: 'startTime',
    sortingFn: 'datetime',
    header: ({ column, table }) => {
      return (
        <DataTableColumnHeader column={column} table={table} title="Started" />
      );
    },
    cell: ({ row }) => {
      return <TimeAgo date={row.original.startTime} />;
    },
  },
  {
    id: 'lastUpdated',
    accessorKey: 'lastUpdated',
    sortingFn: 'datetime',
    header: ({ column, table }) => {
      return (
        <DataTableColumnHeader column={column} table={table} title="Updated" />
      );
    },
    cell: ({ row }) => {
      return <TimeAgo date={row.original.lastUpdated} />;
    },
  },
  {
    id: 'progress',
    sortingFn: 'basic',
    accessorFn: (row) => {
      const stageCount = row.protocol.stageCount;
      return stageCount > 0 ? (row.currentStep / stageCount) * 100 : 0;
    },
    header: ({ column, table }) => {
      return (
        <DataTableColumnHeader column={column} table={table} title="Progress" />
      );
    },
    cell: ({ row }) => {
      const stageCount = row.original.protocol.stageCount;
      const progress =
        stageCount > 0 ? (row.original.currentStep / stageCount) * 100 : 0;
      return (
        <div className="flex items-center whitespace-nowrap">
          <ProgressBar
            orientation="horizontal"
            percentProgress={progress}
            nudge={false}
          />
          <div className="ml-2 text-center">{progress.toFixed(0)}%</div>
        </div>
      );
    },
  },
  {
    id: 'network',
    enableSorting: false,
    accessorFn: (row) => {
      const network = row.network;
      const nodeCount = network.nodes.reduce((sum, n) => sum + n.count, 0);
      const edgeCount = network.edges.reduce((sum, e) => sum + e.count, 0);
      return nodeCount + edgeCount;
    },
    header: ({ column, table }) => {
      return (
        <DataTableColumnHeader column={column} table={table} title="Network" />
      );
    },
    cell: ({ row }) => {
      return <NetworkSummary network={row.original.network} />;
    },
  },
  {
    id: 'exportTime',
    accessorKey: 'exportTime',
    sortingFn: 'datetime',
    header: ({ column, table }) => {
      return (
        <DataTableColumnHeader
          column={column}
          table={table}
          title="Export Status"
        />
      );
    },
    cell: ({ row }) => {
      if (!row.original.exportTime) {
        return <Badge variant="destructive">Not exported</Badge>;
      }

      return <TimeAgo date={row.original.exportTime} />;
    },
  },
];

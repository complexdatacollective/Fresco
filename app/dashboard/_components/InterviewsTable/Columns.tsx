'use client';

import type { Codebook, NcNetwork, Stage } from '@codaco/shared-consts';
import { type ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { Badge } from '~/components/ui/badge';
import { Checkbox } from '~/components/ui/checkbox';
import { Progress } from '~/components/ui/progress';
import TimeAgo from '~/components/ui/TimeAgo';
import type { GetInterviewsReturnType } from '~/queries/interviews';
import NetworkVisualization from './NetworkVisualization';

export const InterviewColumns = (): ColumnDef<
  Awaited<GetInterviewsReturnType>[0]
>[] => [
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
  {
    id: 'identifier',
    accessorKey: 'participant.identifier',
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-2">
          <Image
            src="/images/participant.svg"
            alt="Participant icon"
            className="max-w-none"
            width={24}
            height={24}
          />
          <DataTableColumnHeader
            column={column}
            title="Participant Identifier"
          />
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div
          className="flex items-center gap-2"
          title={row.original.participant.identifier}
        >
          <Badge variant={'outline'}>
            <span className="max-w-56 truncate">
              {row.original.participant.identifier}
            </span>
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'protocolName',
    accessorKey: 'protocol.name',
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-2">
          <Image
            src="/images/protocol-icon.png"
            alt="Protocol icon"
            className="max-w-none"
            width={24}
            height={24}
          />
          <DataTableColumnHeader column={column} title="Protocol Name" />
        </div>
      );
    },
    cell: ({ row }) => {
      const protocolFileName = row.original.protocol.name;
      const protocolName = protocolFileName.replace(/\.netcanvas/g, '');
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
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Started" />;
    },
    cell: ({ row }) => {
      const date = new Date(row.original.startTime);
      return (
        <div className="text-xs">
          <TimeAgo date={date} />
        </div>
      );
    },
  },
  {
    id: 'lastUpdated',
    accessorKey: 'lastUpdated',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Updated" />;
    },
    cell: ({ row }) => {
      const date = new Date(row.original.lastUpdated);
      return (
        <div className="text-xs">
          <TimeAgo date={date} />
        </div>
      );
    },
  },
  {
    id: 'progress',
    accessorFn: (row) => {
      const stages = row.protocol.stages;
      return Array.isArray(stages)
        ? (row.currentStep / stages.length) * 100
        : 0;
    },
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
    id: 'network',
    accessorFn: (row) => {
      const network = row.network as NcNetwork;
      const nodeCount = network?.nodes?.length ?? 0;
      const edgeCount = network?.edges?.length ?? 0;
      return nodeCount + edgeCount;
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Network" />;
    },
    cell: ({ row }) => {
      const network = row.original.network as NcNetwork;
      const codebook = row.original.protocol.codebook as Codebook;

      return <NetworkVisualization network={network} codebook={codebook} />;
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

      return (
        <div className="text-xs">
          <TimeAgo date={row.original.exportTime} />
        </div>
      );
    },
  },
];

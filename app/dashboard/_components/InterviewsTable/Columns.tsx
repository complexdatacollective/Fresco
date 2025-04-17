'use client';

import type { Codebook, NcNetwork, Stage } from '@codaco/shared-consts';
import { type ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { Badge } from '~/components/ui/badge';
import { Checkbox } from '~/components/ui/checkbox';
import { Progress } from '~/components/ui/progress';
import TimeAgo from '~/components/ui/TimeAgo';
import { Node } from '~/lib/ui/components';
import Icon from '~/lib/ui/components/Icon';
import type { GetInterviewsReturnType } from '~/queries/interviews';

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
            alt="Protocol icon"
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
    accessorKey: 'network',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Network" />;
    },
    cell: ({ row }) => {
      const network = row.original.network as NcNetwork;
      const codebook = row.original.protocol.codebook as Codebook;

      if (!network || !codebook) {
        return <div>No network data</div>;
      }

      // group nodes by type
      const nodeTypeCount: Record<string, number> = {};
      network.nodes?.forEach((node) => {
        nodeTypeCount[node.type] = (nodeTypeCount[node.type] ?? 0) + 1;
      });

      // group edges by type
      const edgeTypeCount: Record<string, number> = {};
      network.edges.forEach((edge) => {
        edgeTypeCount[edge.type] = (edgeTypeCount[edge.type] ?? 0) + 1;
      });

      return (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-12">
            {Object.entries(nodeTypeCount).map(([nodeType, count]) => {
              const nodeInfo = codebook.node?.[nodeType] ?? {
                color: 'node-color-seq-1',
                name: 'Node',
              };
              return (
                <div key={nodeType} className="flex flex-col items-center">
                  <div className="h-8 w-8">
                    <Node color={nodeInfo.color} label={count.toString()} />
                  </div>
                  <span className="pt-1 text-xs">{nodeInfo.name}</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-12">
            {Object.entries(edgeTypeCount).map(([edgeType, count]) => {
              const edgeInfo = codebook.edge?.[edgeType] ?? {
                color: 'edge-color-seq-1',
                name: 'Edge',
              };
              return (
                <div key={edgeType} className="flex flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center">
                    <Icon color={edgeInfo.color} name="links" />
                  </div>
                  <span className="pt-1 text-xs">
                    {edgeInfo.name} ({count})
                  </span>
                </div>
              );
            })}
          </div>
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

      return (
        <div className="text-xs">
          <TimeAgo date={row.original.exportTime} />
        </div>
      );
    },
  },
];

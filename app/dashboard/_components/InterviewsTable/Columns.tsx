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

      if (!network || !codebook) {
        return <div className="text-xs">No network data</div>;
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

      if (
        Object.keys(nodeTypeCount).length == 0 &&
        Object.keys(edgeTypeCount).length == 0
      ) {
        return <div className="text-xs">No nodes or edges</div>;
      }

      return (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-8">
            {Object.entries(nodeTypeCount).map(([nodeType, count]) => {
              const nodeInfo = codebook.node?.[nodeType] ?? {
                color: 'node-color-seq-1',
                name: 'Node',
              };
              const color = codebook.node?.[nodeType]?.color;
              const nodeColor = `var(--${color})`;
              const nodeColorDark = `var(--${color}-dark)`;

              console.log('node colors:', nodeColor, nodeColorDark);
              return (
                <div key={nodeType} className="flex flex-col items-center">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{
                      background: `repeating-linear-gradient(
                      145deg,
                      var(--node-color-seq-1) 0%,
                      var(--node-color-seq-1) 50%,
                      var(--node-color-seq-1-dark) 50%,
                      var(--node-color-seq-1-dark) 100%
                      )`,
                    }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {count}
                    </span>
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
              const edgeColor = `var(--${edgeInfo.color})`;
              const edgeColorDark = `var(--${edgeInfo.color}-dark)`;

              console.log(edgeColor, edgeColorDark);

              return (
                <div key={edgeType} className="flex flex-col items-center">
                  <div className="flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 60 60"
                      width="24"
                      height="24"
                    >
                      <g id="Links">
                        <circle
                          cx="49"
                          cy="11"
                          r="11"
                          fill="var(--edge-color-seq-1-dark)"
                        />
                        <circle
                          cx="49"
                          cy="49"
                          r="11"
                          fill="var(--edge-color-seq-1-dark)"
                        />
                        <circle
                          cx="11"
                          cy="30"
                          r="11"
                          fill="var(--edge-color-seq-1-dark)"
                        />
                        <rect
                          x="25.3"
                          y="20.59"
                          width="4"
                          height="37.64"
                          transform="translate(-20.48 43.35) rotate(-60)"
                          fill="var(--edge-color-seq-1-dark)"
                        />
                        <rect
                          x="8.48"
                          y="18.59"
                          width="37.64"
                          height="4"
                          transform="translate(-6.64 16.41) rotate(-29.99)"
                          fill="var(--edge-color-seq-1)"
                        />
                        <path
                          d="M3.22,22.22,18.78,37.78A11,11,0,1,1,3.22,22.22Z"
                          fill="var(--edge-color-seq-1)"
                        />
                        <path
                          d="M41.22,3.22,56.78,18.78A11,11,0,1,1,41.22,3.22Z"
                          fill="var(--edge-color-seq-1)"
                        />
                        <path
                          d="M41.22,41.22,56.78,56.78A11,11,0,1,1,41.22,41.22Z"
                          fill="var(--edge-color-seq-1)"
                        />
                      </g>
                    </svg>
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

'use client';

import type { Codebook, NcNetwork, Stage } from '@codaco/shared-consts';
import { type ColumnDef, type FilterFn } from '@tanstack/react-table';
import Image from 'next/image';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { FilterableColumnHeader } from '~/components/DataTable/filters/FilterableColumnHeader';
import {
  booleanFilterFn,
  dateFilterFn,
  facetedFilterFn,
  operatorFilterFn,
  rangeFilterFn,
} from '~/components/DataTable/filters/filterFns';
import { type Option } from '~/components/DataTable/filters/types';
import { Badge } from '~/components/ui/badge';
import { Checkbox } from '~/components/ui/checkbox';
import { Progress } from '~/components/ui/progress';
import TimeAgo from '~/components/ui/TimeAgo';
import type { GetInterviewsReturnType } from '~/queries/interviews';
import NetworkSummary from './NetworkSummary';

type InterviewRow = Awaited<GetInterviewsReturnType>[0];

export const InterviewColumns = (): ColumnDef<InterviewRow>[] => [
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
    meta: {
      filterType: 'faceted' as const,
      filterConfig: {
        type: 'faceted' as const,
        options: (data: unknown[]) => {
          const rows = data as Awaited<GetInterviewsReturnType>;
          const names = [...new Set(rows.map((r) => r.protocol.name))];
          return names.map((name) => ({
            label: name.replace(/\.netcanvas$/, ''),
            value: name,
          }));
        },
      },
    },
    filterFn: facetedFilterFn,
    header: ({ column, table }) => (
      <div className="flex items-center gap-2">
        <Image
          src="/images/protocol-icon.png"
          alt="Protocol icon"
          className="max-w-none"
          width={24}
          height={24}
        />
        <FilterableColumnHeader
          column={column}
          table={table}
          title="Protocol Name"
        />
      </div>
    ),
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
    meta: {
      filterType: 'date' as const,
      filterConfig: { type: 'date' as const },
    },
    filterFn: dateFilterFn,
    header: ({ column, table }) => (
      <FilterableColumnHeader column={column} table={table} title="Started" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.startTime);
      return <TimeAgo date={date} className="text-xs" />;
    },
  },
  {
    id: 'lastUpdated',
    accessorKey: 'lastUpdated',
    meta: {
      filterType: 'date' as const,
      filterConfig: { type: 'date' as const },
    },
    filterFn: dateFilterFn,
    header: ({ column, table }) => (
      <FilterableColumnHeader column={column} table={table} title="Updated" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.lastUpdated);
      return <TimeAgo date={date} className="text-xs" />;
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
    meta: {
      filterType: 'range' as const,
      filterConfig: {
        type: 'range' as const,
        min: 0,
        max: 100,
        step: 1,
        presets: [
          { label: 'Not Started', min: 0, max: 0 },
          { label: 'In Progress', min: 1, max: 99 },
          { label: 'Complete', min: 100, max: 100 },
        ],
        formatLabel: (v: number) => `${String(v)}%`,
      },
    },
    filterFn: rangeFilterFn,
    header: ({ column, table }) => (
      <FilterableColumnHeader column={column} table={table} title="Progress" />
    ),
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
    meta: {
      filterType: 'operator' as const,
      filterConfig: {
        type: 'operator' as const,
        operators: ['eq', 'gt', 'lt', 'gte', 'lte'] as const,
        entitySelector: {
          label: 'Entity Type',
          getOptions: (data: unknown[]) => {
            const rows = data as Awaited<GetInterviewsReturnType>;
            const types = new Map<string, Option>();
            for (const row of rows) {
              const network = row.network as NcNetwork;
              const codebook = row.protocol.codebook as Codebook;
              if (!network || !codebook) continue;
              for (const node of network.nodes ?? []) {
                const nodeInfo = codebook.node?.[node.type];
                if (nodeInfo) {
                  types.set(`nodes.${node.type}`, {
                    label: `${nodeInfo.name} (nodes)`,
                    value: `nodes.${node.type}`,
                  });
                }
              }
              for (const edge of network.edges ?? []) {
                const edgeInfo = codebook.edge?.[edge.type];
                if (edgeInfo) {
                  types.set(`edges.${edge.type}`, {
                    label: `${edgeInfo.name} (edges)`,
                    value: `edges.${edge.type}`,
                  });
                }
              }
            }
            return Array.from(types.values());
          },
        },
      },
    },
    filterFn: operatorFilterFn as FilterFn<InterviewRow>,
    header: ({ column, table }) => (
      <FilterableColumnHeader column={column} table={table} title="Network" />
    ),
    cell: ({ row }) => {
      const network = row.original.network as NcNetwork;
      const codebook = row.original.protocol.codebook as Codebook;

      return <NetworkSummary network={network} codebook={codebook} />;
    },
  },
  {
    id: 'exportTime',
    accessorKey: 'exportTime',
    meta: {
      filterType: 'boolean' as const,
      filterConfig: {
        type: 'boolean' as const,
        trueLabel: 'Exported',
        falseLabel: 'Not Exported',
      },
    },
    filterFn: booleanFilterFn,
    header: ({ column, table }) => (
      <FilterableColumnHeader
        column={column}
        table={table}
        title="Export Status"
      />
    ),
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

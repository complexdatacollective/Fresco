'use client';

import { type ColumnDef, type FilterFn } from '@tanstack/react-table';
import Image from 'next/image';
import Checkbox from '~/lib/form/components/fields/Checkbox';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { SelectAllHeader } from '~/components/DataTable/SelectAllHeader';
import {
  booleanFilterFn,
  dateFilterFn,
  facetedFilterFn,
  operatorFilterFn,
  rangeFilterFn,
} from '~/components/DataTable/filters/filterFns';
import { type Option } from '~/components/DataTable/types';
import { Badge } from '~/components/ui/badge';
import ProgressBar from '~/components/ui/ProgressBar';
import TimeAgo from '~/components/ui/TimeAgo';
import type { GetInterviewsQuery } from '~/queries/interviews';
import NetworkSummary from './NetworkSummary';

type InterviewRow = GetInterviewsQuery[number];

export const InterviewColumns = (): ColumnDef<InterviewRow>[] => [
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
    header: ({ column }) => {
      return (
        <DataTableColumnHeader
          column={column}
          title={
            <div className="flex items-center gap-2">
              <Image
                src="/images/participant.svg"
                alt="Participant icon"
                className="h-[24px] w-[24px]"
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
          const rows = data as GetInterviewsQuery;
          const names = [...new Set(rows.map((r) => r.protocol.name))];
          return names.map((name) => ({
            label: name.replace(/\.netcanvas$/, ''),
            value: name,
          }));
        },
      },
    },
    filterFn: facetedFilterFn,
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
                className="h-[24px] w-[24px]"
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
    meta: {
      filterType: 'date' as const,
      filterConfig: { type: 'date' as const },
    },
    filterFn: dateFilterFn,
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
    meta: {
      filterType: 'date' as const,
      filterConfig: { type: 'date' as const },
    },
    filterFn: dateFilterFn,
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
    accessorFn: (row) => {
      const stageCount = row.protocol.stageCount;
      return stageCount > 0 ? (row.currentStep / stageCount) * 100 : 0;
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
    meta: {
      filterType: 'operator' as const,
      filterConfig: {
        type: 'operator' as const,
        operators: ['eq', 'gt', 'lt', 'gte', 'lte'] as const,
        entitySelector: {
          label: 'Entity Type',
          getOptions: (data: unknown[]) => {
            const rows = data as GetInterviewsQuery;
            const types = new Map<string, Option>();
            for (const row of rows) {
              for (const node of row.network.nodes) {
                types.set(`nodes.${node.type}`, {
                  label: `${node.name} (nodes)`,
                  value: `nodes.${node.type}`,
                });
              }
              for (const edge of row.network.edges) {
                types.set(`edges.${edge.type}`, {
                  label: `${edge.name} (edges)`,
                  value: `edges.${edge.type}`,
                });
              }
            }
            return Array.from(types.values());
          },
        },
      },
    },
    filterFn: operatorFilterFn as FilterFn<InterviewRow>,
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
    meta: {
      filterType: 'boolean' as const,
      filterConfig: {
        type: 'boolean' as const,
        trueLabel: 'Exported',
        falseLabel: 'Not Exported',
      },
    },
    filterFn: booleanFilterFn,
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

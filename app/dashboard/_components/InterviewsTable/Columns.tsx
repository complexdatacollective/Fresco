'use client';

import { Badge } from '@codaco/fresco-ui/Badge';
import Checkbox from '@codaco/fresco-ui/form/fields/Checkbox';
import ProgressBar from '@codaco/fresco-ui/ProgressBar';
import TimeAgo from '@codaco/fresco-ui/TimeAgo';
import Image from 'next/image';
import { DataTableColumnHeader } from '@codaco/fresco-ui/DataTable/ColumnHeader';
import { SelectAllHeader } from '@codaco/fresco-ui/DataTable/SelectAllHeader';
import {
  booleanFilterFn,
  dateFilterFn,
  facetedFilterFn,
  operatorFilterFn,
  rangeFilterFn,
} from '@codaco/fresco-ui/DataTable/filters/filterFns';
import { type StrictColumnDef } from '@codaco/fresco-ui/DataTable/types';
import type {
  GetInterviewsQuery,
  InterviewFilterOptions,
} from '~/queries/interviews';
import NetworkSummary from './NetworkSummary';

type InterviewRow = GetInterviewsQuery[number];

export const InterviewColumns = (
  filterOptions: InterviewFilterOptions,
): StrictColumnDef<InterviewRow>[] => [
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
    meta: {
      filterType: 'faceted',
      filterConfig: {
        type: 'faceted',
        options: () =>
          filterOptions.protocolNames.map((name) => ({
            value: name,
            label: name.replace(/\.netcanvas$/, ''),
          })),
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
    meta: {
      filterType: 'date',
      filterConfig: { type: 'date' },
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
    sortingFn: 'datetime',
    meta: {
      filterType: 'date',
      filterConfig: { type: 'date' },
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
    sortingFn: 'basic',
    accessorFn: (row) => {
      const stageCount = row.protocol.stageCount;
      return stageCount > 0 ? (row.currentStep / stageCount) * 100 : 0;
    },
    meta: {
      filterType: 'range',
      filterConfig: {
        type: 'range',
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
      filterType: 'operator',
      filterConfig: {
        type: 'operator',
        operators: ['eq', 'gt', 'lt', 'gte', 'lte'],
        entitySelector: {
          label: 'Entity Type',
          getOptions: () => [
            ...filterOptions.nodeTypes.map((t) => ({
              value: `nodes.${t.value}`,
              label: `${t.label} (nodes)`,
            })),
            ...filterOptions.edgeTypes.map((t) => ({
              value: `edges.${t.value}`,
              label: `${t.label} (edges)`,
            })),
          ],
        },
      },
    },
    filterFn: operatorFilterFn,
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
    meta: {
      filterType: 'boolean',
      filterConfig: {
        type: 'boolean',
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
        return <Badge variant="destructive">Not exported</Badge>;
      }

      return <TimeAgo date={row.original.exportTime} />;
    },
  },
];

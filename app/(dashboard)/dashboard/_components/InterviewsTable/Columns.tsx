'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { Interview } from '@prisma/client';
import { ActionsDropdown } from '~/components/DataTable/ActionsDropdown';
import { Checkbox } from '~/components/ui/checkbox';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { Settings } from 'lucide-react';

type InterviewWithoutNetwork = Omit<Interview, 'network'>;

export const InterviewColumns = (
  handleDelete: (id: string) => Promise<void>,
): ColumnDef<InterviewWithoutNetwork>[] => [
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
    accessorKey: 'id',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Interview ID" />;
    },
  },
  {
    accessorKey: 'startTime',
    header: 'Start Time',
    cell: ({ row }) => {
      const date = new Date(row.original.startTime);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: 'finishTime',
    header: 'Finish Time',
    cell: ({ row }) => {
      // finishTime is optional
      if (!row.original.finishTime) {
        return 'Not completed';
      }
      const date = new Date(row.original.finishTime);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: 'exportTime',
    header: 'Export Time',
    cell: ({ row }) => {
      // exportTime is optional
      if (!row.original.exportTime) {
        return 'Not yet exported';
      }
      const date = new Date(row.original.exportTime);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: 'lastUpdated',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Updated" />;
    },
    cell: ({ row }) => {
      const date = new Date(row.original.lastUpdated);
      return date.toLocaleString();
    },
  },

  {
    accessorKey: 'participantId',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Participant ID" />;
    },
  },
  {
    accessorKey: 'participant.identifier',
    header: ({ column }) => {
      return (
        <DataTableColumnHeader column={column} title="Participant Identifier" />
      );
    },
  },
  {
    accessorKey: 'protocolId',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Protocol ID" />;
    },
  },
  {
    accessorKey: 'protocol.name',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Protocol Name" />;
    },
  },
  {
    accessorKey: 'currentStep',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Step" />;
    },
  },
  {
    id: 'actions',
    header: () => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Settings />
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete an individual interview.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    cell: ({ row }) => {
      return (
        <ActionsDropdown
          menuItems={[
            {
              label: 'Delete',
              id: row.original.id,
              idendtifier: row.original.id,
              deleteItem: handleDelete,
            },
          ]}
        />
      );
    },
  },
];

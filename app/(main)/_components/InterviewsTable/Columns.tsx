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

export const InterviewColumns: ColumnDef<Interview>[] = [
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
      const isoString = date.toISOString().replace('T', ' ').replace('Z', '');
      return isoString + ' UTC';
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
      const isoString = date.toISOString().replace('T', ' ').replace('Z', '');
      return isoString + ' UTC';
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
      const isoString = date.toISOString().replace('T', ' ').replace('Z', '');
      return isoString + ' UTC';
    },
  },
  {
    accessorKey: 'lastUpdated',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Updated" />;
    },
    cell: ({ row }) => {
      const date = new Date(row.original.lastUpdated);
      const isoString = date.toISOString().replace('T', ' ').replace('Z', '');
      return isoString + ' UTC';
    },
  },
  {
    accessorKey: 'userId',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="User ID" />;
    },
  },
  {
    accessorKey: 'protocolId',
    header: 'Protocol ID',
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
            <p>Edit, resume, or delete an individual interview.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    cell: () => {
      return <ActionsDropdown menuItems={['Edit', 'Resume', 'Delete']} />;
    },
  },
];

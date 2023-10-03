'use client';

import type { Participant } from '@prisma/client';
import { type ColumnDef } from '@tanstack/react-table';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { ActionsDropdown } from '~/components/DataTable/ActionsDropdown';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import CopyButton from './CopyButton';
import { Button } from '~/components/ui/Button';
import { Checkbox } from '~/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { DropdownMenuItem } from '~/components/ui/dropdown-menu';

export const ParticipantColumns = (
  editAction: (identifier: string) => void,
  handleDelete: (data: Participant[]) => Promise<void>,
): ColumnDef<Participant>[] => [
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
    accessorKey: 'identifier',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Identifier" />;
    },
  },
  {
    accessorKey: 'Unique_interview_URL',
    header: ({ column }) => {
      return (
        <DataTableColumnHeader column={column} title="Unique interview URL" />
      );
    },
    cell: ({ row }) => (
      <Link
        target="_blank"
        className="text-blue-500 underline hover:text-blue-300"
        href={`/interview/${row.original.id}`}
      >
        interview/{row.original.id}
      </Link>
    ),
    enableSorting: false,
    enableHiding: false,
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
            <p>Edit or delete an individual participant.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    cell: ({ row }) => {
      return (
        <ActionsDropdown
          menuItems={[
            {
              label: 'Edit',
              row,
              component: (
                <DropdownMenuItem
                  onClick={() => editAction(row.original.identifier)}
                >
                  Edit
                </DropdownMenuItem>
              ),
            },
            {
              label: 'Delete',
              row,
              component: (
                <DropdownMenuItem onClick={() => handleDelete([row.original])}>
                  Delete
                </DropdownMenuItem>
              ),
            },
            {
              label: 'Copy URL',
              row,
              component: (
                <CopyButton text={`/interview/${row.original.id}`}>
                  Copy URL
                </CopyButton>
              ),
            },
          ]}
        />
      );
    },
  },
];

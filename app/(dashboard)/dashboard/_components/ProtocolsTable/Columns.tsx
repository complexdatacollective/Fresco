'use client';

import { type ColumnDef, flexRender } from '@tanstack/react-table';
import type { Protocol } from '@prisma/client';
import { ActionsDropdown } from '~/components/DataTable/ActionsDropdown';
import { Checkbox } from '~/components/ui/checkbox';
import { Settings } from 'lucide-react';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { DropdownMenuItem } from '~/components/ui/dropdown-menu';
import ActiveProtocolSwitch from '../ActiveProtocolSwitch';

export const ProtocolColumns = (
  handleDelete: (data: Protocol[]) => Promise<void>,
): ColumnDef<Protocol>[] => [
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
    accessorKey: 'active',
    header: 'Active',
    cell: ({ row }) => {
      return (
        <ActiveProtocolSwitch
          initialData={row.original.active}
          hash={row.original.hash}
        />
      );
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />;
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      return (
        <div key={row.original.description} className="min-w-[200px]">
          {flexRender(row.original.description, row)}
        </div>
      );
    },
  },
  {
    accessorKey: 'importedAt',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Imported" />;
    },
    cell: ({ row }) => {
      const date = new Date(row.original.importedAt);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: 'lastModified',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Modified" />;
    },
    cell: ({ row }) => {
      const date = new Date(row.original.lastModified);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: 'schemaVersion',
    header: 'Schema Version',
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
            <p>Delete an individual protocol.</p>
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
              row,
              component: (
                <DropdownMenuItem
                  onClick={() => void handleDelete([row.original])}
                >
                  Delete
                </DropdownMenuItem>
              ),
            },
          ]}
        />
      );
    },
  },
];

'use client';

import { type ColumnDef, flexRender } from '@tanstack/react-table';
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
import ActiveProtocolSwitch from '~/app/(dashboard)/dashboard/_components/ActiveProtocolSwitch';

import type { ProtocolWithInterviews } from '~/shared/types';

export const ProtocolColumns = (
  handleDelete: (data: ProtocolWithInterviews[]) => void,
): ColumnDef<ProtocolWithInterviews>[] => [
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
    accessorKey: 'name',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />;
    },
    cell: ({ row }) => {
      return (
        <div className={row.original.active ? '' : 'text-muted-foreground'}>
          {flexRender(row.original.name, row)}
        </div>
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      return (
        <div
          className={
            row.original.active
              ? 'min-w-[200px]'
              : 'min-w-[200px] text-muted-foreground'
          }
          key={row.original.description}
        >
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
    cell: ({ row }) => (
      <div className={row.original.active ? '' : 'text-muted-foreground'}>
        {new Date(row.original.importedAt).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: 'lastModified',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Modified" />;
    },
    cell: ({ row }) => (
      <div className={row.original.active ? '' : 'text-muted-foreground'}>
        {new Date(row.original.lastModified).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: 'schemaVersion',
    header: 'Schema Version',
    cell: ({ row }) => (
      <div className={row.original.active ? '' : 'text-muted-foreground'}>
        {row.original.schemaVersion}
      </div>
    ),
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

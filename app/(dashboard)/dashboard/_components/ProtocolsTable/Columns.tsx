/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client';

import { type ColumnDef, flexRender } from '@tanstack/react-table';
import { Checkbox } from '~/components/ui/checkbox';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import type { ProtocolWithInterviews } from '~/shared/types';
import { dateOptions } from '~/components/DataTable/helpers';

export const ProtocolColumns: ColumnDef<ProtocolWithInterviews>[] = [
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
      return flexRender(row.original.name, row);
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      return flexRender(row.original.description, row);
    },
  },
  {
    accessorKey: 'importedAt',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Imported" />;
    },
    cell: ({
      row,
      table: {
        options: { meta },
      },
    }) => (
      <div className="text-xs">
        {
          // @ts-ignore
          new Intl.DateTimeFormat(meta?.navigatorLanguages, dateOptions).format(
            new Date(row.original.importedAt),
          )
        }
      </div>
    ),
  },
  {
    accessorKey: 'lastModified',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Modified" />;
    },
    cell: ({
      row,
      table: {
        options: { meta },
      },
    }) => (
      <div className="text-xs">
        {
          // @ts-ignore
          new Intl.DateTimeFormat(meta?.navigatorLanguages, dateOptions).format(
            new Date(row.original.lastModified),
          )
        }
      </div>
    ),
  },
];

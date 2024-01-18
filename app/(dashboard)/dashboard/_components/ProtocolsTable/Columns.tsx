'use client';

import { type ColumnDef, flexRender } from '@tanstack/react-table';
import { Checkbox } from '~/components/ui/checkbox';
import ActiveButton from './ActiveButton';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import type { ProtocolWithInterviews } from '~/shared/types';
import { conditionallyFormatDate } from '~/components/DataTable/helpers';

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
    id: 'active',
    enableSorting: true,
    accessorFn: (row) => row.active,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active" />
    ),
    cell: ({ row }) => (
      <ActiveButton active={row.original.active} protocolId={row.original.id} />
    ),
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
    }) => {
      // @ts-expect-error Tanstack table won't let us set meta properly.
      const languages = meta.navigatorLanguages as string[] | undefined;

      return (
        <div className="text-xs">
          {conditionallyFormatDate(row.original.importedAt, languages)}
        </div>
      );
    },
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
    }) => {
      // @ts-expect-error Tanstack table won't let us set meta properly.
      const languages = meta.navigatorLanguages as string[] | undefined;

      return (
        <div className="text-xs">
          {conditionallyFormatDate(row.original.lastModified, languages)}
        </div>
      );
    },
  },
];

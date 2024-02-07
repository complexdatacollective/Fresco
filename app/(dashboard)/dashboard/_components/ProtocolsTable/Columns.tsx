'use client';

import { type ColumnDef, flexRender } from '@tanstack/react-table';
import { Checkbox } from '~/components/ui/checkbox';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import type { ProtocolWithInterviews } from '~/shared/types';
import { AnonymousRecruitmentURLButton } from './AnonymousRecruitmentURLButton';
import TimeAgo from '~/components/ui/TimeAgo';

export const getProtocolColumns = (
  allowAnonRecruitment = false,
): ColumnDef<ProtocolWithInterviews>[] => {
  const columns = [
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
      accessorKey: 'importedAt',
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Imported" />;
      },
      cell: ({ row }) => <TimeAgo date={row.original.importedAt} />,
    },
    {
      accessorKey: 'lastModified',
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Modified" />;
      },
      cell: ({ row }) => <TimeAgo date={row.original.lastModified} />,
    },
  ];

  if (allowAnonRecruitment) {
    columns.push({
      id: 'participant-url',
      header: ({ column }) => {
        return (
          <DataTableColumnHeader column={column} title="Participant URL" />
        );
      },
      cell: ({ row }) => {
        return <AnonymousRecruitmentURLButton protocolId={row.original.id} />;
      },
    });
  }

  return columns;
};

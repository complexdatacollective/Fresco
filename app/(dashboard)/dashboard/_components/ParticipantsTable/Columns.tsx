'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { Checkbox } from '~/components/ui/checkbox';
import type { ParticipantWithInterviews } from '~/shared/types';

export const ParticipantColumns =
  (): ColumnDef<ParticipantWithInterviews>[] => [
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
      accessorKey: 'Interview Count',
      header: ({ column }) => {
        return (
          <DataTableColumnHeader column={column} title="Interview count" />
        );
      },
      cell: ({ row }) => {
        return <span>{row.original._count.interviews}</span>;
      },
    },
  ];

'use client';

import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
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
  ];

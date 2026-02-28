'use client';

import { type ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { DataTableCheckbox } from '~/components/DataTable/DataTableCheckbox';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import TimeAgo from '~/components/ui/TimeAgo';
import { AnonymousRecruitmentURLButton } from './AnonymousRecruitmentURLButton';
import type { ProtocolWithInterviews } from './ProtocolsTableClient';

export const getProtocolColumns = (
  allowAnonRecruitment = false,
): ColumnDef<ProtocolWithInterviews, unknown>[] => {
  const columns: ColumnDef<ProtocolWithInterviews, unknown>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <DataTableCheckbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <DataTableCheckbox
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
          <div className="flex items-center gap-2" title={row.original.name}>
            <Image
              src="/images/protocol-icon.png"
              alt="Protocol icon"
              width={32}
              height={24}
            />
            <span className="max-w-96 truncate">{row.original.name}</span>
          </div>
        );
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
          <DataTableColumnHeader
            column={column}
            title="Anonymous Participation URL"
          />
        );
      },
      cell: ({ row }) => {
        return <AnonymousRecruitmentURLButton protocolId={row.original.id} />;
      },
    });
  }

  return columns;
};

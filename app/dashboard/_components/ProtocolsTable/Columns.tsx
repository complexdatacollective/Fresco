'use client';

import { type ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import InfoTooltip from '~/components/InfoTooltip';
import Paragraph from '~/components/typography/Paragraph';
import { buttonVariants } from '~/components/ui/Button';
import Link from '~/components/ui/Link';
import TimeAgo from '~/components/ui/TimeAgo';
import Checkbox from '~/lib/form/components/fields/Checkbox';
import { AnonymousRecruitmentURLButton } from './AnonymousRecruitmentURLButton';
import type { ProtocolWithInterviews } from './ProtocolsTableClient';

export const getProtocolColumns = (
  allowAnonRecruitment = false,
): ColumnDef<ProtocolWithInterviews, unknown>[] => {
  const columns: ColumnDef<ProtocolWithInterviews, unknown>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: boolean) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
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
      header: () => {
        return (
          <div className="flex items-center gap-2 font-semibold">
            <span
              className={buttonVariants({ variant: 'text', className: 'p-0' })}
            >
              Anonymous Participation URL
            </span>
            <InfoTooltip
              title="Anonymous Participation URLs"
              description={
                <div>
                  <Paragraph>
                    Anonymous recruitment is enabled, so you can generate
                    anonymous participation URLs for your protocols from the
                    &quot;Anonymous Participation URL&quot; column in the table
                    below.. These URLs can be shared with participants to allow
                    them to self-enroll in your study.
                  </Paragraph>
                  <Paragraph>
                    To disable anonymous recruitment, visit the{' '}
                    <Link href="/dashboard/settings">settings page</Link>.
                  </Paragraph>
                </div>
              }
            />
          </div>
        );
      },
      cell: ({ row }) => {
        return <AnonymousRecruitmentURLButton protocolId={row.original.id} />;
      },
    });
  }

  return columns;
};

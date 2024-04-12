'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '~/components/ui/checkbox';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import type { ProtocolWithInterviews } from '~/shared/types';
import { AnonymousRecruitmentURLButton } from './AnonymousRecruitmentURLButton';
import TimeAgo from '~/components/ui/TimeAgo';
import Image from 'next/image';
import { buttonVariants } from '~/components/ui/Button';
import InfoTooltip from '~/components/InfoTooltip';
import Paragraph from '~/components/ui/typography/Paragraph';
import Heading from '~/components/ui/typography/Heading';
import Link from '~/components/Link';
import { InfoIcon } from 'lucide-react';

export const getProtocolColumns = (
  allowAnonRecruitment = false,
): ColumnDef<ProtocolWithInterviews, unknown>[] => {
  const columns: ColumnDef<ProtocolWithInterviews, unknown>[] = [
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
          <InfoTooltip
            trigger={
              <div
                className={buttonVariants({
                  variant: 'tableHeader',
                  size: 'sm',
                })}
              >
                <span>Anonymous Participation URL</span>
                <InfoIcon className="mx-2 h-4 w-4" />
              </div>
            }
            content={
              <>
                <Heading variant="h4-all-caps">
                  Anonymous Participation URLs
                </Heading>
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
              </>
            }
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

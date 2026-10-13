'use client';

import Image from 'next/image';

import { defineMessages } from '@codaco/app-i18n/messages';
import type { IntlShape } from '@codaco/app-i18n/messages';
import { DataTableColumnHeader } from '@codaco/fresco-ui/DataTable/ColumnHeader';
import { type StrictColumnDef } from '@codaco/fresco-ui/DataTable/types';
import Checkbox from '@codaco/fresco-ui/form/fields/Checkbox';
import TimeAgo from '@codaco/fresco-ui/TimeAgo';

import { AnonymousRecruitmentURLButton } from './AnonymousRecruitmentURLButton';
import type { ProtocolWithInterviews } from './ProtocolsTableClient';

const messages = defineMessages({
  selectAll: {
    id: 'fresco.ProtocolsTable.Columns.selectAll',
    defaultMessage: 'Select all',
    description: 'Researcher-facing ProtocolsTable / Columns: Select all',
  },
  selectRow: {
    id: 'fresco.ProtocolsTable.Columns.selectRow',
    defaultMessage: 'Select row',
    description: 'Researcher-facing ProtocolsTable / Columns: Select row',
  },
  name: {
    id: 'fresco.ProtocolsTable.Columns.name',
    defaultMessage: 'Name',
    description: 'Researcher-facing ProtocolsTable / Columns: Name',
  },
  protocolIcon: {
    id: 'fresco.ProtocolsTable.Columns.protocolIcon',
    defaultMessage: 'Protocol icon',
    description: 'Researcher-facing ProtocolsTable / Columns: Protocol icon',
  },
  imported: {
    id: 'fresco.ProtocolsTable.Columns.imported',
    defaultMessage: 'Imported',
    description: 'Researcher-facing ProtocolsTable / Columns: Imported',
  },
  modified: {
    id: 'fresco.ProtocolsTable.Columns.modified',
    defaultMessage: 'Modified',
    description: 'Researcher-facing ProtocolsTable / Columns: Modified',
  },
  anonymousParticipationURL: {
    id: 'fresco.ProtocolsTable.Columns.anonymousParticipationURL',
    defaultMessage: 'Anonymous Participation URL',
    description:
      'Researcher-facing ProtocolsTable / Columns: Anonymous Participation URL',
  },
});

export const getProtocolColumns = (
  intl: IntlShape,
  allowAnonRecruitment = false,
): StrictColumnDef<ProtocolWithInterviews>[] => {
  const columns: StrictColumnDef<ProtocolWithInterviews>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value)}
          aria-label={intl.formatMessage(messages.selectAll)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(value)}
          aria-label={intl.formatMessage(messages.selectRow)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      sortFn: 'text',
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title={intl.formatMessage(messages.name)}
          />
        );
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Image
              src="/images/protocol-icon.png"
              alt={intl.formatMessage(messages.protocolIcon)}
              width={32}
              height={24}
              className="shrink-0"
            />
            {row.original.name}
          </div>
        );
      },
    },
    {
      accessorKey: 'importedAt',
      sortFn: 'datetime',
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title={intl.formatMessage(messages.imported)}
          />
        );
      },
      cell: ({ row }) => <TimeAgo date={row.original.importedAt} />,
    },
    {
      accessorKey: 'lastModified',
      sortFn: 'datetime',
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title={intl.formatMessage(messages.modified)}
          />
        );
      },
      cell: ({ row }) => <TimeAgo date={row.original.lastModified} />,
    },
  ];

  if (allowAnonRecruitment) {
    columns.push({
      id: 'participant-url',
      enableSorting: false,
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title={intl.formatMessage(messages.anonymousParticipationURL)}
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

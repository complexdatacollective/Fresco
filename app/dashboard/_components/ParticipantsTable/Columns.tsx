'use client';

import Image from 'next/image';

import { defineMessages } from '@codaco/app-i18n/messages';
import type { IntlShape } from '@codaco/app-i18n/messages';
import { Badge } from '@codaco/fresco-ui/Badge';
import { DataTableColumnHeader } from '@codaco/fresco-ui/DataTable/ColumnHeader';
import { SelectAllHeader } from '@codaco/fresco-ui/DataTable/SelectAllHeader';
import { type StrictColumnDef } from '@codaco/fresco-ui/DataTable/types';
import Checkbox from '@codaco/fresco-ui/form/fields/Checkbox';

import type { ProtocolWithInterviews } from '../ProtocolsTable/ProtocolsTableClient';
import { GenerateParticipationURLButton } from './GenerateParticipantURLButton';
import type { ParticipantRow } from './ParticipantsTableClient';

const messages = defineMessages({
  interviewCounts: {
    id: 'fresco.participants.table.interviewCounts',
    defaultMessage:
      '{total, number} ({completed, plural, one {# completed} other {# completed}})',
    description:
      'Total interviews and completed interviews for one participant.',
  },

  selectRow: {
    id: 'fresco.ParticipantsTable.Columns.selectRow',
    defaultMessage: 'Select row',
    description: 'Researcher-facing ParticipantsTable / Columns: Select row',
  },
  identifier: {
    id: 'fresco.ParticipantsTable.Columns.identifier',
    defaultMessage: 'Identifier',
    description: 'Researcher-facing ParticipantsTable / Columns: Identifier',
  },
  protocolIcon: {
    id: 'fresco.ParticipantsTable.Columns.protocolIcon',
    defaultMessage: 'Protocol icon',
    description: 'Researcher-facing ParticipantsTable / Columns: Protocol icon',
  },
  label: {
    id: 'fresco.ParticipantsTable.Columns.label',
    defaultMessage: 'Label',
    description: 'Researcher-facing ParticipantsTable / Columns: Label',
  },
  interviews: {
    id: 'fresco.ParticipantsTable.Columns.interviews',
    defaultMessage: 'Interviews',
    description: 'Researcher-facing ParticipantsTable / Columns: Interviews',
  },

  uniqueParticipantURL: {
    id: 'fresco.ParticipantsTable.Columns.uniqueParticipantURL',
    defaultMessage: 'Unique Participant URL',
    description:
      'Researcher-facing ParticipantsTable / Columns: Unique Participant URL',
  },
});

export function getParticipantColumns(
  intl: IntlShape,
  protocols: ProtocolWithInterviews[],
): StrictColumnDef<ParticipantRow>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => <SelectAllHeader table={table} />,
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
      id: 'identifier',
      accessorKey: 'identifier',
      sortFn: 'text',
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title={intl.formatMessage(messages.identifier)}
          />
        );
      },
      cell: ({ row }) => {
        return (
          <div
            className="flex items-center gap-2"
            title={row.original.identifier}
          >
            <Image
              src="/images/participant.svg"
              alt={intl.formatMessage(messages.protocolIcon)}
              className="max-w-none"
              width={24}
              height={24}
            />
            <Badge appearance="outline">
              <span className="max-w-56 truncate">
                {row.original.identifier}
              </span>
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'label',
      sortFn: 'text',
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title={intl.formatMessage(messages.label)}
          />
        );
      },
      cell: ({ row }) => {
        return <span className="truncate">{row.original.label}</span>;
      },
    },
    {
      id: 'interviews',
      accessorFn: (row) => row._count.interviews,
      sortFn: 'basic',
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title={intl.formatMessage(messages.interviews)}
          />
        );
      },
      cell: ({ row }) => {
        const completedInterviews = row.original.interviews.filter(
          (interview) => interview.finishTime,
        ).length;
        return (
          <span>
            {intl.formatMessage(messages.interviewCounts, {
              total: row.original._count.interviews,
              completed: completedInterviews,
            })}
          </span>
        );
      },
    },
    {
      id: 'participant-url',
      enableSorting: false,
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title={intl.formatMessage(messages.uniqueParticipantURL)}
          />
        );
      },
      cell: ({ row }) => {
        return (
          <GenerateParticipationURLButton
            participant={row.original}
            protocols={protocols}
          />
        );
      },
    },
  ];
}

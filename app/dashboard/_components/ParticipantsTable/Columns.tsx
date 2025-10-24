import { type ColumnDef } from '@tanstack/react-table';
import { InfoIcon } from 'lucide-react';
import Image from 'next/image';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import InfoTooltip from '~/components/InfoTooltip';
import { buttonVariants } from '~/components/ui/Button';
import { Badge } from '~/components/ui/badge';
import { Checkbox } from '~/components/ui/checkbox';
import type { ProtocolWithInterviews } from '../ProtocolsTable/ProtocolsTableClient';
import { GenerateParticipationURLButton } from './GenerateParticipantURLButton';
import type { ParticipantWithInterviews } from './ParticipantsTableClient';

export function getParticipantColumns(
  protocols: ProtocolWithInterviews[],
): ColumnDef<ParticipantWithInterviews, unknown>[] {
  return [
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
      id: 'identifier',
      accessorKey: 'identifier',
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Identifier" />;
      },
      cell: ({ row }) => {
        return (
          <div
            className="flex items-center gap-2"
            title={row.original.identifier}
          >
            <Image
              src="/images/participant.svg"
              alt="Protocol icon"
              className="max-w-none"
              width={24}
              height={24}
            />
            <Badge variant={'outline'}>
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
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Label" />;
      },
      cell: ({ row }) => {
        return <span className="truncate">{row.original.label}</span>;
      },
    },
    {
      id: 'interviews',
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Interviews" />;
      },
      cell: ({ row }) => {
        const completedInterviews = row.original.interviews.filter(
          (interview) => interview.finishTime,
        ).length;
        return (
          <span>
            {row.original._count.interviews ?? ''} ({completedInterviews}{' '}
            completed)
          </span>
        );
      },
    },
    {
      id: 'participant-url',
      header: () => {
        return (
          <InfoTooltip
            trigger={
              <div
                className={buttonVariants({
                  variant: 'text',
                  size: 'sm',
                })}
              >
                <span>Unique Participant URL</span>
                <InfoIcon className="mx-2 h-4 w-4" />
              </div>
            }
            title="Unique Participant URL"
            description="A unique participant URL allows a participant to take an
                interview simply by visiting a URL. A participation URL is
                specific to each participant, and should only be shared with
                them.
              "
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

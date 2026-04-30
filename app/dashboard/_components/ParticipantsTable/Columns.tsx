import { type StrictColumnDef } from '~/components/DataTable/types';
import Image from 'next/image';
import Checkbox from '@codaco/fresco-ui/form/components/fields/Checkbox';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { SelectAllHeader } from '~/components/DataTable/SelectAllHeader';
import { Badge } from '@codaco/fresco-ui/badge';
import type { ProtocolWithInterviews } from '../ProtocolsTable/ProtocolsTableClient';
import { GenerateParticipationURLButton } from './GenerateParticipantURLButton';
import type { ParticipantWithInterviews } from './ParticipantsTableClient';

export function getParticipantColumns(
  protocols: ProtocolWithInterviews[],
): StrictColumnDef<ParticipantWithInterviews>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => <SelectAllHeader table={table} />,
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
      sortingFn: 'text',
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
      sortingFn: 'text',
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Label" />;
      },
      cell: ({ row }) => {
        return <span className="truncate">{row.original.label}</span>;
      },
    },
    {
      id: 'interviews',
      accessorFn: (row) => row._count.interviews,
      sortingFn: 'basic',
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
      enableSorting: false,
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title="Unique Participant URL"
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

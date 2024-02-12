import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '~/components/DataTable/ColumnHeader';
import { Checkbox } from '~/components/ui/checkbox';
import { GenerateParticipationURLButton } from './GenerateParticipantURLButton';
import { type ParticipantWithInterviews } from '~/shared/types';
import Image from 'next/image';
import InfoTooltip from '~/components/InfoTooltip';
import { Button } from '~/lib/ui/components';
import { InfoIcon } from 'lucide-react';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { buttonVariants } from '~/components/ui/Button';

export function getParticipantColumns(): ColumnDef<
  ParticipantWithInterviews,
  unknown
>[] {
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
              width={32}
              height={24}
            />
            <span className="truncate">{row.original.identifier}</span>
          </div>
        );
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
    {
      accessorKey: 'Completed Interviews',
      header: ({ column }) => {
        return (
          <DataTableColumnHeader column={column} title="Completed interviews" />
        );
      },
      cell: ({ row }) => {
        const completedInterviews = row.original.interviews.filter(
          (interview) => interview.finishTime,
        ).length;
        return <span>{completedInterviews}</span>;
      },
    },
    {
      id: 'participant-url',
      header: () => {
        return (
          <InfoTooltip
            triggerClasses="whitespace-nowrap flex"
            trigger={
              <div
                className={buttonVariants({
                  variant: 'tableHeader',
                  size: 'sm',
                })}
              >
                <span>Unique Participant URL</span>
                <InfoIcon className="mx-2 h-4 w-4" />
              </div>
            }
            content={
              <>
                <Heading variant="h4-all-caps">
                  Unique Participation URL
                </Heading>
                <Paragraph>
                  A participation URL allows a participant to take an interview
                  simply by visiting a URL. A participation URL is unique to the
                  participant, and should only be shared with them.
                </Paragraph>
              </>
            }
          />
        );
      },
      cell: ({ row }) => {
        return <GenerateParticipationURLButton participant={row.original} />;
      },
    },
  ];
}

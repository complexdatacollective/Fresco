'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { type Interview, type Protocol, type User } from '@prisma/client';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

export const InterviewColumns: ColumnDef<Interview>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Interview ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'startTime',
    header: 'Start Time',
    cell: ({ row }) => {
      const date = new Date(row.original.startTime);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: 'finishTime',
    header: 'Finish Time',
    cell: ({ row }) => {
      // finishTime is optional
      if (!row.original.finishTime) {
        return 'Not completed';
      }
      const finishTime = row.original.finishTime;
      const date = new Date(finishTime);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: 'exportTime',
    header: 'Export Time',
    cell: ({ row }) => {
      // exportTime is optional
      if (!row.original.exportTime) {
        return 'Not yet exported';
      }
      const date = new Date(row.original.exportTime);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: 'lastUpdated',
    cell: ({ row }) => {
      const date = new Date(row.original.lastUpdated);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: 'userId',
    header: 'User ID',
  },
  {
    accessorKey: 'protocolId',
    header: 'Protocol ID',
  },
  {
    accessorKey: 'currentStep',
    header: 'Current Step',
  },
];

export const ProtocolColumns: ColumnDef<Protocol>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Protocol ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'schemaVersion',
    header: 'Schema Version',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'importedAt',
    header: 'Imported At',
    cell: ({ row }) => {
      const date = new Date(row.original.importedAt);
      return date.toLocaleString();
    },
  },
  {
    accessorKey: 'lastModified',
    header: 'Last Modified',
    cell: ({ row }) => {
      const date = new Date(row.original.lastModified);
      return date.toLocaleString();
    },
  },
  {
    id: 'actions',
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Resume</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export const ParticipantColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Participant ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'E-mail',
  },
];

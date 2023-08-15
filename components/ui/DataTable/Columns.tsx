'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { type Interview, type Protocol, type User } from '@prisma/client';

export const InterviewColumns: ColumnDef<Interview>[] = [
  {
    accessorKey: 'id',
    header: 'Interview ID',
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
    header: 'Last Updated',
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
    accessorKey: 'protocolID',
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
    header: 'Protocol ID',
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
];

export const ParticipantColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    header: 'Protocol ID',
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

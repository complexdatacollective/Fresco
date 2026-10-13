'use client';

import type { Row } from '@tanstack/react-table';
import { DeleteIcon, MoreHorizontal, PencilIcon } from 'lucide-react';

import { commonMessages } from '@codaco/app-i18n/common';
import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import { IconButton } from '@codaco/fresco-ui/Button';
import { type DataTableFeatures } from '@codaco/fresco-ui/DataTable/features';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@codaco/fresco-ui/DropdownMenu';

import type { ParticipantRow } from './ParticipantsTableClient';

const messages = defineMessages({
  openMenu: {
    id: 'fresco.ParticipantsTable.ActionsDropdown.openMenu',
    defaultMessage: 'Open menu',
    description:
      'Researcher-facing ParticipantsTable / ActionsDropdown: Open menu',
  },
  actions: {
    id: 'fresco.ParticipantsTable.ActionsDropdown.actions',
    defaultMessage: 'Actions',
    description:
      'Researcher-facing ParticipantsTable / ActionsDropdown: Actions',
  },
  edit: {
    id: 'fresco.ParticipantsTable.ActionsDropdown.edit',
    defaultMessage: 'Edit',
    description: 'Researcher-facing ParticipantsTable / ActionsDropdown: Edit',
  },
});

export function ActionsDropdown({
  row,
  onEdit,
  onDelete,
}: {
  row: Row<DataTableFeatures, ParticipantRow>;
  onEdit: (participant: ParticipantRow) => void;
  onDelete: (participant: ParticipantRow) => void;
}) {
  const intl = useAppIntl();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            variant="text"
            aria-label={intl.formatMessage(messages.openMenu)}
            icon={<MoreHorizontal />}
            size="sm"
          />
        }
        nativeButton
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {intl.formatMessage(messages.actions)}
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => onEdit(row.original)}
            icon={<PencilIcon />}
          >
            {intl.formatMessage(messages.edit)}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(row.original)}
            icon={<DeleteIcon />}
          >
            {intl.formatMessage(commonMessages.delete)}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

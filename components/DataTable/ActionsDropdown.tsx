'use client';

import { Loader, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import CopyButton from './CopyButton';

interface Actions {
  label: string;
  id: string;
  idendtifier: string;
  editAction?: (identifier: string) => void;
  deleteParticipant?: (id: string) => Promise<void>;
}

interface Props<TMenuItem = Actions> {
  menuItems: TMenuItem[];
}

export const ActionsDropdown = <TMenuItem extends Actions>({
  menuItems,
}: Props<TMenuItem>) => {
  const [pending, setPending] = useState(false);

  const handleDelete = async (item: Actions) => {
    setPending(true);
    if (item.deleteParticipant) {
      await item.deleteParticipant(item.id);
    }
    setPending(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          {pending ? (
            <Loader className="h-4 w-4 animate-spin text-red-400" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {menuItems.map((item, index) => (
          <DropdownMenuItem key={index}>
            {item.label === 'Copy' && (
              <CopyButton text={`/interview/${item.id}`} />
            )}
            {item.label === 'Edit' && (
              <button
                onClick={() => {
                  if (item.editAction) {
                    item.editAction(item.idendtifier);
                  }
                }}
                className="w-full text-left"
              >
                Edit
              </button>
            )}
            {item.label === 'Delete' && (
              <button
                onClick={() => handleDelete(item)}
                className="w-full text-left"
              >
                Delete
              </button>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

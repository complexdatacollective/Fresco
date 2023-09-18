'use client';

import { Loader, MoreHorizontal } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import CopyButton from './CopyButton';
import { deleteParticipant } from '~/app/(dashboard)/dashboard/participants/_actions/actions';
import { useState } from 'react';

interface Actions {
  label: string;
  id: string;
}

interface Props<TMenuItem = Actions> {
  menuItems: TMenuItem[];
}

export const ActionsDropdown = <TMenuItem extends Actions>({
  menuItems,
}: Props<TMenuItem>) => {
  const [pending, setPending] = useState(false);

  const handleDelete = async (id: string) => {
    setPending(true);
    const data = await deleteParticipant(id);
    if (data.error) throw new Error(data.error);
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
              <button className="w-full text-left">Edit</button>
            )}
            {item.label === 'Delete' && (
              <button
                onClick={() => handleDelete(item.id)}
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

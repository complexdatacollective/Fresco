import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { ReactNode } from 'react';

interface Props<TMenuItem = ReactNode> {
  menuItems: TMenuItem[];
}

export const ActionsDropdown = <TMenuItem extends ReactNode>({
  menuItems,
}: Props<TMenuItem>) => {
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
        {menuItems.map((item, index) => (
          <DropdownMenuItem key={index}>{item}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

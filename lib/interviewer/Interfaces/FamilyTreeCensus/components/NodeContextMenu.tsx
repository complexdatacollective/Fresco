'use client';

import { type ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { type StoreEdge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

export type NodeContextMenuAction =
  | 'parent'
  | 'child'
  | 'partner'
  | 'sibling'
  | 'editName';

type NodeContextMenuProps = {
  nodeId: string;
  edges: Map<string, StoreEdge>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: NodeContextMenuAction) => void;
  children: ReactNode;
};

export default function NodeContextMenu({
  nodeId,
  edges,
  open,
  onOpenChange,
  onAction,
  children,
}: NodeContextMenuProps) {
  const hasParents = [...edges.values()].some(
    (edge) => edge.type === 'parent' && edge.target === nodeId,
  );

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger render={<div />}>{children}</DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={8}>
        <DropdownMenuItem onClick={() => onAction('parent')}>
          Add parent
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('child')}>
          Add child
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('partner')}>
          Add partner
        </DropdownMenuItem>
        {hasParents && (
          <DropdownMenuItem onClick={() => onAction('sibling')}>
            Add sibling
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction('editName')}>
          Edit name
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

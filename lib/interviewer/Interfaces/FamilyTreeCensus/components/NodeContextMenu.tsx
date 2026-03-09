'use client';

import { Menu } from '@base-ui/react/menu';
import { type ReactNode } from 'react';
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

const menuItemClass =
  'cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold text-neutral select-none data-highlighted:bg-neutral/10';

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
    <Menu.Root open={open} onOpenChange={onOpenChange}>
      <Menu.Trigger render={<div />}>{children}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8}>
          <Menu.Popup className="flex flex-col gap-0.5 rounded-lg bg-white p-1.5 shadow-lg outline-none">
            <Menu.Item
              className={menuItemClass}
              onClick={() => onAction('parent')}
            >
              Add parent
            </Menu.Item>
            <Menu.Item
              className={menuItemClass}
              onClick={() => onAction('child')}
            >
              Add child
            </Menu.Item>
            <Menu.Item
              className={menuItemClass}
              onClick={() => onAction('partner')}
            >
              Add partner
            </Menu.Item>
            {hasParents && (
              <Menu.Item
                className={menuItemClass}
                onClick={() => onAction('sibling')}
              >
                Add sibling
              </Menu.Item>
            )}
            <Menu.Separator className="bg-neutral/20 my-1 h-px" />
            <Menu.Item
              className={menuItemClass}
              onClick={() => onAction('editName')}
            >
              Edit name
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

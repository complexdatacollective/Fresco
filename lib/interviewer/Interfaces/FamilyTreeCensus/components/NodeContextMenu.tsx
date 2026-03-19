'use client';

import { Menu } from '@base-ui/react/menu';
import { type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionSurface } from '~/components/layout/Surface';
import { cx } from '~/utils/cva';
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

const menuItemClass = cx(
  'relative flex cursor-default items-center gap-2 px-3 py-2 text-sm outline-hidden transition-colors select-none',
  'data-highlighted:bg-accent data-highlighted:text-accent-contrast',
  'min-w-48',
);

const separatorClass = 'mx-auto my-1 h-px w-full rounded bg-current/20';

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
      <Menu.Trigger render={<div />} nativeButton={false} tabIndex={-1}>
        {children}
      </Menu.Trigger>
      <Menu.Portal keepMounted>
        <AnimatePresence>
          {open && (
            <Menu.Positioner sideOffset={8} side="bottom" align="center">
              <Menu.Popup
                render={
                  <MotionSurface
                    noContainer
                    dynamicSpacing={false}
                    level="popover"
                    elevation="none"
                    spacing="none"
                    className="flex flex-col shadow-xl"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                }
              >
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
                <Menu.Separator className={separatorClass} />
                <Menu.Item
                  className={menuItemClass}
                  onClick={() => onAction('editName')}
                >
                  Edit name
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          )}
        </AnimatePresence>
      </Menu.Portal>
    </Menu.Root>
  );
}

'use client';

import { Menu } from '@base-ui/react/menu';
import { type ReactNode } from 'react';
import { MotionSurface } from '~/components/layout/Surface';
import { ArrowSvg } from '~/components/ui/popover';
import { type StoreEdge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { cx } from '~/utils/cva';

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
  'cursor-pointer px-3 py-1.5 text-sm font-semibold select-none data-highlighted:bg-selected/10';

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
          <Menu.Popup
            render={
              <MotionSurface
                level="popover"
                elevation="none"
                noContainer
                className={cx(
                  'max-w-(--available-width) overflow-visible shadow-xl',
                )}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', duration: 0.5 }}
              />
            }
          >
            <Menu.Arrow className="data-[side=bottom]:top-[-15px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-14px] data-[side=top]:rotate-180">
              <ArrowSvg />
            </Menu.Arrow>
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

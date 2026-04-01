'use client';

import { Menu } from '@base-ui/react/menu';
import { type ReactElement } from 'react';
import { MotionSurface } from '~/components/layout/Surface';
import { ArrowSvg } from '~/components/ui/popover';
import { cx } from '~/utils/cva';

export type NodeContextMenuAction =
  | 'parent'
  | 'child'
  | 'partner'
  | 'sibling'
  | 'editName'
  | 'delete';

type NodeContextMenuProps = {
  isBiological: boolean;
  isEgo: boolean;
  onAction: (action: NodeContextMenuAction) => void;
  children: ReactElement;
};

const menuItemClass = cx(
  'relative flex cursor-default items-center gap-2 px-8 py-2 text-sm font-semibold outline-hidden select-none',
  'data-highlighted:bg-accent data-highlighted:text-accent-contrast',
);

const destructiveMenuItemClass = cx(
  menuItemClass,
  'text-destructive data-highlighted:bg-destructive data-highlighted:text-destructive-contrast',
);

export default function NodeContextMenu({
  isBiological,
  isEgo,
  onAction,
  children,
}: NodeContextMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger render={children} />
      <Menu.Portal>
        <Menu.Positioner sideOffset={8}>
          <Menu.Popup>
            <Menu.Arrow className="data-[side=bottom]:top-[-15px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-14px] data-[side=top]:rotate-180">
              <ArrowSvg />
            </Menu.Arrow>
            <MotionSurface
              level="popover"
              elevation="none"
              spacing="none"
              noContainer
              className={cx(
                'max-w-(--available-width) overflow-hidden shadow-xl',
              )}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              {isBiological && (
                <Menu.Item
                  className={menuItemClass}
                  onClick={() => onAction('parent')}
                >
                  Add parent
                </Menu.Item>
              )}
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
              {isBiological && (
                <Menu.Item
                  className={menuItemClass}
                  onClick={() => onAction('sibling')}
                >
                  Add sibling
                </Menu.Item>
              )}
              <Menu.Separator className="my-1 h-px bg-current/20" />
              <Menu.Item
                className={menuItemClass}
                onClick={() => onAction('editName')}
              >
                Edit name
              </Menu.Item>
              {!isEgo && (
                <>
                  <Menu.Separator className="my-1 h-px bg-current/20" />
                  <Menu.Item
                    className={destructiveMenuItemClass}
                    onClick={() => onAction('delete')}
                  >
                    Delete
                  </Menu.Item>
                </>
              )}
            </MotionSurface>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

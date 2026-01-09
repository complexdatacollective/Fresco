'use client';

import { memo, useCallback, useRef, type ReactNode } from 'react';
import { cx } from '~/utils/cva';
import {
  CollectionItemContext,
  useCollectionId,
  useOptionalSelectionManager,
} from '../contexts';
import { type DroppableItemProps } from '../dnd/types';
import { useSelectableItem } from '../hooks/useSelectableItem';
import { type ItemRenderState, type Key } from '../types';

export type CollectionItemProps = {
  /** Unique key for this item */
  itemKey: Key;
  /** Render state for the item */
  state: ItemRenderState;
  /** Children to render */
  children: ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Optional drag and drop hooks */
  dragAndDropHooks?: {
    useDraggableCollectionProps?: () => Record<string, unknown>;
    useDraggableItemProps?: (key: Key) => Record<string, unknown>;
    useDroppableItemProps?: (
      key: Key,
      collectionId: string,
    ) => DroppableItemProps;
    renderDropIndicator?: (target: {
      key: Key;
      position: string;
    }) => React.ReactNode;
    getDropTarget?: () => { key: Key; position: string } | null;
  };
};

/**
 * Internal component that uses selection hooks.
 * Separated to avoid conditional hook calls.
 */
function SelectableItemWrapper({
  itemKey,
  state,
  children,
  className,
  selectionManager,
  dragAndDropHooks,
}: CollectionItemProps & {
  selectionManager: NonNullable<ReturnType<typeof useOptionalSelectionManager>>;
}) {
  const localRef = useRef<HTMLDivElement>(null);
  const contextValue = { key: itemKey };
  const collectionId = useCollectionId() ?? 'collection';

  const { itemProps, isSelected, isFocused, isDisabled } = useSelectableItem({
    key: itemKey,
    selectionManager,
    ref: localRef,
  });

  // Get item-level drag props if hooks provided
  const dndDragPropsRaw = dragAndDropHooks?.useDraggableItemProps
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      dragAndDropHooks.useDraggableItemProps(itemKey)
    : {};

  // Get item-level drop props if hooks provided
  const dndDropProps = dragAndDropHooks?.useDroppableItemProps
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      dragAndDropHooks.useDroppableItemProps(itemKey, collectionId)
    : null;

  const itemId = `${collectionId}-item-${itemKey}`;

  // Extract ref from drag props to merge with our combined ref
  const { ref: dragRef, ...dndDragProps } = dndDragPropsRaw as {
    ref?: (el: HTMLElement | null) => void;
    [key: string]: unknown;
  };

  // Get the drop ref from props
  const dropRef = dndDropProps?.ref;

  // Create a stable ref callback that calls localRef, dropRef, and dragRef
  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      (localRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      // Call the drop target ref callback
      if (dropRef) {
        dropRef(el);
      }
      // Call the drag source ref callback
      if (dragRef) {
        dragRef(el);
      }
    },
    [dropRef, dragRef],
  );

  // Check if this item is a drop target
  const isDropTarget = dndDropProps?.isOver && dndDropProps?.willAccept;
  const dropPosition = dndDropProps?.dropPosition;

  return (
    <CollectionItemContext.Provider value={contextValue}>
      <div
        ref={combinedRef}
        id={itemId}
        role="option"
        data-key={itemKey}
        data-selected={isSelected ? true : undefined}
        data-focused={isFocused ? true : undefined}
        data-disabled={isDisabled ? true : undefined}
        data-dragging={state.isDragging ? true : undefined}
        data-drop-target={isDropTarget ? true : undefined}
        className={cx('relative', className)}
        onPointerMove={dndDropProps?.onPointerMove}
        {...itemProps}
        {...dndDragProps}
      >
        {children}
        {/* Render drop indicator when this item is a valid drop target */}
        {isDropTarget &&
          dropPosition &&
          dragAndDropHooks?.renderDropIndicator?.({
            key: itemKey,
            position: dropPosition,
          })}
      </div>
    </CollectionItemContext.Provider>
  );
}

/**
 * Wrapper component for items in the collection.
 * Provides context for child components and handles item-level styling.
 *
 * When a SelectionManager is available, integrates with the selection system
 * to provide proper click/focus handlers. The state prop from parent takes
 * precedence for controlled usage.
 */
function CollectionItemComponent({
  itemKey,
  state,
  children,
  className,
  dragAndDropHooks,
}: CollectionItemProps) {
  const selectionManager = useOptionalSelectionManager();
  const contextValue = { key: itemKey };
  const collectionId = useCollectionId() ?? 'collection';
  const localRef = useRef<HTMLDivElement>(null);

  if (selectionManager) {
    return (
      <SelectableItemWrapper
        itemKey={itemKey}
        state={state}
        className={className}
        selectionManager={selectionManager}
        dragAndDropHooks={dragAndDropHooks}
      >
        {children}
      </SelectableItemWrapper>
    );
  }

  // Get item-level drag props if hooks provided
  const dndDragPropsRaw = dragAndDropHooks?.useDraggableItemProps
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      dragAndDropHooks.useDraggableItemProps(itemKey)
    : {};

  // Get item-level drop props if hooks provided
  const dndDropProps = dragAndDropHooks?.useDroppableItemProps
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      dragAndDropHooks.useDroppableItemProps(itemKey, collectionId)
    : null;

  const itemId = `${collectionId}-item-${itemKey}`;

  // Extract ref from drag props to merge with our combined ref
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { ref: dragRef, ...dndDragProps } = dndDragPropsRaw as {
    ref?: (el: HTMLElement | null) => void;
    [key: string]: unknown;
  };

  // Get the drop ref from props
  const dropRef = dndDropProps?.ref;

  // Create a stable ref callback that calls localRef, dropRef, and dragRef
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      (localRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      // Call the drop target ref callback
      if (dropRef) {
        dropRef(el);
      }
      // Call the drag source ref callback
      if (dragRef) {
        dragRef(el);
      }
    },
    [dropRef, dragRef],
  );

  // Check if this item is a drop target
  const isDropTarget = dndDropProps?.isOver && dndDropProps?.willAccept;
  const dropPosition = dndDropProps?.dropPosition;

  return (
    <CollectionItemContext.Provider value={contextValue}>
      <div
        ref={combinedRef}
        id={itemId}
        role="option"
        aria-selected={state.isSelected}
        data-key={itemKey}
        data-selected={state.isSelected ? true : undefined}
        data-focused={state.isFocused ? true : undefined}
        data-disabled={state.isDisabled ? true : undefined}
        data-dragging={state.isDragging ? true : undefined}
        data-drop-target={isDropTarget ? true : undefined}
        className={cx('relative', className)}
        onPointerMove={dndDropProps?.onPointerMove}
        {...dndDragProps}
      >
        {children}
        {/* Render drop indicator when this item is a valid drop target */}
        {isDropTarget &&
          dropPosition &&
          dragAndDropHooks?.renderDropIndicator?.({
            key: itemKey,
            position: dropPosition,
          })}
      </div>
    </CollectionItemContext.Provider>
  );
}

export const CollectionItem = memo(CollectionItemComponent);
CollectionItem.displayName = 'CollectionItem';

/**
 * Default render state for items.
 * All flags are false by default.
 */
export const defaultItemRenderState: ItemRenderState = {
  isSelected: false,
  isFocused: false,
  isDisabled: false,
  isDragging: false,
  isDropTarget: false,
};

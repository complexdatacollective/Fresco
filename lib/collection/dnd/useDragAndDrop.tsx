'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useDndStore } from '~/lib/dnd';
import { useDragSource } from '~/lib/dnd/useDragSource';
import { useDropTarget } from '~/lib/dnd/useDropTarget';
import { useOptionalSelectionManager } from '../contexts';
import { type Key } from '../types';
import { DropIndicator } from './DropIndicator';
import {
  type DragAndDropHooks,
  type DragAndDropOptions,
  type DropPosition,
  type DropTarget,
  type ReorderEvent,
} from './types';

/**
 * Creates drag and drop hooks for a Collection component.
 * Returns hooks that can be injected via the dragAndDropHooks prop.
 *
 * @example
 * ```tsx
 * const { dragAndDropHooks } = useDragAndDrop({
 *   getItems: (keys) => [{ type: 'item', keys }],
 *   onReorder: (e) => console.log('Reorder:', e),
 * });
 *
 * <Collection
 *   items={items}
 *   dragAndDropHooks={dragAndDropHooks}
 *   // ... other props
 * />
 * ```
 */
export function useDragAndDrop<T>(options: DragAndDropOptions<T>): {
  dragAndDropHooks: DragAndDropHooks;
} {
  const {
    getItems,
    onReorder,
    allowedDropPositions = ['before', 'after'],
    getItemMetadata,
  } = options;

  // Get the item type(s) from the getItems function for drop target acceptance
  const itemTypesRef = useRef<string[]>(['collection-item']);
  // Update types on first render based on getItems
  if (
    itemTypesRef.current.length === 1 &&
    itemTypesRef.current[0] === 'collection-item'
  ) {
    const sampleItems = getItems(new Set(['__sample__']));
    if (sampleItems.length > 0 && sampleItems[0]?.type) {
      itemTypesRef.current = [sampleItems[0].type, 'collection-item'];
    }
  }

  // Track drop target state
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Refs to avoid stale closures
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  // Handle drop completion
  const handleDrop = useCallback(
    (target: DropTarget, draggedKeys: Set<Key>) => {
      if (onReorderRef.current) {
        const event: ReorderEvent = {
          keys: draggedKeys,
          target,
        };
        onReorderRef.current(event);
      }
      setDropTarget(null);
    },
    [],
  );

  const dragAndDropHooks = useMemo<DragAndDropHooks>(
    () => ({
      useDraggableCollectionProps: () => {
        return {};
      },

      useDraggableItemProps: (key: Key) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const selectionManager = useOptionalSelectionManager();

        // Check if item is disabled - disabled items should not be draggable
        const isDisabled = selectionManager?.isDisabled(key) ?? false;

        // If the item being dragged is selected and we have multiple selection,
        // include all selected keys in the drag operation
        const isSelected = selectionManager?.isSelected(key) ?? false;
        const selectedKeys = selectionManager?.selectedKeys ?? new Set<Key>();
        const dragKeys =
          isSelected && selectedKeys.size > 1 ? selectedKeys : new Set([key]);

        const items = getItems(dragKeys);
        const firstItem = items[0];

        const metadata = {
          key,
          keys: dragKeys,
          ...(getItemMetadata ? getItemMetadata(key) : {}),
        };

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { dragProps, isDragging } = useDragSource({
          type: firstItem?.type ?? 'collection-item',
          metadata,
          announcedName:
            dragKeys.size > 1 ? `${dragKeys.size} items` : `Item ${key}`,
          disabled: isDisabled,
        });

        return {
          ...dragProps,
          isDragging,
          'data-dragging': isDragging || undefined,
        };
      },

      useDroppableItemProps: (key: Key, collectionId: string) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const dragItem = useDndStore((state) => state.dragItem);
        // Use refs instead of state to avoid stale closures in callbacks
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const hoverPositionRef = useRef<DropPosition | null>(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [hoverPositionState, setHoverPositionState] =
          useState<DropPosition | null>(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const elementRef = useRef<HTMLElement | null>(null);

        // Calculate drop position based on cursor position
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const calculateDropPosition = useCallback(
          (e: PointerEvent | MouseEvent): DropPosition => {
            const element = elementRef.current;
            if (!element) return 'after';

            const rect = element.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            // Check if dropping in upper half or lower half
            if (e.clientY < midY) {
              return allowedDropPositions.includes('before')
                ? 'before'
                : 'after';
            } else {
              return allowedDropPositions.includes('after')
                ? 'after'
                : 'before';
            }
          },
          [allowedDropPositions],
        );

        // Handle drop on this item - use ref to get latest position
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleItemDrop = useCallback(
          (metadata?: Record<string, unknown>) => {
            if (!metadata) return;

            const draggedKeys = metadata.keys as Set<Key> | undefined;
            const draggedKey = metadata.key as Key | undefined;

            if (!draggedKeys && !draggedKey) return;

            const keys = draggedKeys ?? new Set([draggedKey!]);

            // Don't allow dropping on self
            if (keys.has(key)) return;

            // Use ref to get the latest position value (not stale closure)
            const position = hoverPositionRef.current ?? 'after';

            handleDrop({ key, position }, keys);
            hoverPositionRef.current = null;
            setHoverPositionState(null);
          },
          [key, handleDrop],
        );

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { dropProps, isOver, willAccept } = useDropTarget({
          id: `${collectionId}-item-${key}`,
          accepts: itemTypesRef.current,
          announcedName: `Drop target for item ${key}`,
          onDrop: handleItemDrop,
          onDragEnter: () => {
            setDropTarget({ key, position: 'after' });
          },
          onDragLeave: () => {
            hoverPositionRef.current = null;
            setHoverPositionState(null);
            if (dropTarget?.key === key) {
              setDropTarget(null);
            }
          },
        });

        // Track pointer movement to update drop position
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handlePointerMove = useCallback(
          (e: React.PointerEvent) => {
            if (!isOver || !willAccept) return;

            const position = calculateDropPosition(e.nativeEvent);
            // Update both ref (for callbacks) and state (for rendering)
            hoverPositionRef.current = position;
            setHoverPositionState(position);
            setDropTarget({ key, position });
          },
          [isOver, willAccept, calculateDropPosition, key],
        );

        // Memoize the ref callback to avoid triggering useEffect re-runs in CollectionItem
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const combinedRef = useCallback(
          (el: HTMLElement | null) => {
            elementRef.current = el;
            // Call the original ref from dropProps
            if (typeof dropProps.ref === 'function') {
              dropProps.ref(el);
            }
          },
          [dropProps.ref, key],
        );

        // Check if this is the dragged item itself
        const isDraggedItem =
          dragItem?.metadata?.key === key ||
          (dragItem?.metadata?.keys as Set<Key> | undefined)?.has(key);

        return {
          ...dropProps,
          ref: combinedRef,
          onPointerMove: handlePointerMove,
          isOver: isDraggedItem ? false : isOver,
          willAccept: isDraggedItem ? false : willAccept,
          dropPosition:
            isOver && willAccept && !isDraggedItem ? hoverPositionState : null,
        };
      },

      renderDropIndicator: (target: { key: Key; position: string }) => {
        return (
          <DropIndicator
            key={`${target.key}-${target.position}`}
            target={target as DropTarget}
          />
        );
      },

      getDropTarget: () => dropTarget,
    }),
    [getItems, getItemMetadata, handleDrop, dropTarget, allowedDropPositions],
  );

  return { dragAndDropHooks };
}

/**
 * Hook for individual collection items to enable drop target behavior.
 * This is used internally by Collection when dragAndDropHooks is provided.
 */
export function useCollectionItemDropTarget(options: {
  key: Key;
  collectionId: string;
  allowedDropPositions: DropPosition[];
  onDrop: (target: DropTarget) => void;
  acceptTypes?: string[];
}) {
  const {
    key,
    collectionId,
    allowedDropPositions,
    onDrop,
    acceptTypes = ['collection-item'],
  } = options;

  const handleDrop = useCallback(
    (metadata?: Record<string, unknown>) => {
      if (!metadata) return;

      // Determine drop position based on metadata or default to 'on'
      const position: DropPosition =
        (metadata.position as DropPosition | undefined) ?? 'on';

      if (!allowedDropPositions.includes(position)) return;

      onDrop({ key, position });
    },
    [key, allowedDropPositions, onDrop],
  );

  const { dropProps, isOver, willAccept } = useDropTarget({
    id: `${collectionId}-item-${key}`,
    accepts: acceptTypes,
    announcedName: `Drop target for item ${key}`,
    onDrop: handleDrop,
  });

  return {
    dropProps,
    isOver,
    willAccept,
  };
}

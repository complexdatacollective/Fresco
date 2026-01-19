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
  type DropEvent,
  type DroppableCollectionResult,
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
    onDrop,
    acceptTypes,
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

  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

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
      useDroppableCollectionState: (
        collectionId: string,
      ): DroppableCollectionResult => {
        // If no onDrop handler, return inactive state with empty props
        if (!onDropRef.current) {
          return {
            state: { isOver: false, willAccept: false, isDragging: false },
            dropProps: {},
          };
        }

        // Determine accept types (from options or derived from getItems)
        const accepts = acceptTypes ?? itemTypesRef.current;

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { dropProps, isOver, willAccept, isDragging } = useDropTarget({
          id: `${collectionId}-container`,
          accepts,
          announcedName: `Drop zone for collection`,
          onDrop: (metadata) => {
            if (!metadata || !onDropRef.current) return;

            const keys = metadata.keys as Set<Key> | undefined;
            const key = metadata.key as Key | undefined;
            const type = (metadata.type as string | undefined) ?? 'unknown';

            if (!keys && !key) return;

            const dropEvent: DropEvent = {
              keys: keys ?? new Set([key!]),
              type,
              metadata,
            };

            onDropRef.current(dropEvent);
          },
        });

        return {
          state: { isOver, willAccept, isDragging },
          dropProps,
        };
      },

      useDraggableItemProps: (key: Key) => {
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

        const dragType = firstItem?.type ?? 'collection-item';

        const { dragProps, isDragging } = useDragSource({
          type: dragType,
          metadata,
          announcedName:
            dragKeys.size > 1 ? `${dragKeys.size} items` : `Item ${key}`,
          disabled: isDisabled,
        });

        return {
          ...dragProps,
          'data-dragging': isDragging || undefined,
        };
      },

      useDroppableItemProps: (key: Key, collectionId: string) => {
        const dragItem = useDndStore((state) => state.dragItem);
        // Use refs instead of state to avoid stale closures in callbacks

        const hoverPositionRef = useRef<DropPosition | null>(null);

        const [hoverPositionState, setHoverPositionState] =
          useState<DropPosition | null>(null);

        const elementRef = useRef<HTMLElement | null>(null);

        // Calculate drop position based on cursor position

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
          [],
        );

        // Handle drop on this item - use ref to get latest position

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
          [key],
        );

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

        const combinedRef = useCallback(
          (el: HTMLElement | null) => {
            elementRef.current = el;
            // Call the original ref from dropProps
            if (typeof dropProps.ref === 'function') {
              dropProps.ref(el);
            }
          },
          [dropProps],
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
    [
      getItems,
      getItemMetadata,
      handleDrop,
      dropTarget,
      allowedDropPositions,
      acceptTypes,
    ],
  );

  return { dragAndDropHooks };
}

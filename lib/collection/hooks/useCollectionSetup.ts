'use client';

import { useEffect, useMemo, useState, type RefObject } from 'react';
import { type SelectionManager } from '../selection/SelectionManager';
import { useCollection } from './useCollection';
import { useSelectionState } from './useSelectionState';
import { useSelectableCollection } from '../keyboard/useSelectableCollection';
import { type Layout } from '../layout/Layout';
import {
  type Collection,
  type Key,
  type SelectionMode,
  type CollectionProps,
} from '../types';

export type UseCollectionSetupOptions = {
  selectionMode?: SelectionMode;
  selectedKeys?: Iterable<Key>;
  defaultSelectedKeys?: Iterable<Key>;
  onSelectionChange?: (keys: Set<Key>) => void;
  disabledKeys?: Iterable<Key>;
  disallowEmptySelection?: boolean;
  dragAndDropHooks?: CollectionProps<unknown>['dragAndDropHooks'];
  layout: Layout<unknown>;
  collectionId?: string;
};

export type UseCollectionSetupResult<T> = {
  collection: Collection<T>;
  selectionManager: SelectionManager;
  disabledKeysSet: Set<Key>;
  collectionProps: ReturnType<
    typeof useSelectableCollection
  >['collectionProps'];
  dndCollectionProps: Record<string, unknown>;
};

/**
 * Hook that encapsulates the shared setup logic for collections.
 * Handles selection state, keyboard navigation, and drag-and-drop setup.
 *
 * @param options - Selection, keyboard, and DnD configuration
 * @param containerRef - Ref to the collection container element
 * @returns Collection setup result with managers and props
 */
export function useCollectionSetup<T>(
  options: UseCollectionSetupOptions,
  containerRef: RefObject<HTMLElement | null>,
): UseCollectionSetupResult<T> {
  const collection = useCollection<T>();

  // Track container width for grid column calculation
  const [containerWidth, setContainerWidth] = useState<number | undefined>(
    undefined,
  );

  // Track container width using ResizeObserver
  // We need to track a version counter to force re-evaluation when the ref becomes available
  const [refVersion, setRefVersion] = useState(0);

  // Effect to detect when ref becomes available (runs on every render intentionally)
  // This is needed because the ref might not be attached on first render if the
  // collection is initially empty and the component returns early
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (containerRef.current && containerWidth === undefined) {
      // Trigger re-evaluation by incrementing version
      setRefVersion((v) => v + 1);
    }
  });

  // Main effect to track container width using ResizeObserver
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Get initial width immediately
    const initialWidth = element.offsetWidth;
    if (initialWidth > 0) {
      setContainerWidth(initialWidth);
    }

    // Watch for size changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [refVersion, containerWidth, containerRef]);

  // Set container ref on layout for DOM-based position queries
  // This allows layouts like InlineGridLayout to query actual item positions
  const collectionId = options.collectionId ?? 'collection';
  useEffect(() => {
    options.layout.setContainerRef(containerRef, collectionId);
  }, [options.layout, containerRef, collectionId]);

  const selectionManager = useSelectionState({
    selectionMode: options.selectionMode,
    selectedKeys: options.selectedKeys,
    defaultSelectedKeys: options.defaultSelectedKeys,
    onSelectionChange: options.onSelectionChange,
    disabledKeys: options.disabledKeys,
    disallowEmptySelection: options.disallowEmptySelection,
  });

  // Convert disabledKeys prop to Set for keyboard delegate
  const disabledKeysSet = useMemo(
    () =>
      options.disabledKeys
        ? new Set<Key>(options.disabledKeys)
        : new Set<Key>(),
    [options.disabledKeys],
  );

  // Update layout with current items and container width for spatial navigation
  // This populates layoutInfos so SpatialKeyboardDelegate can use item positions
  useMemo(() => {
    if (containerWidth === undefined || containerWidth <= 0) return;

    // Build items map and ordered keys from collection
    const items = new Map<Key, { key: Key; value: unknown }>();
    const orderedKeys: Key[] = [];
    for (const node of collection) {
      items.set(node.key, node);
      orderedKeys.push(node.key);
    }

    options.layout.setItems(items, orderedKeys);
    options.layout.update({ containerWidth });
  }, [options.layout, collection, containerWidth]);

  // Create keyboard delegate for navigation using layout-specific implementation
  // Pass containerWidth so GridLayout can calculate the correct column count
  const keyboardDelegate = useMemo(
    () =>
      options.layout.getKeyboardDelegate(
        collection,
        disabledKeysSet,
        containerWidth,
      ),
    [options.layout, collection, disabledKeysSet, containerWidth],
  );

  // Setup keyboard navigation
  const { collectionProps } = useSelectableCollection({
    selectionManager,
    keyboardDelegate,
    ref: containerRef as RefObject<HTMLElement>,
    disallowEmptySelection: options.disallowEmptySelection,
  });

  // Get collection-level DnD props if hooks provided
  const dndCollectionProps = options.dragAndDropHooks
    ?.useDraggableCollectionProps
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      options.dragAndDropHooks.useDraggableCollectionProps()
    : {};

  return {
    collection,
    selectionManager,
    disabledKeysSet,
    collectionProps,
    dndCollectionProps,
  };
}

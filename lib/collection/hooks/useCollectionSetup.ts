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

  // Use ResizeObserver to track container width changes
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Get initial width
    setContainerWidth(element.offsetWidth);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [containerRef]);

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

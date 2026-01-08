'use client';

import { useMemo, type RefObject } from 'react';
import { type SelectionManager } from '../selection/SelectionManager';
import { useCollection } from './useCollection';
import { useSelectionState } from './useSelectionState';
import { ListKeyboardDelegate } from '../keyboard/ListKeyboardDelegate';
import { useSelectableCollection } from '../keyboard/useSelectableCollection';
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

  // Create keyboard delegate for navigation
  const keyboardDelegate = useMemo(
    () => new ListKeyboardDelegate(collection, disabledKeysSet),
    [collection, disabledKeysSet],
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

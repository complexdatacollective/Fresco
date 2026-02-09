'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useCollectionStore, useCollectionStoreApi } from '../contexts';
import { Selection } from '../selection/Selection';
import { SelectionManager } from '../selection/SelectionManager';
import { type SelectionProps, type SelectionState } from '../selection/types';
import { type Key } from '../types';
import { useCollection } from './useCollection';

/**
 * Hook to manage selection state within a collection.
 * Returns a SelectionManager for performing selection operations.
 *
 * @param props - Selection configuration props
 * @returns SelectionManager instance
 *
 * @example
 * ```tsx
 * function MyCollection() {
 *   const selectionManager = useSelectionState({
 *     selectionMode: 'multiple',
 *     onSelectionChange: (keys) => console.log('Selected:', keys),
 *   });
 *
 *   return (
 *     <div onClick={() => selectionManager.selectAll()}>
 *       Select All
 *     </div>
 *   );
 * }
 * ```
 */
export function useSelectionState(
  props: SelectionProps = {},
): SelectionManager {
  const {
    selectionMode = 'none',
    selectedKeys: controlledSelectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    disabledKeys: disabledKeysProp,
    selectionBehavior = 'toggle',
    disallowEmptySelection = false,
  } = props;

  const storeApi = useCollectionStoreApi<unknown>();
  const collection = useCollection();

  // Track if we're in controlled mode
  const isControlled = controlledSelectedKeys !== undefined;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  // Subscribe to selection state with shallow comparison to avoid infinite loops
  const selectionState = useCollectionStore<unknown, SelectionState>(
    useShallow((state) => ({
      selectionMode: state.selectionMode,
      selectedKeys: state.selectedKeys,
      focusedKey: state.focusedKey,
      isFocused: state.isFocused,
      childFocusStrategy: state.childFocusStrategy,
      disabledKeys: state.disabledKeys,
      disabledBehavior: state.disabledBehavior,
      selectionBehavior: state.selectionBehavior,
      disallowEmptySelection: state.disallowEmptySelection,
    })),
  );

  // Initialize selection state from props
  useEffect(() => {
    const store = storeApi.getState();

    // Set selection mode
    if (store.selectionMode !== selectionMode) {
      store.setSelectionMode(selectionMode);
    }

    // Set selection behavior
    if (store.selectionBehavior !== selectionBehavior) {
      store.setSelectionBehavior(selectionBehavior);
    }

    // Set disallow empty selection
    if (store.disallowEmptySelection !== disallowEmptySelection) {
      store.setDisallowEmptySelection(disallowEmptySelection);
    }
  }, [storeApi, selectionMode, selectionBehavior, disallowEmptySelection]);

  // Sync controlled selectedKeys
  useEffect(() => {
    if (isControlled && controlledSelectedKeys !== undefined) {
      const newKeys = new Selection(controlledSelectedKeys);
      storeApi.getState().setSelectedKeys(newKeys);
    }
  }, [storeApi, isControlled, controlledSelectedKeys]);

  // Set default selected keys on mount (uncontrolled mode)
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!isControlled && !hasInitialized.current && defaultSelectedKeys) {
      storeApi.getState().setSelectedKeys(new Selection(defaultSelectedKeys));
      hasInitialized.current = true;
    }
  }, [storeApi, isControlled, defaultSelectedKeys]);

  // Sync disabled keys
  useEffect(() => {
    if (disabledKeysProp) {
      storeApi.getState().setDisabledKeys(new Set(disabledKeysProp));
    }
  }, [storeApi, disabledKeysProp]);

  // Create setState function for SelectionManager
  const setState = useCallback(
    (updates: Partial<SelectionState>) => {
      const store = storeApi.getState();

      // In controlled mode, only call onChange, don't update state directly
      if (isControlled && 'selectedKeys' in updates) {
        const newKeys = updates.selectedKeys;
        if (newKeys && newKeys !== 'all') {
          onSelectionChangeRef.current?.(new Set(newKeys));
        } else if (newKeys === 'all') {
          // Convert 'all' to actual keys
          const allKeys = new Set<Key>();
          for (const key of collection.getKeys()) {
            if (!store.disabledKeys.has(key)) {
              allKeys.add(key);
            }
          }
          onSelectionChangeRef.current?.(allKeys);
        }
        // Remove selectedKeys from updates in controlled mode
        const otherUpdates = Object.fromEntries(
          Object.entries(updates).filter(([key]) => key !== 'selectedKeys'),
        ) as Partial<SelectionState>;
        if (Object.keys(otherUpdates).length > 0) {
          store.updateSelectionState(otherUpdates);
        }
      } else {
        store.updateSelectionState(updates);
        // Notify of selection changes in uncontrolled mode
        if ('selectedKeys' in updates && updates.selectedKeys !== undefined) {
          const newKeys = updates.selectedKeys;
          if (newKeys === 'all') {
            // Convert 'all' to actual keys
            const allKeys = new Set<Key>();
            for (const key of collection.getKeys()) {
              if (!store.disabledKeys.has(key)) {
                allKeys.add(key);
              }
            }
            onSelectionChangeRef.current?.(allKeys);
          } else {
            onSelectionChangeRef.current?.(new Set(newKeys));
          }
        }
      }
    },
    [storeApi, isControlled, collection],
  );

  // Create SelectionManager
  const selectionManager = useMemo(() => {
    return new SelectionManager(collection, selectionState, setState, {
      onSelectionChange: onSelectionChangeRef.current,
    });
  }, [collection, selectionState, setState]);

  return selectionManager;
}

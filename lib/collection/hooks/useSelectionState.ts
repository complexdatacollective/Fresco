'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useCollectionStoreApi } from '../contexts';
import { Selection } from '../selection/Selection';
import { SelectionManager } from '../selection/SelectionManager';
import { type SelectionProps, type SelectionState } from '../selection/types';
import { type Key } from '../types';
import { useCollectionData } from './useCollection';

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
  const collection = useCollectionData();

  // Track if we're in controlled mode
  const isControlled = controlledSelectedKeys !== undefined;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  // Keep a ref to the latest collection so the stable SelectionManager can
  // resolve it lazily without being re-created on every collection update.
  const collectionRef = useRef(collection);
  collectionRef.current = collection;

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

  // Track controlled mode via ref so `setState` stays stable across renders.
  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;

  // Create setState function for SelectionManager. Reads everything lazily so
  // it never changes identity — this is what lets SelectionManager itself stay
  // referentially stable.
  const setState = useCallback(
    (updates: Partial<SelectionState>) => {
      const store = storeApi.getState();

      const materializeAll = (): Set<Key> => {
        const allKeys = new Set<Key>();
        for (const key of store.orderedKeys) {
          if (!store.disabledKeys.has(key)) {
            allKeys.add(key);
          }
        }
        return allKeys;
      };

      // In controlled mode, only call onChange, don't update state directly
      if (isControlledRef.current && 'selectedKeys' in updates) {
        const newKeys = updates.selectedKeys;
        if (newKeys && newKeys !== 'all') {
          onSelectionChangeRef.current?.(new Set(newKeys));
        } else if (newKeys === 'all') {
          onSelectionChangeRef.current?.(materializeAll());
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
            onSelectionChangeRef.current?.(materializeAll());
          } else {
            onSelectionChangeRef.current?.(new Set(newKeys));
          }
        }
      }
    },
    [storeApi],
  );

  // Create a stable SelectionManager. Both the collection and state are
  // resolved lazily (via refs / store getters), so a single instance serves
  // the component's entire lifetime — no re-creation on selection changes.
  // This avoids a context-cascade re-render of every CollectionItem on every
  // toggle. SelectionManager's own `onSelectionChange` option is intentionally
  // not set here — `setState` above already notifies via `onSelectionChangeRef`.
  const selectionManager = useMemo(
    () =>
      new SelectionManager(
        () => collectionRef.current,
        () => storeApi.getState(),
        setState,
      ),
    [storeApi, setState],
  );

  return selectionManager;
}

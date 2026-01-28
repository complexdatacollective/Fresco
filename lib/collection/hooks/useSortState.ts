'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useCollectionStore, useCollectionStoreApi } from '../contexts';
import { SortManager } from '../sorting/SortManager';
import { type SortProps, type SortState } from '../sorting/types';

/**
 * Hook to manage sort state within a collection.
 * Returns a SortManager for performing sort operations.
 *
 * Follows the same pattern as useSelectionState.
 *
 * @param props - Sort configuration props
 * @returns SortManager instance
 *
 * @example
 * ```tsx
 * function MyCollection() {
 *   const sortManager = useSortState({
 *     defaultSortBy: 'name',
 *     defaultSortDirection: 'asc',
 *     defaultSortType: 'string',
 *     onSortChange: (state) => console.log('Sort changed:', state),
 *   });
 *
 *   return (
 *     <button onClick={() => sortManager.sortBy('name', 'string')}>
 *       Sort by Name
 *     </button>
 *   );
 * }
 * ```
 */
export function useSortState(props: SortProps = {}): SortManager {
  const {
    sortBy: controlledSortBy,
    sortDirection: controlledSortDirection,
    sortType: controlledSortType,
    defaultSortBy,
    defaultSortDirection = 'asc',
    defaultSortType = 'string',
    onSortChange,
    sortRules: controlledSortRules,
  } = props;

  const storeApi = useCollectionStoreApi<unknown>();

  // Track if we're in controlled mode
  const isControlled = controlledSortBy !== undefined;
  const onSortChangeRef = useRef(onSortChange);
  onSortChangeRef.current = onSortChange;

  // Subscribe to sort state with shallow comparison
  const sortState = useCollectionStore<unknown, SortState>(
    useShallow((state) => ({
      sortProperty: state.sortProperty,
      sortDirection: state.sortDirection,
      sortType: state.sortType,
      sortRules: state.sortRules,
    })),
  );

  // Initialize sort state from default props (uncontrolled mode)
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!isControlled && !hasInitialized.current && defaultSortBy) {
      const store = storeApi.getState();
      const rules = [
        {
          property: defaultSortBy,
          direction: defaultSortDirection,
          type: defaultSortType,
        },
      ];
      store.updateSortState({
        sortProperty: defaultSortBy,
        sortDirection: defaultSortDirection,
        sortType: defaultSortType,
        sortRules: rules,
      });
      hasInitialized.current = true;
    }
  }, [
    storeApi,
    isControlled,
    defaultSortBy,
    defaultSortDirection,
    defaultSortType,
  ]);

  // Sync controlled sort props
  useEffect(() => {
    if (isControlled) {
      const store = storeApi.getState();
      const rules = controlledSortBy
        ? [
            {
              property: controlledSortBy,
              direction: controlledSortDirection ?? 'asc',
              type: controlledSortType ?? 'string',
            },
          ]
        : [];
      store.updateSortState({
        sortProperty: controlledSortBy ?? null,
        sortDirection: controlledSortDirection ?? 'asc',
        sortType: controlledSortType ?? 'string',
        sortRules: controlledSortRules ?? rules,
      });
    }
  }, [
    storeApi,
    isControlled,
    controlledSortBy,
    controlledSortDirection,
    controlledSortType,
    controlledSortRules,
  ]);

  // Create setState function for SortManager
  const setState = useCallback(
    (updates: Partial<SortState>) => {
      const store = storeApi.getState();

      if (isControlled) {
        // In controlled mode, only call onChange, don't update state directly
        if (
          'sortProperty' in updates ||
          'sortDirection' in updates ||
          'sortType' in updates
        ) {
          onSortChangeRef.current?.({
            property: updates.sortProperty ?? store.sortProperty,
            direction: updates.sortDirection ?? store.sortDirection,
            type: updates.sortType ?? store.sortType,
          });
        }
        // Don't update state in controlled mode - let parent manage it
      } else {
        // Uncontrolled mode - update state directly
        store.updateSortState(updates);
        // Re-sort items with new sort state
        store.resortItems();
      }
    },
    [storeApi, isControlled],
  );

  // Create SortManager
  const sortManager = useMemo(() => {
    return new SortManager(sortState, setState, {
      onSortChange: onSortChangeRef.current,
    });
  }, [sortState, setState]);

  return sortManager;
}

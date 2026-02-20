'use client';

import { debounce } from 'es-toolkit';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useCollectionStore, useCollectionStoreApi } from '../contexts';
import { FilterManager } from '../filtering/FilterManager';
import { type FilterProps, type FilterState } from '../filtering/types';
import { type KeyExtractor } from '../types';
import { useSearchWorker } from './useSearchWorker';

type UseFilterStateOptions<T> = FilterProps & {
  items: T[];
  keyExtractor: KeyExtractor<T>;
};

/**
 * Hook to manage filter state within a collection.
 * Returns a FilterManager for performing filter operations.
 *
 * @param options - Filter configuration and items
 * @returns FilterManager instance or null if filtering is disabled
 */
export function useFilterState<T extends Record<string, unknown>>(
  options: UseFilterStateOptions<T>,
): FilterManager | null {
  const {
    filterQuery: controlledFilterQuery,
    defaultFilterQuery,
    onFilterChange,
    onFilterResultsChange,
    filterKeys,
    filterFuseOptions,
    filterDebounceMs = 300,
    filterMinQueryLength = 1,
    items,
    keyExtractor,
  } = options;

  const storeApi = useCollectionStoreApi<unknown>();

  // Determine if filtering is enabled - must be stable for hooks
  const isFilteringEnabled = Boolean(filterKeys && filterKeys.length > 0);
  const safeFilterKeys = isFilteringEnabled ? filterKeys! : ['_placeholder_'];

  // Track if we're in controlled mode
  const isControlled = controlledFilterQuery !== undefined;
  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;
  const onFilterResultsChangeRef = useRef(onFilterResultsChange);
  onFilterResultsChangeRef.current = onFilterResultsChange;

  // Initialize the search worker (always called, but with empty items if disabled)
  const { search, isReady, isIndexing } = useSearchWorker({
    items: isFilteringEnabled ? items : [],
    keyExtractor,
    filterKeys: safeFilterKeys,
    fuseOptions: filterFuseOptions,
  });

  // Subscribe to filter state with shallow comparison
  const filterState = useCollectionStore<unknown, FilterState>(
    useShallow((state) => ({
      filterQuery: state.filterQuery,
      filterDebouncedQuery: state.filterDebouncedQuery,
      filterIsFiltering: state.filterIsFiltering,
      filterIsIndexing: state.filterIsIndexing,
      filterMatchCount: state.filterMatchCount,
      filterMatchingKeys: state.filterMatchingKeys,
      filterScores: state.filterScores,
    })),
  );

  // Sync isIndexing from worker to store
  useEffect(() => {
    if (!isFilteringEnabled) return;
    const store = storeApi.getState();
    store.updateFilterState({ filterIsIndexing: isIndexing });
  }, [storeApi, isIndexing, isFilteringEnabled]);

  // Initialize filter state from default props (uncontrolled mode)
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!isFilteringEnabled) return;
    if (!isControlled && !hasInitialized.current && defaultFilterQuery) {
      const store = storeApi.getState();
      store.updateFilterState({
        filterQuery: defaultFilterQuery,
        filterDebouncedQuery: defaultFilterQuery,
      });
      hasInitialized.current = true;
    }
  }, [storeApi, isControlled, defaultFilterQuery, isFilteringEnabled]);

  // Sync controlled filter props
  useEffect(() => {
    if (!isFilteringEnabled) return;
    if (isControlled) {
      const store = storeApi.getState();
      store.updateFilterState({
        filterQuery: controlledFilterQuery,
      });
    }
  }, [storeApi, isControlled, controlledFilterQuery, isFilteringEnabled]);

  // Perform search when debounced query changes
  const performSearch = useCallback(
    async (query: string) => {
      if (!isReady || !isFilteringEnabled) return;

      const store = storeApi.getState();
      store.updateFilterState({ filterIsFiltering: true });

      try {
        const result = await search(query, filterMinQueryLength);

        // Check if query is empty or below min length
        const isEmptyQuery = query.length < filterMinQueryLength;

        store.updateFilterState({
          filterDebouncedQuery: query,
          filterMatchingKeys: isEmptyQuery ? null : result.matchingKeys,
          filterMatchCount: isEmptyQuery ? null : result.matchCount,
          filterScores: isEmptyQuery ? null : result.scores,
          filterIsFiltering: false,
        });

        // Re-apply filtering and sorting
        store.resortItems();

        // Notify callback if provided
        if (!isEmptyQuery) {
          onFilterResultsChangeRef.current?.(
            result.matchingKeys,
            result.matchCount,
          );
        }
      } catch {
        store.updateFilterState({ filterIsFiltering: false });
      }
    },
    [storeApi, search, isReady, filterMinQueryLength, isFilteringEnabled],
  );

  // Create debounced search function
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    debouncedSearchRef.current = debounce(performSearch, filterDebounceMs);

    return () => {
      debouncedSearchRef.current?.cancel();
    };
  }, [performSearch, filterDebounceMs]);

  // Create setState function for FilterManager
  const setState = useCallback(
    (updates: Partial<FilterState>) => {
      if (!isFilteringEnabled) return;

      const store = storeApi.getState();

      if (isControlled) {
        // In controlled mode, only call onChange, don't update state directly
        if ('filterQuery' in updates && updates.filterQuery !== undefined) {
          onFilterChangeRef.current?.(updates.filterQuery);
        }
        // Don't update state in controlled mode - let parent manage it
      } else {
        // Uncontrolled mode - update state directly
        store.updateFilterState(updates);

        // If query changed, trigger debounced search
        if ('filterQuery' in updates && updates.filterQuery !== undefined) {
          void debouncedSearchRef.current?.(updates.filterQuery);
        }
      }
    },
    [storeApi, isControlled, isFilteringEnabled],
  );

  // Trigger search when controlled query changes
  useEffect(() => {
    if (!isFilteringEnabled) return;
    if (isControlled && isReady) {
      void debouncedSearchRef.current?.(controlledFilterQuery ?? '');
    }
  }, [isControlled, controlledFilterQuery, isReady, isFilteringEnabled]);

  // Trigger initial search when worker becomes ready
  useEffect(() => {
    if (!isFilteringEnabled) return;
    if (isReady) {
      const store = storeApi.getState();
      const currentQuery = store.filterQuery;
      if (currentQuery) {
        void debouncedSearchRef.current?.(currentQuery);
      }
    }
  }, [isReady, storeApi, isFilteringEnabled]);

  // Create FilterManager (or return default state if disabled)
  const filterManager = useMemo(() => {
    if (!isFilteringEnabled) {
      return null;
    }
    return new FilterManager(filterState, setState, {
      onFilterChange: onFilterChangeRef.current,
      onFilterResultsChange: onFilterResultsChangeRef.current,
    });
  }, [filterState, setState, isFilteringEnabled]);

  return filterManager;
}

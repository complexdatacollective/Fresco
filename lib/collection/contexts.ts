'use client';

import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import { type FilterManager } from './filtering/FilterManager';
import { type SelectionManager } from './selection/SelectionManager';
import { type SortManager } from './sorting/SortManager';
import { type CollectionStoreApi, type FullCollectionStore } from './store';
import { type Key } from './types';

/**
 * Context for the collection store.
 * Provides access to the Zustand store instance.
 */
export const CollectionStoreContext =
  createContext<CollectionStoreApi<unknown> | null>(null);

/**
 * Hook to access the collection store from context.
 * Must be used within a CollectionProvider.
 *
 * @param selector - Optional selector to pick specific state
 * @returns Selected state from the store
 */
export function useCollectionStore<T, R>(
  selector: (state: FullCollectionStore<T>) => R,
): R {
  const store = useContext(CollectionStoreContext);

  if (!store) {
    throw new Error(
      'useCollectionStore must be used within a CollectionProvider',
    );
  }

  return useStore(store as CollectionStoreApi<T>, selector);
}

/**
 * Hook to access the raw store instance.
 * Useful for imperative operations or subscriptions.
 */
export function useCollectionStoreApi<T>(): CollectionStoreApi<T> {
  const store = useContext(CollectionStoreContext);

  if (!store) {
    throw new Error(
      'useCollectionStoreApi must be used within a CollectionProvider',
    );
  }

  return store as CollectionStoreApi<T>;
}

/**
 * Context for item-specific state.
 * Used by CollectionItem to access its key without prop drilling.
 */
type CollectionItemContextValue = {
  key: Key;
};

export const CollectionItemContext =
  createContext<CollectionItemContextValue | null>(null);

/**
 * Context for the SelectionManager.
 * Provides access to selection operations throughout the component tree.
 */
export const SelectionManagerContext = createContext<SelectionManager | null>(
  null,
);

/**
 * Hook to access the SelectionManager from context.
 */
export function useSelectionManager(): SelectionManager {
  const manager = useContext(SelectionManagerContext);

  if (!manager) {
    throw new Error(
      'useSelectionManager must be used within a Collection with selection enabled',
    );
  }

  return manager;
}

/**
 * Hook to optionally access the SelectionManager.
 * Returns null if selection is not enabled.
 */
export function useOptionalSelectionManager(): SelectionManager | null {
  return useContext(SelectionManagerContext);
}

/**
 * Context for the collection ID.
 * Used for generating consistent ARIA IDs for items.
 */
export const CollectionIdContext = createContext<string | undefined>(undefined);

/**
 * Hook to access the collection ID from context.
 */
export function useCollectionId(): string | undefined {
  return useContext(CollectionIdContext);
}

/**
 * Context for the SortManager.
 * Provides access to sort operations throughout the component tree.
 */
export const SortManagerContext = createContext<SortManager | null>(null);

/**
 * Hook to access the SortManager from context.
 */
export function useSortManager(): SortManager {
  const manager = useContext(SortManagerContext);

  if (!manager) {
    throw new Error(
      'useSortManager must be used within a Collection with sorting enabled',
    );
  }

  return manager;
}

/**
 * Hook to optionally access the SortManager.
 * Returns null if sorting context is not available.
 */
export function useOptionalSortManager(): SortManager | null {
  return useContext(SortManagerContext);
}

/**
 * Context for the FilterManager.
 * Provides access to filter operations throughout the component tree.
 * Value is null when filterKeys is not configured.
 */
export const FilterManagerContext = createContext<FilterManager | null>(null);

/**
 * Hook to access the FilterManager from context.
 */
export function useFilterManager(): FilterManager {
  const manager = useContext(FilterManagerContext);

  if (!manager) {
    throw new Error(
      'useFilterManager must be used within a Collection with filterKeys configured',
    );
  }

  return manager;
}

/**
 * Hook to optionally access the FilterManager.
 * Returns null if filtering is not configured.
 */
export function useOptionalFilterManager(): FilterManager | null {
  return useContext(FilterManagerContext);
}

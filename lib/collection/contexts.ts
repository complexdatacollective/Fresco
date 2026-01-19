'use client';

import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import { type SelectionManager } from './selection/SelectionManager';
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

'use client';

import { useMemo } from 'react';
import { useCollectionStore, useCollectionStoreApi } from '../contexts';
import { type Collection, type Key, type Node } from '../types';

/**
 * Hook to access collection data and navigation methods.
 * Provides an immutable Collection interface for querying items.
 *
 * @returns Collection interface with query methods
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const collection = useCollectionData<MyItem>();
 *
 *   const firstKey = collection.getFirstKey();
 *   const item = collection.getItem(firstKey);
 *
 *   return <div>{item?.value.name}</div>;
 * }
 * ```
 */
export function useCollectionData<T>(): Collection<T> {
  const storeApi = useCollectionStoreApi<T>();

  // Subscribe to changes in items and orderedKeys
  const items = useCollectionStore<T, Map<Key, Node<T>>>(
    (state) => state.items,
  );
  const orderedKeys = useCollectionStore<T, Key[]>(
    (state) => state.orderedKeys,
  );
  const size = useCollectionStore<T, number>((state) => state.size);

  // Create stable collection interface
  const collection = useMemo<Collection<T>>(() => {
    const store = storeApi.getState();

    return {
      size,

      getKeys(): Iterable<Key> {
        return orderedKeys;
      },

      getItem(key: Key): Node<T> | undefined {
        return items.get(key);
      },

      getFirstKey(): Key | null {
        return store.getFirstKey();
      },

      getLastKey(): Key | null {
        return store.getLastKey();
      },

      getKeyBefore(key: Key): Key | null {
        return store.getKeyBefore(key);
      },

      getKeyAfter(key: Key): Key | null {
        return store.getKeyAfter(key);
      },

      *[Symbol.iterator](): Iterator<Node<T>> {
        for (const key of orderedKeys) {
          const node = items.get(key);
          if (node) {
            yield node;
          }
        }
      },
    };
  }, [storeApi, items, orderedKeys, size]);

  return collection;
}

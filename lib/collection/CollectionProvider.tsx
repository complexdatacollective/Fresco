'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { CollectionStoreContext } from './contexts';
import { createCollectionStore, type CollectionStoreApi } from './store';
import { type KeyExtractor, type TextValueExtractor } from './types';

type CollectionProviderProps<T> = {
  /** Items to populate the collection with */
  items: T[];
  /** Function to extract unique key from each item */
  keyExtractor: KeyExtractor<T>;
  /** Function to extract text value for type-ahead search and accessibility */
  textValueExtractor: TextValueExtractor<T>;
  /** Child components */
  children: ReactNode;
};

/**
 * Provider component that creates and manages the collection store.
 * Wrap your Collection and related components with this provider.
 *
 * @example
 * ```tsx
 * <CollectionProvider items={data} keyExtractor={(item) => item.id}>
 *   <Collection renderItem={(item) => <div>{item.name}</div>} />
 * </CollectionProvider>
 * ```
 */
export function CollectionProvider<T>({
  items,
  keyExtractor,
  textValueExtractor,
  children,
}: CollectionProviderProps<T>) {
  const storeRef = useRef<CollectionStoreApi<T> | null>(null);
  const keyExtractorRef = useRef(keyExtractor);
  const textValueExtractorRef = useRef(textValueExtractor);

  // Update refs when functions change
  keyExtractorRef.current = keyExtractor;
  textValueExtractorRef.current = textValueExtractor;

  // Create store once
  storeRef.current ??= createCollectionStore<T>();

  // Update items when they change
  useEffect(() => {
    storeRef.current
      ?.getState()
      .setItems(items, keyExtractorRef.current, textValueExtractorRef.current);
  }, [items]);

  return (
    <CollectionStoreContext.Provider
      value={storeRef.current as CollectionStoreApi<unknown>}
    >
      {children}
    </CollectionStoreContext.Provider>
  );
}

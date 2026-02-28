'use client';

import { releaseProxy, wrap, type Remote } from 'comlink';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type FilterProperty,
  type FuseOptions,
  type WorkerSearchResult,
} from '../filtering/types';
import { type Key, type KeyExtractor } from '../types';

/**
 * Interface for the SearchEngine exposed by the worker.
 */
type SearchEngine = {
  init: (
    items: (Record<string, unknown> & { _key: string })[],
    keys: string[],
    options?: FuseOptions,
  ) => void;
  search: (query: string, minQueryLength?: number) => WorkerSearchResult;
  updateItems: (items: (Record<string, unknown> & { _key: string })[]) => void;
  isReady: () => boolean;
};

type UseSearchWorkerOptions<T> = {
  items: T[];
  keyExtractor: KeyExtractor<T>;
  filterKeys: FilterProperty[];
  fuseOptions?: FuseOptions;
};

type UseSearchWorkerReturn = {
  isReady: boolean;
  isIndexing: boolean;
  search: (
    query: string,
    minQueryLength?: number,
  ) => Promise<{
    matchingKeys: Set<Key>;
    matchCount: number;
    scores: Map<Key, number>;
  }>;
};

/**
 * Hook to manage a Web Worker for fuzzy search operations.
 * Only creates the worker when called - if this hook is not used,
 * no worker is created.
 *
 * @param options - Configuration for the search worker
 * @returns Object with search function and status flags
 */
export function useSearchWorker<T extends Record<string, unknown>>({
  items,
  keyExtractor,
  filterKeys,
  fuseOptions,
}: UseSearchWorkerOptions<T>): UseSearchWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Remote<SearchEngine> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  // Convert FilterProperty[] to string[] for fuse.js
  const fuseKeys = filterKeys.map((key) =>
    Array.isArray(key) ? key.join('.') : key,
  );
  const fuseKeysRef = useRef(fuseKeys);
  fuseKeysRef.current = fuseKeys;

  const fuseOptionsRef = useRef(fuseOptions);
  fuseOptionsRef.current = fuseOptions;

  const isUnmountedRef = useRef(false);

  // Initialize worker
  useEffect(() => {
    isUnmountedRef.current = false;

    const worker = new Worker(
      new URL('../filtering/search.worker.ts', import.meta.url),
      { type: 'module' },
    );

    workerRef.current = worker;
    apiRef.current = wrap<SearchEngine>(worker);

    // Cleanup on unmount - release Comlink proxy before terminating worker
    return () => {
      isUnmountedRef.current = true;
      if (apiRef.current) {
        apiRef.current[releaseProxy]();
      }
      worker.terminate();
      workerRef.current = null;
      apiRef.current = null;
      setIsReady(false);
    };
  }, []);

  // Initialize/update index when items change
  useEffect(() => {
    let cancelled = false;

    const initIndex = async () => {
      if (!apiRef.current || items.length === 0) {
        if (!cancelled && !isUnmountedRef.current) {
          setIsReady(items.length === 0);
        }
        return;
      }

      if (!cancelled && !isUnmountedRef.current) {
        setIsIndexing(true);
      }
      try {
        // Serialize items for worker (add _key for tracking)
        const serializedItems = items.map((item) => ({
          ...item,
          _key: String(keyExtractor(item)),
        }));

        await apiRef.current.init(
          serializedItems,
          fuseKeysRef.current,
          fuseOptionsRef.current,
        );
        if (!cancelled && !isUnmountedRef.current) {
          setIsReady(true);
        }
      } catch {
        // Worker was terminated during init - ignore
      } finally {
        if (!cancelled && !isUnmountedRef.current) {
          setIsIndexing(false);
        }
      }
    };

    void initIndex();

    return () => {
      cancelled = true;
    };
  }, [items, keyExtractor]);

  // Search function
  const search = useCallback(async (query: string, minQueryLength = 1) => {
    if (!apiRef.current || isUnmountedRef.current) {
      return {
        matchingKeys: new Set<Key>(),
        matchCount: 0,
        scores: new Map<Key, number>(),
      };
    }

    try {
      const result = await apiRef.current.search(query, minQueryLength);

      return {
        matchingKeys: new Set<Key>(result.matchingKeys),
        matchCount: result.matchCount,
        scores: new Map<Key, number>(result.scores),
      };
    } catch {
      // Worker was terminated during search - return empty results
      return {
        matchingKeys: new Set<Key>(),
        matchCount: 0,
        scores: new Map<Key, number>(),
      };
    }
  }, []);

  return {
    isReady,
    isIndexing,
    search,
  };
}

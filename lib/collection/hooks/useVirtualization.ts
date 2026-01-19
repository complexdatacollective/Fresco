'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { rafThrottle } from '~/lib/dnd/utils';
import { type RowInfo } from '../layout/types';
import { type Key } from '../types';

export type UseVirtualizationOptions = {
  rows: RowInfo[];
  scrollRef: React.RefObject<HTMLElement | null>;
  /** Number of rows to render beyond the visible viewport. Default: 5 */
  overscan?: number;
};

export type VirtualItem = {
  row: RowInfo;
  offsetTop: number;
};

export type UseVirtualizationResult = {
  /** Items currently visible (including overscan) */
  virtualItems: VirtualItem[];
  /** Total height of all content */
  totalHeight: number;
  /** Scroll to bring a specific key into view */
  scrollToKey: (key: Key) => void;
};

/**
 * Custom virtualization hook that renders only visible rows.
 * Uses scroll position and row heights to determine which rows to render.
 */
export function useVirtualization({
  rows,
  scrollRef,
  overscan = 1,
}: UseVirtualizationOptions): UseVirtualizationResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Track the scroll element in state to trigger effects when ref becomes available
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  // Sync ref to state when it changes (runs every render to detect ref population)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (scrollRef.current !== scrollElement) {
      setScrollElement(scrollRef.current);
    }
  });

  // Build a map of key -> row index for quick lookups
  const keyToRowIndex = useMemo(() => {
    const map = new Map<Key, number>();
    for (const row of rows) {
      for (const key of row.itemKeys) {
        map.set(key, row.rowIndex);
      }
    }
    return map;
  }, [rows]);

  // Calculate total height including gaps
  const totalHeight = useMemo(() => {
    if (rows.length === 0) return 0;
    const lastRow = rows[rows.length - 1];
    if (!lastRow) return 0;
    return lastRow.yStart + lastRow.height;
  }, [rows]);

  // Track scroll position with RAF throttling for performance
  const scrollTopRef = useRef(0);

  useEffect(() => {
    if (!scrollElement) return;

    // Throttle scroll updates to animation frames to prevent excessive re-renders
    const updateScrollTop = rafThrottle(() => {
      setScrollTop(scrollTopRef.current);
    });

    const handleScroll = () => {
      scrollTopRef.current = scrollElement.scrollTop;
      updateScrollTop();
    };

    // Initial scroll position
    scrollTopRef.current = scrollElement.scrollTop;
    setScrollTop(scrollElement.scrollTop);

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      updateScrollTop.cancel();
    };
  }, [scrollElement]);

  // Track viewport height with ResizeObserver
  useLayoutEffect(() => {
    if (!scrollElement) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });

    // Initial height
    setViewportHeight(scrollElement.clientHeight);

    observer.observe(scrollElement);
    return () => observer.disconnect();
  }, [scrollElement]);

  // Binary search to find first visible row (row that intersects or is below scrollTop)
  const findFirstVisibleRow = useCallback(
    (scrollTop: number): number => {
      if (rows.length === 0) return 0;

      let low = 0;
      let high = rows.length - 1;

      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const row = rows[mid];
        if (!row) break;

        if (row.yStart + row.height < scrollTop) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }

      return low;
    },
    [rows],
  );

  // Binary search to find last visible row (row that starts at or before viewportEnd)
  const findLastVisibleRow = useCallback(
    (viewportEnd: number): number => {
      if (rows.length === 0) return 0;

      let low = 0;
      let high = rows.length - 1;

      while (low < high) {
        // Use ceiling division to bias towards higher index
        const mid = Math.ceil((low + high) / 2);
        const row = rows[mid];
        if (!row) break;

        if (row.yStart <= viewportEnd) {
          low = mid;
        } else {
          high = mid - 1;
        }
      }

      return low;
    },
    [rows],
  );

  // Calculate which rows are visible (including overscan)
  const virtualItems = useMemo((): VirtualItem[] => {
    if (rows.length === 0 || viewportHeight === 0) return [];

    const viewportEnd = scrollTop + viewportHeight;

    // Binary search for first and last visible rows - O(log n) for both
    const firstVisibleIndex = findFirstVisibleRow(scrollTop);
    const lastVisibleIndex = findLastVisibleRow(viewportEnd);

    // Apply overscan buffer
    const startIndex = Math.max(0, firstVisibleIndex - overscan);
    const endIndex = Math.min(rows.length, lastVisibleIndex + 1 + overscan);

    // Build virtual items for visible range
    const items: VirtualItem[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      const row = rows[i];
      if (!row) continue;

      items.push({
        row,
        offsetTop: row.yStart,
      });
    }

    return items;
  }, [
    rows,
    scrollTop,
    viewportHeight,
    overscan,
    findFirstVisibleRow,
    findLastVisibleRow,
  ]);

  // Scroll to bring a specific key into view
  const scrollToKey = useCallback(
    (key: Key) => {
      const element = scrollRef.current;
      if (!element) return;

      const rowIndex = keyToRowIndex.get(key);
      if (rowIndex === undefined) return;

      const row = rows[rowIndex];
      if (!row) return;

      const rowTop = row.yStart;
      const rowBottom = row.yStart + row.height;
      const viewportTop = element.scrollTop;
      const viewportBottom = viewportTop + element.clientHeight;

      // Check if row is already fully visible
      if (rowTop >= viewportTop && rowBottom <= viewportBottom) {
        return;
      }

      // Scroll to bring row into view
      if (rowTop < viewportTop) {
        // Row is above viewport - scroll up
        element.scrollTo({
          top: rowTop,
          behavior: 'smooth',
        });
      } else if (rowBottom > viewportBottom) {
        // Row is below viewport - scroll down
        element.scrollTo({
          top: rowBottom - element.clientHeight,
          behavior: 'smooth',
        });
      }
    },
    [scrollRef, keyToRowIndex, rows],
  );

  return {
    virtualItems,
    totalHeight,
    scrollToKey,
  };
}

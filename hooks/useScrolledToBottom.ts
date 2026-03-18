'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks whether a sentinel element is visible within its scroll container.
 * Uses IntersectionObserver to detect when the user has scrolled to the bottom.
 *
 * Returns a callback ref to attach to a sentinel element, plus a boolean.
 * Uses a callback ref (not a RefObject) so the observer automatically
 * reconnects when the sentinel DOM node changes (e.g. between slide transitions).
 *
 * If content doesn't overflow (sentinel visible on mount), returns true immediately.
 */
export function useScrolledToBottom(
  rootRef?: React.RefObject<HTMLElement | null>,
) {
  const [isAtBottom, setIsAtBottom] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) {
        setIsAtBottom(false);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) {
            setIsAtBottom(entry.isIntersecting);
          }
        },
        { root: rootRef?.current ?? null },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [rootRef],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { isAtBottom, sentinelRef };
}

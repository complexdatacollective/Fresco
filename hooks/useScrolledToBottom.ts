'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks whether a sentinel element has ever been visible within its scroll
 * container. Once the sentinel intersects, the state latches to true and does
 * not revert when the user scrolls away again.
 *
 * Returns a callback ref to attach to a sentinel element, plus a boolean.
 * Uses a callback ref (not a RefObject) so the observer automatically
 * reconnects when the sentinel DOM node changes (e.g. between slide transitions).
 * When the sentinel detaches (node is null), the latch resets so a fresh DOM
 * instance starts from false.
 *
 * If content doesn't overflow (sentinel visible on mount), returns true immediately.
 */
export function useScrolledToBottom(
  rootRef?: React.RefObject<HTMLElement | null>,
) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) {
        setHasScrolledToBottom(false);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) {
            setHasScrolledToBottom(true);
          }
        },
        { root: rootRef?.current ?? null },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [rootRef],
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { hasScrolledToBottom, sentinelRef };
}

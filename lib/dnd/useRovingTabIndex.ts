import { useCallback, useEffect, useRef, useState } from 'react';
import { useDndStore } from './DndStoreProvider';

type UseRovingTabIndexOptions = {
  zoneId: string;
  itemIds: string[];
};

export type RovingTabIndexItemProps = {
  ref: (element: HTMLElement | null) => void;
  tabIndex: number;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
};

export type RovingTabIndexContextValue = {
  getItemProps: (id: string) => RovingTabIndexItemProps;
};

export function useRovingTabIndex(options: UseRovingTabIndexOptions) {
  const { zoneId, itemIds } = options;

  const [focusedId, setFocusedIdState] = useState<string | null>(
    itemIds[0] ?? null,
  );
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Subscribe to DnD store for focus coordination
  const pendingFocusZoneId = useDndStore((state) => state.pendingFocusZoneId);
  const pendingFocusItemId = useDndStore((state) => state.pendingFocusItemId);
  const clearPendingFocus = useDndStore((state) => state.clearPendingFocus);

  // Reset focusedId if the focused item was removed from the list
  useEffect(() => {
    if (focusedId && !itemIds.includes(focusedId)) {
      setFocusedIdState(itemIds[0] ?? null);
    }
  }, [focusedId, itemIds]);

  // Handle focus requests from the DnD store
  useEffect(() => {
    if (pendingFocusZoneId === zoneId) {
      if (pendingFocusItemId && itemIds.includes(pendingFocusItemId)) {
        // Focus a specific item (follow-item mode)
        setFocusedIdState(pendingFocusItemId);
        const element = itemRefs.current.get(pendingFocusItemId);
        element?.focus();
      } else if (pendingFocusItemId === null && itemIds.length > 0) {
        // Focus the first item in the zone (stay-in-source mode)
        const firstItemId = itemIds[0];
        if (firstItemId) {
          setFocusedIdState(firstItemId);
          const element = itemRefs.current.get(firstItemId);
          element?.focus();
        }
      }
      clearPendingFocus(zoneId);
    }
  }, [
    pendingFocusZoneId,
    pendingFocusItemId,
    zoneId,
    itemIds,
    clearPendingFocus,
  ]);

  const setFocusedId = useCallback((id: string) => {
    setFocusedIdState(id);
    const element = itemRefs.current.get(id);
    element?.focus();
  }, []);

  const registerItem = useCallback((id: string, element: HTMLElement) => {
    itemRefs.current.set(id, element);
  }, []);

  const unregisterItem = useCallback((id: string) => {
    itemRefs.current.delete(id);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentId: string) => {
      const currentIndex = itemIds.indexOf(currentId);
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          nextIndex = (currentIndex + 1) % itemIds.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          nextIndex = (currentIndex - 1 + itemIds.length) % itemIds.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = itemIds.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== null) {
        const nextId = itemIds[nextIndex];
        if (nextId) {
          e.preventDefault();
          setFocusedId(nextId);
        }
      }
    },
    [itemIds, setFocusedId],
  );

  const getTabIndex = useCallback(
    (id: string) => {
      if (focusedId === null) {
        return itemIds[0] === id ? 0 : -1;
      }
      return focusedId === id ? 0 : -1;
    },
    [focusedId, itemIds],
  );

  const getItemProps = useCallback(
    (id: string): RovingTabIndexItemProps => ({
      ref: (element: HTMLElement | null) => {
        if (element) {
          registerItem(id, element);
        } else {
          unregisterItem(id);
        }
      },
      tabIndex: getTabIndex(id),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, id),
      onFocus: () => setFocusedIdState(id),
    }),
    [registerItem, unregisterItem, getTabIndex, handleKeyDown],
  );

  return {
    focusedId,
    setFocusedId,
    getItemProps,
  };
}

import { subscribeWithSelector } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { Selection } from './selection/Selection';
import {
  type DisabledBehavior,
  type FocusStrategy,
  type SelectionBehavior,
  type SelectionMode,
  type SelectionState,
} from './selection/types';
import {
  type CollectionState,
  type CollectionStore,
  type Key,
  type KeyExtractor,
  type Node,
  type TextValueExtractor,
} from './types';

/**
 * Combined state including collection and selection.
 */
type FullCollectionState<T> = CollectionState<T> & SelectionState;

/**
 * Combined store type including collection and selection actions.
 */
export type FullCollectionStore<T> = CollectionStore<T> & {
  // Selection state (already in SelectionState)
  selectionMode: SelectionMode;
  selectedKeys: Set<Key> | 'all';
  focusedKey: Key | null;
  isFocused: boolean;
  childFocusStrategy: FocusStrategy | null;
  disabledKeys: Set<Key>;
  disabledBehavior: DisabledBehavior;
  selectionBehavior: SelectionBehavior;
  disallowEmptySelection: boolean;

  // Selection actions
  setSelectionMode: (mode: SelectionMode) => void;
  setSelectedKeys: (keys: Set<Key> | 'all') => void;
  setFocusedKey: (key: Key | null, childFocusStrategy?: FocusStrategy) => void;
  setFocused: (isFocused: boolean) => void;
  setDisabledKeys: (keys: Set<Key>) => void;
  setSelectionBehavior: (behavior: SelectionBehavior) => void;
  setDisallowEmptySelection: (disallow: boolean) => void;
  updateSelectionState: (updates: Partial<SelectionState>) => void;
};

/**
 * Default initial state for the collection store.
 */
const defaultInitState = <T>(): FullCollectionState<T> => ({
  // Collection state
  items: new Map(),
  orderedKeys: [],
  size: 0,
  // Selection state
  selectionMode: 'none',
  selectedKeys: new Selection(),
  focusedKey: null,
  isFocused: false,
  childFocusStrategy: null,
  disabledKeys: new Set(),
  disabledBehavior: 'selection',
  selectionBehavior: 'toggle',
  disallowEmptySelection: false,
});

/**
 * Build nodes from items array.
 * Converts user items into Node objects with computed metadata.
 */
function buildNodes<T>(
  items: T[],
  keyExtractor: KeyExtractor<T>,
  textValueExtractor?: TextValueExtractor<T>,
): { itemsMap: Map<Key, Node<T>>; orderedKeys: Key[] } {
  const itemsMap = new Map<Key, Node<T>>();
  const orderedKeys: Key[] = [];

  items.forEach((item, index) => {
    const key = keyExtractor(item);
    const node: Node<T> = {
      key,
      type: 'item',
      value: item,
      textValue: textValueExtractor?.(item),
      index,
      level: 0,
    };
    itemsMap.set(key, node);
    orderedKeys.push(key);
  });

  return { itemsMap, orderedKeys };
}

/**
 * Factory function to create a collection store.
 * Follows the pattern from lib/dnd/store.ts.
 *
 * @param initState - Optional initial state
 * @returns Zustand store with collection state and actions
 */
export const createCollectionStore = <T>(
  initState: FullCollectionState<T> = defaultInitState<T>(),
) => {
  return createStore<FullCollectionStore<T>>()(
    subscribeWithSelector((set, get) => ({
      ...initState,

      // ============================================================
      // Collection Actions
      // ============================================================

      setItems: (
        items: T[],
        keyExtractor: KeyExtractor<T>,
        textValueExtractor?: TextValueExtractor<T>,
      ) => {
        const { itemsMap, orderedKeys } = buildNodes(
          items,
          keyExtractor,
          textValueExtractor,
        );

        // Clean up selection state for removed items
        const state = get();
        let newSelectedKeys = state.selectedKeys;
        let newFocusedKey = state.focusedKey;

        if (newSelectedKeys !== 'all' && newSelectedKeys.size > 0) {
          const validKeys = new Selection();
          for (const key of newSelectedKeys) {
            if (itemsMap.has(key)) {
              validKeys.add(key);
            }
          }
          if (validKeys.size !== newSelectedKeys.size) {
            newSelectedKeys = validKeys;
          }
        }

        if (newFocusedKey !== null && !itemsMap.has(newFocusedKey)) {
          newFocusedKey = orderedKeys[0] ?? null;
        }

        set({
          items: itemsMap,
          orderedKeys,
          size: items.length,
          selectedKeys: newSelectedKeys,
          focusedKey: newFocusedKey,
        });
      },

      getItem: (key: Key) => {
        return get().items.get(key);
      },

      getKeyBefore: (key: Key) => {
        const state = get();
        const index = state.orderedKeys.indexOf(key);
        if (index <= 0) return null;
        return state.orderedKeys[index - 1] ?? null;
      },

      getKeyAfter: (key: Key) => {
        const state = get();
        const index = state.orderedKeys.indexOf(key);
        if (index === -1 || index >= state.orderedKeys.length - 1) return null;
        return state.orderedKeys[index + 1] ?? null;
      },

      getFirstKey: () => {
        const state = get();
        return state.orderedKeys[0] ?? null;
      },

      getLastKey: () => {
        const state = get();
        return state.orderedKeys[state.orderedKeys.length - 1] ?? null;
      },

      getKeys: () => {
        return get().orderedKeys;
      },

      // ============================================================
      // Selection Actions
      // ============================================================

      setSelectionMode: (mode: SelectionMode) => {
        set({ selectionMode: mode });
      },

      setSelectedKeys: (keys: Set<Key> | 'all') => {
        set({ selectedKeys: keys });
      },

      setFocusedKey: (
        key: Key | null,
        childFocusStrategy: FocusStrategy = 'first',
      ) => {
        set({ focusedKey: key, childFocusStrategy });
      },

      setFocused: (isFocused: boolean) => {
        set({ isFocused });
      },

      setDisabledKeys: (keys: Set<Key>) => {
        set({ disabledKeys: keys });
      },

      setSelectionBehavior: (behavior: SelectionBehavior) => {
        set({ selectionBehavior: behavior });
      },

      setDisallowEmptySelection: (disallow: boolean) => {
        set({ disallowEmptySelection: disallow });
      },

      updateSelectionState: (updates: Partial<SelectionState>) => {
        set(updates);
      },
    })),
  );
};

/**
 * Type for the store instance returned by createCollectionStore.
 */
export type CollectionStoreApi<T> = ReturnType<typeof createCollectionStore<T>>;

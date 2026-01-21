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
import createCollectionSorter from './sorting/createCollectionSorter';
import {
  defaultSortState,
  type SortDirection,
  type SortProperty,
  type SortRule,
  type SortState,
  type SortType,
} from './sorting/types';
import {
  type CollectionState,
  type CollectionStore,
  type Key,
  type KeyExtractor,
  type Node,
  type TextValueExtractor,
} from './types';

/**
 * Combined state including collection, selection, and sort.
 */
type FullCollectionState<T> = CollectionState<T> & SelectionState & SortState;

/**
 * Combined store type including collection, selection, and sort actions.
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

  // Sort state (already in SortState)
  sortProperty: SortProperty | null;
  sortDirection: SortDirection;
  sortType: SortType;
  sortRules: SortRule[];

  // Sort actions
  setSortProperty: (property: SortProperty | null) => void;
  setSortDirection: (direction: SortDirection) => void;
  setSortType: (type: SortType) => void;
  setSortRules: (rules: SortRule[]) => void;
  updateSortState: (updates: Partial<SortState>) => void;

  // Internal state for re-sorting (not part of public API)
  _originalItems: T[];
  _keyExtractor: KeyExtractor<T> | null;
  _textValueExtractor: TextValueExtractor<T> | undefined;

  // Re-sort items using current sort rules
  resortItems: () => void;
};

/**
 * Internal state for re-sorting
 */
type InternalSortState<T> = {
  _originalItems: T[];
  _keyExtractor: KeyExtractor<T> | null;
  _textValueExtractor: TextValueExtractor<T> | undefined;
};

/**
 * Full collection state including internal sort state
 */
type FullCollectionStateWithInternal<T> = FullCollectionState<T> &
  InternalSortState<T>;

/**
 * Default initial state for the collection store.
 */
const defaultInitState = <T>(): FullCollectionStateWithInternal<T> => ({
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
  // Sort state
  ...defaultSortState,
  // Internal state for re-sorting
  _originalItems: [],
  _keyExtractor: null,
  _textValueExtractor: undefined,
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
  initState: FullCollectionStateWithInternal<T> = defaultInitState<T>(),
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
        const state = get();

        // Store original items and extractors for re-sorting
        const originalItems = items;
        const storedKeyExtractor = keyExtractor;
        const storedTextValueExtractor = textValueExtractor;

        // Apply sorting if sort rules exist
        let sortedItems = items;
        if (state.sortRules.length > 0) {
          const sorter = createCollectionSorter<T & Record<string, unknown>>(
            state.sortRules,
          );
          sortedItems = sorter(items as (T & Record<string, unknown>)[]) as T[];
        }

        const { itemsMap, orderedKeys } = buildNodes(
          sortedItems,
          keyExtractor,
          textValueExtractor,
        );

        // Clean up selection state for removed items
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
          // Store for re-sorting
          _originalItems: originalItems,
          _keyExtractor: storedKeyExtractor,
          _textValueExtractor: storedTextValueExtractor,
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

      // ============================================================
      // Sort Actions
      // ============================================================

      setSortProperty: (property: SortProperty | null) => {
        set({ sortProperty: property });
      },

      setSortDirection: (direction: SortDirection) => {
        set({ sortDirection: direction });
      },

      setSortType: (type: SortType) => {
        set({ sortType: type });
      },

      setSortRules: (rules: SortRule[]) => {
        set({ sortRules: rules });
      },

      updateSortState: (updates: Partial<SortState>) => {
        set(updates);
      },

      resortItems: () => {
        const state = get();
        const {
          _originalItems,
          _keyExtractor,
          _textValueExtractor,
          sortRules,
        } = state;

        // Can't re-sort if we don't have the original data
        if (!_keyExtractor || _originalItems.length === 0) {
          return;
        }

        // Apply sorting
        let sortedItems = _originalItems;
        if (sortRules.length > 0) {
          const sorter = createCollectionSorter<T & Record<string, unknown>>(
            sortRules,
          );
          sortedItems = sorter(
            _originalItems as (T & Record<string, unknown>)[],
          ) as T[];
        }

        const { itemsMap, orderedKeys } = buildNodes(
          sortedItems,
          _keyExtractor,
          _textValueExtractor,
        );

        set({
          items: itemsMap,
          orderedKeys,
        });
      },
    })),
  );
};

/**
 * Type for the store instance returned by createCollectionStore.
 */
export type CollectionStoreApi<T> = ReturnType<typeof createCollectionStore<T>>;

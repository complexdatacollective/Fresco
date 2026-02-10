import { subscribeWithSelector } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { defaultFilterState, type FilterState } from './filtering/types';
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
 * Combined state including collection, selection, sort, and filter.
 */
type FullCollectionState<T> = CollectionState<T> &
  SelectionState &
  SortState &
  FilterState;

/**
 * Combined store type including collection, selection, sort, and filter actions.
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

  // Filter state (already in FilterState)
  filterQuery: string;
  filterDebouncedQuery: string;
  filterIsFiltering: boolean;
  filterIsIndexing: boolean;
  filterMatchCount: number | null;
  filterMatchingKeys: Set<Key> | null;

  // Filter actions
  updateFilterState: (updates: Partial<FilterState>) => void;

  // Internal state for re-sorting (not part of public API)
  _originalItems: T[];
  _keyExtractor: KeyExtractor<T> | null;
  _textValueExtractor: TextValueExtractor<T> | undefined;

  // Re-sort and filter items using current rules
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
  // Filter state
  ...defaultFilterState,
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

        // First, apply filter if active
        let itemsToProcess = items;
        if (state.filterMatchingKeys !== null) {
          itemsToProcess = items.filter((item) =>
            state.filterMatchingKeys!.has(keyExtractor(item)),
          );
        }

        // Then apply sorting if sort rules exist
        let sortedItems = itemsToProcess;
        if (state.sortRules.length > 0) {
          const sorter = createCollectionSorter<T & Record<string, unknown>>(
            state.sortRules,
          );
          sortedItems = sorter(
            itemsToProcess as (T & Record<string, unknown>)[],
          ) as T[];
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
          size: sortedItems.length,
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

      // ============================================================
      // Filter Actions
      // ============================================================

      updateFilterState: (updates: Partial<FilterState>) => {
        set(updates);
      },

      // ============================================================
      // Combined Re-sort/Re-filter
      // ============================================================

      resortItems: () => {
        const state = get();
        const {
          _originalItems,
          _keyExtractor,
          _textValueExtractor,
          sortRules,
          filterMatchingKeys,
        } = state;

        // Can't re-sort if we don't have the original data
        if (!_keyExtractor || _originalItems.length === 0) {
          return;
        }

        // First, filter items if a filter is active
        let itemsToProcess = _originalItems;
        if (filterMatchingKeys !== null) {
          itemsToProcess = _originalItems.filter((item) =>
            filterMatchingKeys.has(_keyExtractor(item)),
          );
        }

        // Then apply sorting
        let sortedItems = itemsToProcess;
        if (sortRules.length > 0) {
          const sorter = createCollectionSorter<T & Record<string, unknown>>(
            sortRules,
          );
          sortedItems = sorter(
            itemsToProcess as (T & Record<string, unknown>)[],
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
          size: sortedItems.length,
        });
      },
    })),
  );
};

/**
 * Type for the store instance returned by createCollectionStore.
 */
export type CollectionStoreApi<T> = ReturnType<typeof createCollectionStore<T>>;

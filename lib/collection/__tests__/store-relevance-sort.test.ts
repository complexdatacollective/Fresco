import { describe, expect, it } from 'vitest';
import { type SortRule } from '../sorting/types';
import { createCollectionStore } from '../store';
import { type Key } from '../types';

type TestItem = Record<string, unknown> & {
  id: string;
  name: string;
};

const keyExtractor = (item: TestItem): Key => item.id;

const items: TestItem[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' },
  { id: '4', name: 'Dave' },
  { id: '5', name: 'Eve' },
];

function getOrderedIds(
  store: ReturnType<typeof createCollectionStore<TestItem>>,
) {
  return store.getState().orderedKeys;
}

describe('store relevance-based sorting', () => {
  describe('filterScores integration', () => {
    it('should sort filtered items by relevance score (lower = better match)', () => {
      const store = createCollectionStore<TestItem>();
      store.getState().setItems(items, keyExtractor);

      // Simulate a search that matched items 1, 3, 5 with varying relevance
      const matchingKeys = new Set<Key>(['1', '3', '5']);
      const filterScores = new Map<Key, number>([
        ['3', 0.1], // best match
        ['5', 0.3],
        ['1', 0.7], // worst match
      ]);

      store.getState().updateFilterState({
        filterMatchingKeys: matchingKeys,
        filterMatchCount: 3,
        filterScores,
        filterDebouncedQuery: 'test',
      });
      store.getState().resortItems();

      // Items should be sorted by relevance: best (0.1) → worst (0.7)
      expect(getOrderedIds(store)).toEqual(['3', '5', '1']);
    });

    it('should use user sort rules as tiebreakers for equal relevance', () => {
      const store = createCollectionStore<TestItem>();

      const sortRules: SortRule[] = [
        { property: 'name', direction: 'asc', type: 'string' },
      ];
      store.getState().updateSortState({ sortRules });
      store.getState().setItems(items, keyExtractor);

      // Items 1 (Alice) and 2 (Bob) have same relevance score
      const matchingKeys = new Set<Key>(['1', '2', '3']);
      const filterScores = new Map<Key, number>([
        ['1', 0.5],
        ['2', 0.5],
        ['3', 0.1],
      ]);

      store.getState().updateFilterState({
        filterMatchingKeys: matchingKeys,
        filterMatchCount: 3,
        filterScores,
        filterDebouncedQuery: 'test',
      });
      store.getState().resortItems();

      // Charlie (0.1) first, then Alice/Bob tied at 0.5 → name asc → Alice, Bob
      expect(getOrderedIds(store)).toEqual(['3', '1', '2']);
    });

    it('should revert to user sort order when filter is cleared', () => {
      const store = createCollectionStore<TestItem>();

      const sortRules: SortRule[] = [
        { property: 'name', direction: 'asc', type: 'string' },
      ];
      store.getState().updateSortState({ sortRules });
      store.getState().setItems(items, keyExtractor);

      // Apply filter with scores
      store.getState().updateFilterState({
        filterMatchingKeys: new Set<Key>(['1', '2', '3']),
        filterMatchCount: 3,
        filterScores: new Map<Key, number>([
          ['2', 0.1],
          ['3', 0.3],
          ['1', 0.5],
        ]),
        filterDebouncedQuery: 'test',
      });
      store.getState().resortItems();
      expect(getOrderedIds(store)).toEqual(['2', '3', '1']);

      // Clear filter
      store.getState().updateFilterState({
        filterMatchingKeys: null,
        filterMatchCount: null,
        filterScores: null,
        filterDebouncedQuery: '',
      });
      store.getState().resortItems();

      // All items, sorted by name asc
      expect(getOrderedIds(store)).toEqual(['1', '2', '3', '4', '5']);
    });

    it('should apply relevance sort in setItems when filterScores exist', () => {
      const store = createCollectionStore<TestItem>();

      // Set filter state before items (simulating filter already active)
      store.getState().updateFilterState({
        filterMatchingKeys: new Set<Key>(['2', '4']),
        filterMatchCount: 2,
        filterScores: new Map<Key, number>([
          ['4', 0.2],
          ['2', 0.8],
        ]),
        filterDebouncedQuery: 'test',
      });

      // Now set items — should filter and sort by relevance
      store.getState().setItems(items, keyExtractor);

      expect(getOrderedIds(store)).toEqual(['4', '2']);
    });

    it('should not sort by relevance when filterScores is null', () => {
      const store = createCollectionStore<TestItem>();

      // Filter active but no scores (e.g. from a non-fuzzy filter)
      store.getState().updateFilterState({
        filterMatchingKeys: new Set<Key>(['3', '1', '5']),
        filterMatchCount: 3,
        filterScores: null,
        filterDebouncedQuery: 'test',
      });
      store.getState().setItems(items, keyExtractor);

      // Items should retain original order (filtered but not relevance-sorted)
      expect(getOrderedIds(store)).toEqual(['1', '3', '5']);
    });

    it('should handle items with missing scores by placing them last', () => {
      const store = createCollectionStore<TestItem>();

      // Score only for item 3; items 1 and 5 have no score (default to 1)
      const matchingKeys = new Set<Key>(['1', '3', '5']);
      const filterScores = new Map<Key, number>([['3', 0.2]]);

      store.getState().updateFilterState({
        filterMatchingKeys: matchingKeys,
        filterMatchCount: 3,
        filterScores,
        filterDebouncedQuery: 'test',
      });
      store.getState().setItems(items, keyExtractor);

      // Item 3 (score 0.2) first, then 1 and 5 (score 1.0, maintain order)
      expect(getOrderedIds(store)[0]).toBe('3');
      // Items 1 and 5 both default to score 1, so they maintain relative order
      expect(getOrderedIds(store).slice(1)).toEqual(['1', '5']);
    });

    it('should combine relevance with multi-field user sort rules', () => {
      type ExtendedItem = TestItem & { priority: number };
      const extendedItems: ExtendedItem[] = [
        { id: '1', name: 'Alice', priority: 2 },
        { id: '2', name: 'Bob', priority: 1 },
        { id: '3', name: 'Alice', priority: 1 },
        { id: '4', name: 'Bob', priority: 2 },
      ];
      const extKeyExtractor = (item: ExtendedItem): Key => item.id;

      const store = createCollectionStore<ExtendedItem>();
      const sortRules: SortRule[] = [
        { property: 'name', direction: 'asc', type: 'string' },
        { property: 'priority', direction: 'asc', type: 'number' },
      ];
      store.getState().updateSortState({ sortRules });

      // All items match, two relevance groups
      store.getState().updateFilterState({
        filterMatchingKeys: new Set<Key>(['1', '2', '3', '4']),
        filterMatchCount: 4,
        filterScores: new Map<Key, number>([
          ['1', 0.3],
          ['3', 0.3],
          ['2', 0.7],
          ['4', 0.7],
        ]),
        filterDebouncedQuery: 'test',
      });
      store.getState().setItems(extendedItems, extKeyExtractor);

      // Group 0.3: items 1,3 → name asc (Alice, Alice) → priority asc → 3(p1), 1(p2)
      // Group 0.7: items 2,4 → name asc (Bob, Bob) → priority asc → 2(p1), 4(p2)
      expect(getOrderedIds(store)).toEqual(['3', '1', '2', '4']);
    });
  });
});

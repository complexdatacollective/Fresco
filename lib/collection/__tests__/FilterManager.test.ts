import { describe, expect, it, vi } from 'vitest';
import { FilterManager } from '../filtering/FilterManager';
import { type FilterState } from '../filtering/types';

function createDefaultState(overrides: Partial<FilterState> = {}): FilterState {
  return {
    filterQuery: '',
    filterDebouncedQuery: '',
    filterIsFiltering: false,
    filterIsIndexing: false,
    filterMatchCount: null,
    filterMatchingKeys: null,
    filterScores: null,
    ...overrides,
  };
}

describe('FilterManager', () => {
  describe('queries', () => {
    describe('query', () => {
      it('should return the current query', () => {
        const state = createDefaultState({ filterQuery: 'test' });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.query).toBe('test');
      });

      it('should return empty string when no query', () => {
        const state = createDefaultState();
        const manager = new FilterManager(state, vi.fn());

        expect(manager.query).toBe('');
      });
    });

    describe('debouncedQuery', () => {
      it('should return the debounced query', () => {
        const state = createDefaultState({ filterDebouncedQuery: 'debounced' });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.debouncedQuery).toBe('debounced');
      });
    });

    describe('isFiltering', () => {
      it('should return true when filtering is in progress', () => {
        const state = createDefaultState({ filterIsFiltering: true });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.isFiltering).toBe(true);
      });

      it('should return false when not filtering', () => {
        const state = createDefaultState({ filterIsFiltering: false });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.isFiltering).toBe(false);
      });
    });

    describe('isIndexing', () => {
      it('should return true when indexing is in progress', () => {
        const state = createDefaultState({ filterIsIndexing: true });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.isIndexing).toBe(true);
      });

      it('should return false when not indexing', () => {
        const state = createDefaultState({ filterIsIndexing: false });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.isIndexing).toBe(false);
      });
    });

    describe('hasActiveFilter', () => {
      it('should return true when filter is active with results', () => {
        const state = createDefaultState({
          filterDebouncedQuery: 'test',
          filterMatchingKeys: new Set(['a', 'b']),
        });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.hasActiveFilter).toBe(true);
      });

      it('should return false when query is empty', () => {
        const state = createDefaultState({
          filterDebouncedQuery: '',
          filterMatchingKeys: new Set(['a', 'b']),
        });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.hasActiveFilter).toBe(false);
      });

      it('should return false when matching keys is null', () => {
        const state = createDefaultState({
          filterDebouncedQuery: 'test',
          filterMatchingKeys: null,
        });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.hasActiveFilter).toBe(false);
      });
    });

    describe('matchCount', () => {
      it('should return the match count', () => {
        const state = createDefaultState({ filterMatchCount: 5 });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.matchCount).toBe(5);
      });

      it('should return null when no filter active', () => {
        const state = createDefaultState({ filterMatchCount: null });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.matchCount).toBeNull();
      });
    });

    describe('matchingKeys', () => {
      it('should return the set of matching keys', () => {
        const keys = new Set(['a', 'b', 'c']);
        const state = createDefaultState({ filterMatchingKeys: keys });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.matchingKeys).toBe(keys);
      });

      it('should return null when no filter active', () => {
        const state = createDefaultState({ filterMatchingKeys: null });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.matchingKeys).toBeNull();
      });
    });

    describe('isMatch', () => {
      it('should return true for matching keys', () => {
        const state = createDefaultState({
          filterMatchingKeys: new Set(['a', 'b']),
        });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.isMatch('a')).toBe(true);
        expect(manager.isMatch('b')).toBe(true);
      });

      it('should return false for non-matching keys', () => {
        const state = createDefaultState({
          filterMatchingKeys: new Set(['a', 'b']),
        });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.isMatch('c')).toBe(false);
      });

      it('should return true for all keys when no filter active', () => {
        const state = createDefaultState({ filterMatchingKeys: null });
        const manager = new FilterManager(state, vi.fn());

        expect(manager.isMatch('a')).toBe(true);
        expect(manager.isMatch('anything')).toBe(true);
      });
    });
  });

  describe('mutations', () => {
    describe('setQuery', () => {
      it('should update query via setState', () => {
        const setState = vi.fn();
        const state = createDefaultState();
        const manager = new FilterManager(state, setState);

        manager.setQuery('new query');

        expect(setState).toHaveBeenCalledWith({ filterQuery: 'new query' });
      });

      it('should call onFilterChange callback', () => {
        const onFilterChange = vi.fn();
        const state = createDefaultState();
        const manager = new FilterManager(state, vi.fn(), { onFilterChange });

        manager.setQuery('test');

        expect(onFilterChange).toHaveBeenCalledWith('test');
      });
    });

    describe('clearFilter', () => {
      it('should clear all filter state', () => {
        const setState = vi.fn();
        const state = createDefaultState({
          filterQuery: 'some query',
          filterDebouncedQuery: 'some query',
          filterMatchCount: 5,
          filterMatchingKeys: new Set(['a']),
        });
        const manager = new FilterManager(state, setState);

        manager.clearFilter();

        expect(setState).toHaveBeenCalledWith({
          filterQuery: '',
          filterDebouncedQuery: '',
          filterMatchCount: null,
          filterMatchingKeys: null,
          filterScores: null,
        });
      });

      it('should call onFilterChange with empty string', () => {
        const onFilterChange = vi.fn();
        const state = createDefaultState({ filterQuery: 'test' });
        const manager = new FilterManager(state, vi.fn(), { onFilterChange });

        manager.clearFilter();

        expect(onFilterChange).toHaveBeenCalledWith('');
      });
    });
  });
});

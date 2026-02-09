import { type Key } from '../types';
import { type FilterState } from './types';

/**
 * Options for creating a FilterManager.
 */
export type FilterManagerOptions = {
  /** Callback when filter query changes */
  onFilterChange?: (query: string) => void;
  /** Callback when filter results change */
  onFilterResultsChange?: (matchingKeys: Set<Key>, matchCount: number) => void;
};

/**
 * FilterManager provides a rich API for managing filter state.
 * It wraps the raw filter state and provides convenient methods
 * for common filtering operations.
 *
 * Follows the same pattern as SortManager.
 */
export class FilterManager {
  private state: FilterState;
  private setState: (updates: Partial<FilterState>) => void;
  private options: FilterManagerOptions;

  constructor(
    state: FilterState,
    setState: (updates: Partial<FilterState>) => void,
    options: FilterManagerOptions = {},
  ) {
    this.state = state;
    this.setState = setState;
    this.options = options;
  }

  // ============================================================
  // Queries
  // ============================================================

  /** Get the current search query (immediate, from input) */
  get query(): string {
    return this.state.filterQuery;
  }

  /** Get the debounced query (used for actual filtering) */
  get debouncedQuery(): string {
    return this.state.filterDebouncedQuery;
  }

  /** Check if worker is processing a search */
  get isFiltering(): boolean {
    return this.state.filterIsFiltering;
  }

  /** Check if worker is building the fuse index */
  get isIndexing(): boolean {
    return this.state.filterIsIndexing;
  }

  /** Check if a filter is currently active */
  get hasActiveFilter(): boolean {
    return (
      this.state.filterDebouncedQuery.length > 0 &&
      this.state.filterMatchingKeys !== null
    );
  }

  /** Get the number of matching items (null if no filter active) */
  get matchCount(): number | null {
    return this.state.filterMatchCount;
  }

  /** Get the set of matching keys (null if no filter active) */
  get matchingKeys(): Set<Key> | null {
    return this.state.filterMatchingKeys;
  }

  /**
   * Check if a specific key matches the current filter.
   * Returns true if no filter is active.
   */
  isMatch(key: Key): boolean {
    if (this.state.filterMatchingKeys === null) {
      return true; // No filter = all match
    }
    return this.state.filterMatchingKeys.has(key);
  }

  // ============================================================
  // Mutations
  // ============================================================

  /**
   * Set the search query.
   * This triggers debounced filtering.
   *
   * @param query - The search query string
   */
  setQuery(query: string): void {
    this.setState({ filterQuery: query });
    this.options.onFilterChange?.(query);
  }

  /**
   * Clear the filter and show all items.
   */
  clearFilter(): void {
    this.setState({
      filterQuery: '',
      filterDebouncedQuery: '',
      filterMatchCount: null,
      filterMatchingKeys: null,
    });
    this.options.onFilterChange?.('');
  }
}

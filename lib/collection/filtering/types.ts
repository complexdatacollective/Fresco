/**
 * Filter-related types for the Collection component system.
 */

import { type Key } from '../types';

/**
 * Property to filter/search by.
 * - string: Direct property name (e.g., 'name')
 * - string[]: Nested property path for fuse.js (e.g., ['profile', 'displayName'])
 */
export type FilterProperty = string | string[];

/**
 * Fuse.js configuration options.
 * See https://fusejs.io/api/options.html
 */
export type FuseOptions = {
  /** Match threshold (0.0 = exact, 1.0 = match anything). Default: 0.4 */
  threshold?: number;
  /** Max distance for fuzzy match. Default: 100 */
  distance?: number;
  /** Ignore where in string match occurs. Default: true */
  ignoreLocation?: boolean;
  /** Minimum number of characters required to match. Default: 1 */
  minMatchCharLength?: number;
  /** Enable extended search with special operators. Default: false */
  useExtendedSearch?: boolean;
  /** Find all matches (not just best). Default: true */
  findAllMatches?: boolean;
};

/**
 * Filter state managed by the store.
 */
export type FilterState = {
  /** Current search query (immediate, from input) */
  filterQuery: string;
  /** Debounced query (used for actual filtering) */
  filterDebouncedQuery: string;
  /** True while worker is processing search */
  filterIsFiltering: boolean;
  /** True while worker is building fuse index */
  filterIsIndexing: boolean;
  /** Number of matching items (null if no filter active) */
  filterMatchCount: number | null;
  /** Set of matching item keys (null if no filter active = show all) */
  filterMatchingKeys: Set<Key> | null;
  /** Relevance scores from fuzzy search (null if no filter active) */
  filterScores: Map<Key, number> | null;
};

/**
 * Props for configuring filter behavior on the Collection component.
 */
export type FilterProps = {
  /** Controlled: Current filter query */
  filterQuery?: string;
  /** Default filter query (uncontrolled) */
  defaultFilterQuery?: string;
  /** Callback when filter query changes */
  onFilterChange?: (query: string) => void;
  /** Callback when filter results change */
  onFilterResultsChange?: (matchingKeys: Set<Key>, matchCount: number) => void;
  /** Properties to search (required if filtering) */
  filterKeys?: FilterProperty[];
  /** Fuse.js configuration for fuzzy matching */
  filterFuseOptions?: FuseOptions;
  /** Debounce delay in milliseconds. Default: 300 */
  filterDebounceMs?: number;
  /** Minimum query length before filtering. Default: 1 */
  filterMinQueryLength?: number;
};

/**
 * Result from the worker's search operation.
 * Uses arrays instead of Maps/Sets for structured clone transfer.
 */
export type WorkerSearchResult = {
  matchingKeys: string[];
  matchCount: number;
  scores: [string, number][];
};

/**
 * Default filter state values.
 */
export const defaultFilterState: FilterState = {
  filterQuery: '',
  filterDebouncedQuery: '',
  filterIsFiltering: false,
  filterIsIndexing: false,
  filterMatchCount: null,
  filterMatchingKeys: null,
  filterScores: null,
};

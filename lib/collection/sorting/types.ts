/**
 * Sort-related types for the Collection component system.
 */

/**
 * Property to sort by.
 * - string: Direct property name (e.g., 'name'), or '*' for array order
 * - string[]: Nested property path (e.g., ['profile', 'displayName'])
 *
 * Use '*' as the property to sort by array order (FIFO/LIFO based on
 * original item positions).
 */
export type SortProperty = string | string[];

/**
 * Sort direction.
 * - 'asc': Ascending (A-Z, 0-9, oldest first)
 * - 'desc': Descending (Z-A, 9-0, newest first)
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Type of value being sorted, determines comparison logic.
 * - 'string': Locale-aware string comparison
 * - 'number': Numeric comparison
 * - 'date': Date parsing and comparison
 * - 'boolean': Boolean comparison (false < true)
 */
export type SortType = 'string' | 'number' | 'date' | 'boolean';

/**
 * A single sort rule defining how to sort items.
 */
export type SortRule = {
  /** Property to sort by */
  property: SortProperty;
  /** Sort direction (default: 'asc') */
  direction?: SortDirection;
  /** Type of comparison to use */
  type: SortType;
};

/**
 * Sort state managed by the store.
 */
export type SortState = {
  /** Currently active sort property (null if no sorting) */
  sortProperty: SortProperty | null;
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Type of the current sort */
  sortType: SortType;
  /** Advanced: Multiple sort rules for chained sorting */
  sortRules: SortRule[];
};

/**
 * Describes a sortable property for UI components.
 */
export type SortableProperty = {
  /** Property path to sort by */
  property: SortProperty;
  /** Display label for the UI */
  label: string;
  /** Type of comparison to use */
  type: SortType;
};

/**
 * Props for configuring sort behavior on the Collection component.
 */
export type SortProps = {
  /** Controlled: Current sort property */
  sortBy?: SortProperty;
  /** Controlled: Current sort direction */
  sortDirection?: SortDirection;
  /** Controlled: Current sort type */
  sortType?: SortType;
  /** Default sort property (uncontrolled) */
  defaultSortBy?: SortProperty;
  /** Default sort direction (uncontrolled) */
  defaultSortDirection?: SortDirection;
  /** Default sort type (uncontrolled) */
  defaultSortType?: SortType;
  /** Callback when sort changes */
  onSortChange?: (state: {
    property: SortProperty | null;
    direction: SortDirection;
    type: SortType;
  }) => void;
  /** Advanced: Sort rules for multi-field sorting */
  sortRules?: SortRule[];
};

/**
 * Default sort state values.
 */
export const defaultSortState: SortState = {
  sortProperty: null,
  sortDirection: 'asc',
  sortType: 'string',
  sortRules: [],
};

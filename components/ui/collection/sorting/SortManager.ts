import {
  type SortDirection,
  type SortProperty,
  type SortRule,
  type SortState,
  type SortType,
} from './types';

/**
 * Options for creating a SortManager.
 */
type SortManagerOptions = {
  /** Callback when sort changes */
  onSortChange?: (state: {
    property: SortProperty | null;
    direction: SortDirection;
    type: SortType;
  }) => void;
};

/**
 * SortManager provides a rich API for managing sort state.
 * It wraps the raw sort state and provides convenient methods
 * for common sorting operations.
 *
 * Follows the same pattern as SelectionManager.
 */
export class SortManager {
  private state: SortState;
  private setState: (updates: Partial<SortState>) => void;
  private options: SortManagerOptions;

  constructor(
    state: SortState,
    setState: (updates: Partial<SortState>) => void,
    options: SortManagerOptions = {},
  ) {
    this.state = state;
    this.setState = setState;
    this.options = options;
  }

  // ============================================================
  // Queries
  // ============================================================

  /** Get the currently active sort property */
  get sortProperty(): SortProperty | null {
    return this.state.sortProperty;
  }

  /** Get the current sort direction */
  get sortDirection(): SortDirection {
    return this.state.sortDirection;
  }

  /** Get the current sort type */
  get sortType(): SortType {
    return this.state.sortType;
  }

  /** Get the current sort rules (for multi-field sorting) */
  get sortRules(): SortRule[] {
    return this.state.sortRules;
  }

  /** Check if sorting is currently active */
  get isSorted(): boolean {
    return this.state.sortProperty !== null || this.state.sortRules.length > 0;
  }

  /**
   * Check if currently sorted by a specific property.
   * Compares property values - arrays are compared by value.
   */
  isSortedBy(property: SortProperty): boolean {
    const current = this.state.sortProperty;
    if (current === null) return false;

    if (Array.isArray(property) && Array.isArray(current)) {
      return (
        property.length === current.length &&
        property.every((p, i) => p === current[i])
      );
    }

    return current === property;
  }

  /**
   * Get the sort direction for a specific property.
   * Returns null if not sorted by that property.
   */
  getDirectionFor(property: SortProperty): SortDirection | null {
    if (!this.isSortedBy(property)) {
      return null;
    }
    return this.state.sortDirection;
  }

  // ============================================================
  // Mutations
  // ============================================================

  /**
   * Sort by a specific property.
   *
   * @param property - Property to sort by (string, array path, or '*' for array order)
   * @param type - Type of comparison to use
   * @param direction - Sort direction (defaults to 'asc', or toggles if already sorted by this property)
   *
   * @example
   * ```ts
   * sortManager.sortBy('name', 'string');
   * sortManager.sortBy(['profile', 'displayName'], 'string', 'desc');
   * sortManager.sortBy('*', 'number', 'desc'); // LIFO - newest first
   * ```
   */
  sortBy(
    property: SortProperty,
    type: SortType,
    direction?: SortDirection,
  ): void {
    // If already sorting by this property and no explicit direction given, toggle
    let newDirection: SortDirection;
    if (direction !== undefined) {
      newDirection = direction;
    } else if (this.isSortedBy(property)) {
      newDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      newDirection = 'asc';
    }

    const updates: Partial<SortState> = {
      sortProperty: property,
      sortDirection: newDirection,
      sortType: type,
      // Clear multi-field rules when using single-field sorting
      sortRules: [{ property, direction: newDirection, type }],
    };

    this.setState(updates);
    this.options.onSortChange?.({
      property,
      direction: newDirection,
      type,
    });
  }

  /**
   * Toggle the current sort direction.
   * Only works if currently sorting.
   */
  toggleSortDirection(): void {
    if (!this.isSorted) return;

    const newDirection: SortDirection =
      this.state.sortDirection === 'asc' ? 'desc' : 'asc';

    // Update both single property and rules
    const newRules: SortRule[] = this.state.sortRules.map((rule, index) =>
      index === 0 ? { ...rule, direction: newDirection } : rule,
    );

    const updates: Partial<SortState> = {
      sortDirection: newDirection,
      sortRules: newRules,
    };

    this.setState(updates);
    this.options.onSortChange?.({
      property: this.state.sortProperty,
      direction: newDirection,
      type: this.state.sortType,
    });
  }

  /**
   * Clear sorting and return to original order.
   */
  clearSort(): void {
    const updates: Partial<SortState> = {
      sortProperty: null,
      sortDirection: 'asc',
      sortType: 'string',
      sortRules: [],
    };

    this.setState(updates);
    this.options.onSortChange?.({
      property: null,
      direction: 'asc',
      type: 'string',
    });
  }

  /**
   * Set multiple sort rules for advanced multi-field sorting.
   * Rules are applied in order (first rule is primary, second is tiebreaker, etc.)
   *
   * @example
   * ```ts
   * sortManager.setSortRules([
   *   { property: 'lastName', type: 'string', direction: 'asc' },
   *   { property: 'firstName', type: 'string', direction: 'asc' },
   * ]);
   * ```
   */
  setSortRules(rules: SortRule[]): void {
    // Update single-field state from first rule
    const firstRule = rules[0];
    const updates: Partial<SortState> = {
      sortRules: rules,
      sortProperty: firstRule?.property ?? null,
      sortDirection: firstRule?.direction ?? 'asc',
      sortType: firstRule?.type ?? 'string',
    };

    this.setState(updates);
    this.options.onSortChange?.({
      property: updates.sortProperty!,
      direction: updates.sortDirection!,
      type: updates.sortType!,
    });
  }
}

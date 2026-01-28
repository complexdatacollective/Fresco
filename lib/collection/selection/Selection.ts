import { type Key } from '../types';

/**
 * Selection class that extends Set with anchor and current key tracking.
 * Used for range selection (shift+click) operations.
 *
 * - anchorKey: The starting point of a range selection (first shift+click)
 * - currentKey: The current end of the range (most recent shift+click)
 *
 * These are used to calculate which items should be selected when
 * the user shift+clicks to extend the selection.
 */
export class Selection extends Set<Key> {
  /** Starting point for shift+click range selection */
  anchorKey: Key | null;
  /** Current end point for shift+click range selection */
  currentKey: Key | null;

  constructor(
    keys?: Iterable<Key> | Selection,
    anchorKey?: Key | null,
    currentKey?: Key | null,
  ) {
    super(keys);

    if (keys instanceof Selection) {
      // Copy anchor and current from source Selection
      this.anchorKey = anchorKey ?? keys.anchorKey;
      this.currentKey = currentKey ?? keys.currentKey;
    } else {
      this.anchorKey = anchorKey ?? null;
      this.currentKey = currentKey ?? null;
    }
  }

  /**
   * Create a new Selection with the same contents and range keys.
   */
  clone(): Selection {
    return new Selection(this, this.anchorKey, this.currentKey);
  }

  /**
   * Create a new Selection with updated anchor and current keys.
   */
  withRange(anchorKey: Key | null, currentKey: Key | null): Selection {
    return new Selection(this, anchorKey, currentKey);
  }

  /**
   * Add a key and update the range tracking.
   * Returns a new Selection (immutable pattern).
   */
  addKey(key: Key): Selection {
    const next = this.clone();
    next.add(key);
    next.anchorKey = key;
    next.currentKey = key;
    return next;
  }

  /**
   * Remove a key.
   * Returns a new Selection (immutable pattern).
   */
  deleteKey(key: Key): Selection {
    const next = this.clone();
    next.delete(key);
    return next;
  }

  /**
   * Toggle a key's selection state.
   * Returns a new Selection (immutable pattern).
   */
  toggleKey(key: Key): Selection {
    if (this.has(key)) {
      return this.deleteKey(key);
    } else {
      return this.addKey(key);
    }
  }

  /**
   * Replace the entire selection with a single key.
   * Returns a new Selection (immutable pattern).
   */
  replaceWith(key: Key): Selection {
    return new Selection([key], key, key);
  }

  /**
   * Clear all selections.
   * Returns a new Selection (immutable pattern).
   */
  clearAll(): Selection {
    return new Selection();
  }
}

/**
 * Create a Selection from an iterable of keys.
 */
export function createSelection(keys?: Iterable<Key>): Selection {
  return new Selection(keys);
}

/**
 * Convert a Selection to a plain Set<Key>.
 * Useful for external APIs that don't need range tracking.
 */
export function selectionToSet(selection: Selection | Set<Key>): Set<Key> {
  return new Set(selection);
}

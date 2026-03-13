import { type Key } from '../types';

/**
 * Keyboard delegate provides navigation methods for moving focus
 * within a collection. Different layout types (list, grid) implement
 * this interface differently.
 */
export type KeyboardDelegate = {
  /** Get the key of the item below the given key */
  getKeyBelow(key: Key): Key | null;

  /** Get the key of the item above the given key */
  getKeyAbove(key: Key): Key | null;

  /** Get the key of the item to the left (for grid layouts) */
  getKeyLeftOf?(key: Key): Key | null;

  /** Get the key of the item to the right (for grid layouts) */
  getKeyRightOf?(key: Key): Key | null;

  /** Get the first key in the collection */
  getFirstKey(): Key | null;

  /** Get the last key in the collection */
  getLastKey(): Key | null;

  /** Get the key one page above (optional for pagination) */
  getKeyPageAbove?(key: Key): Key | null;

  /** Get the key one page below (optional for pagination) */
  getKeyPageBelow?(key: Key): Key | null;

  /** Search for a key by text value (type-ahead) */
  getKeyForSearch?(search: string, fromKey?: Key): Key | null;
};

import { type Collection, type Key } from '../types';
import { type KeyboardDelegate } from './types';

/**
 * Keyboard delegate for list layouts.
 * Provides vertical navigation (up/down keys).
 */
export class ListKeyboardDelegate implements KeyboardDelegate {
  private collection: Collection<unknown>;
  private disabledKeys: Set<Key>;

  constructor(collection: Collection<unknown>, disabledKeys = new Set<Key>()) {
    this.collection = collection;
    this.disabledKeys = disabledKeys;
  }

  getKeyBelow(key: Key): Key | null {
    let nextKey = this.collection.getKeyAfter(key);
    while (nextKey !== null && this.disabledKeys.has(nextKey)) {
      nextKey = this.collection.getKeyAfter(nextKey);
    }
    return nextKey;
  }

  getKeyAbove(key: Key): Key | null {
    let prevKey = this.collection.getKeyBefore(key);
    while (prevKey !== null && this.disabledKeys.has(prevKey)) {
      prevKey = this.collection.getKeyBefore(prevKey);
    }
    return prevKey;
  }

  getFirstKey(): Key | null {
    let firstKey = this.collection.getFirstKey();
    while (firstKey !== null && this.disabledKeys.has(firstKey)) {
      firstKey = this.collection.getKeyAfter(firstKey);
    }
    return firstKey;
  }

  getLastKey(): Key | null {
    let lastKey = this.collection.getLastKey();
    while (lastKey !== null && this.disabledKeys.has(lastKey)) {
      lastKey = this.collection.getKeyBefore(lastKey);
    }
    return lastKey;
  }

  getKeyForSearch(search: string, fromKey?: Key): Key | null {
    const searchLower = search.toLowerCase();
    const keys = Array.from(this.collection.getKeys());

    // Start searching from the item after fromKey, or from the beginning
    let startIndex = 0;
    if (fromKey !== undefined) {
      const fromIndex = keys.indexOf(fromKey);
      if (fromIndex !== -1) {
        startIndex = fromIndex + 1;
      }
    }

    // Search from startIndex to end
    for (let i = startIndex; i < keys.length; i++) {
      const key = keys[i];
      if (key === undefined) continue;
      if (this.disabledKeys.has(key)) continue;

      const node = this.collection.getItem(key);
      const textValue = node?.textValue?.toLowerCase();

      if (textValue?.startsWith(searchLower)) {
        return key;
      }
    }

    // Wrap around and search from beginning to startIndex
    for (let i = 0; i < startIndex; i++) {
      const key = keys[i];
      if (key === undefined) continue;
      if (this.disabledKeys.has(key)) continue;

      const node = this.collection.getItem(key);
      const textValue = node?.textValue?.toLowerCase();

      if (textValue?.startsWith(searchLower)) {
        return key;
      }
    }

    return null;
  }
}

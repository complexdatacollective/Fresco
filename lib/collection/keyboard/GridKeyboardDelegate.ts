import { type Collection, type Key } from '../types';
import { type KeyboardDelegate } from './types';

/**
 * Keyboard delegate for grid layouts.
 * Provides 2D navigation using arrow keys:
 * - Up/Down: Move to same column in adjacent row
 * - Left/Right: Move to adjacent item in row
 */
export class GridKeyboardDelegate implements KeyboardDelegate {
  private collection: Collection<unknown>;
  private disabledKeys: Set<Key>;
  private columns: number;

  constructor(
    collection: Collection<unknown>,
    columns: number,
    disabledKeys = new Set<Key>(),
  ) {
    this.collection = collection;
    this.columns = Math.max(1, columns);
    this.disabledKeys = disabledKeys;
  }

  private getKeys(): Key[] {
    return Array.from(this.collection.getKeys());
  }

  private getIndex(key: Key): number {
    return this.getKeys().indexOf(key);
  }

  private getKeyAt(index: number): Key | null {
    const keys = this.getKeys();
    if (index < 0 || index >= keys.length) return null;
    return keys[index] ?? null;
  }

  private skipDisabled(
    startKey: Key | null,
    direction: 'forward' | 'backward',
  ): Key | null {
    if (startKey === null) return null;
    if (!this.disabledKeys.has(startKey)) return startKey;

    const keys = this.getKeys();
    let index = keys.indexOf(startKey);
    const delta = direction === 'forward' ? 1 : -1;

    while (index >= 0 && index < keys.length) {
      const key = keys[index];
      if (key && !this.disabledKeys.has(key)) {
        return key;
      }
      index += delta;
    }

    return null;
  }

  getKeyBelow(key: Key): Key | null {
    const currentIndex = this.getIndex(key);
    if (currentIndex === -1) return null;

    const keys = this.getKeys();
    const targetIndex = currentIndex + this.columns;

    if (targetIndex >= keys.length) return null;

    const targetKey = this.getKeyAt(targetIndex);
    return this.skipDisabled(targetKey, 'forward');
  }

  getKeyAbove(key: Key): Key | null {
    const currentIndex = this.getIndex(key);
    if (currentIndex === -1) return null;

    const targetIndex = currentIndex - this.columns;

    if (targetIndex < 0) return null;

    const targetKey = this.getKeyAt(targetIndex);
    return this.skipDisabled(targetKey, 'backward');
  }

  getKeyRightOf(key: Key): Key | null {
    const currentIndex = this.getIndex(key);
    if (currentIndex === -1) return null;

    const keys = this.getKeys();
    const targetIndex = currentIndex + 1;

    if (targetIndex >= keys.length) return null;

    const targetKey = this.getKeyAt(targetIndex);
    return this.skipDisabled(targetKey, 'forward');
  }

  getKeyLeftOf(key: Key): Key | null {
    const currentIndex = this.getIndex(key);
    if (currentIndex === -1) return null;

    const targetIndex = currentIndex - 1;

    if (targetIndex < 0) return null;

    const targetKey = this.getKeyAt(targetIndex);
    return this.skipDisabled(targetKey, 'backward');
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
    const keys = this.getKeys();

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

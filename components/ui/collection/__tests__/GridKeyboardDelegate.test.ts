import { describe, it, expect } from 'vitest';
import { GridKeyboardDelegate } from '../keyboard/GridKeyboardDelegate';
import { type Collection, type Key, type Node } from '../types';

function createMockCollection(items: Map<Key, string>): Collection<unknown> {
  const keys = Array.from(items.keys());

  return {
    size: items.size,
    getKeys: () => new Set(keys),
    getItem: (key: Key) => {
      const value = items.get(key);
      if (!value) return undefined;
      return {
        key,
        value,
        type: 'item',
        textValue: value,
        index: keys.indexOf(key),
        level: 0,
      } as Node<unknown>;
    },
    getKeyBefore: (key: Key) => {
      const index = keys.indexOf(key);
      return index > 0 ? (keys[index - 1] ?? null) : null;
    },
    getKeyAfter: (key: Key) => {
      const index = keys.indexOf(key);
      return index < keys.length - 1 ? (keys[index + 1] ?? null) : null;
    },
    getFirstKey: () => keys[0] ?? null,
    getLastKey: () => keys[keys.length - 1] ?? null,
    [Symbol.iterator]: function* () {
      for (const key of keys) {
        const node = this.getItem(key);
        if (node) yield node;
      }
    },
  };
}

/**
 * Creates a grid collection with numbered items.
 * For a 3-column grid with 8 items:
 *   1  2  3
 *   4  5  6
 *   7  8
 */
function createGridCollection(count: number): Collection<unknown> {
  const items = new Map<Key, string>();
  for (let i = 1; i <= count; i++) {
    items.set(String(i), `Item ${i}`);
  }
  return createMockCollection(items);
}

describe('GridKeyboardDelegate', () => {
  describe('getKeyBelow (vertical navigation)', () => {
    it('should navigate to same column in next row', () => {
      // 3 columns, 6 items:
      //   1  2  3
      //   4  5  6
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      // First row to second row
      expect(delegate.getKeyBelow('1')).toBe('4');
      expect(delegate.getKeyBelow('2')).toBe('5');
      expect(delegate.getKeyBelow('3')).toBe('6');
    });

    it('should return null when at bottom row', () => {
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyBelow('4')).toBe(null);
      expect(delegate.getKeyBelow('5')).toBe(null);
      expect(delegate.getKeyBelow('6')).toBe(null);
    });

    it('should handle incomplete last row', () => {
      // 3 columns, 8 items:
      //   1  2  3
      //   4  5  6
      //   7  8
      const collection = createGridCollection(8);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyBelow('4')).toBe('7');
      expect(delegate.getKeyBelow('5')).toBe('8');
      // Column 3 has no item in row 3
      expect(delegate.getKeyBelow('6')).toBe(null);
    });

    it('should work with different column counts', () => {
      // 4 columns, 8 items:
      //   1  2  3  4
      //   5  6  7  8
      const collection = createGridCollection(8);
      const delegate = new GridKeyboardDelegate(collection, 4);

      expect(delegate.getKeyBelow('1')).toBe('5');
      expect(delegate.getKeyBelow('2')).toBe('6');
      expect(delegate.getKeyBelow('3')).toBe('7');
      expect(delegate.getKeyBelow('4')).toBe('8');
    });

    it('should skip disabled keys when navigating down', () => {
      // 3 columns, 6 items:
      //   1  2  3
      //   4  5  6
      const collection = createGridCollection(6);
      const disabledKeys = new Set<Key>(['4']);
      const delegate = new GridKeyboardDelegate(collection, 3, disabledKeys);

      // Should skip '4' and find next enabled key
      expect(delegate.getKeyBelow('1')).toBe('5');
    });

    it('should return null if target and all forward keys are disabled', () => {
      const collection = createGridCollection(6);
      const disabledKeys = new Set<Key>(['4', '5', '6']);
      const delegate = new GridKeyboardDelegate(collection, 3, disabledKeys);

      expect(delegate.getKeyBelow('1')).toBe(null);
    });
  });

  describe('getKeyAbove (vertical navigation)', () => {
    it('should navigate to same column in previous row', () => {
      // 3 columns, 6 items:
      //   1  2  3
      //   4  5  6
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyAbove('4')).toBe('1');
      expect(delegate.getKeyAbove('5')).toBe('2');
      expect(delegate.getKeyAbove('6')).toBe('3');
    });

    it('should return null when at top row', () => {
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyAbove('1')).toBe(null);
      expect(delegate.getKeyAbove('2')).toBe(null);
      expect(delegate.getKeyAbove('3')).toBe(null);
    });

    it('should skip disabled keys when navigating up', () => {
      const collection = createGridCollection(6);
      const disabledKeys = new Set<Key>(['1']);
      const delegate = new GridKeyboardDelegate(collection, 3, disabledKeys);

      // Should skip '1' and return null (no more keys backward)
      expect(delegate.getKeyAbove('4')).toBe(null);
    });

    it('should find previous enabled key when target is disabled', () => {
      // 3 columns, 9 items:
      //   1  2  3
      //   4  5  6
      //   7  8  9
      const collection = createGridCollection(9);
      const disabledKeys = new Set<Key>(['4']);
      const delegate = new GridKeyboardDelegate(collection, 3, disabledKeys);

      // Going up from 7, target is 4 (disabled), should find 3 (backward)
      expect(delegate.getKeyAbove('7')).toBe('3');
    });
  });

  describe('getKeyRightOf (horizontal navigation)', () => {
    it('should navigate to next item in row', () => {
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyRightOf('1')).toBe('2');
      expect(delegate.getKeyRightOf('2')).toBe('3');
      expect(delegate.getKeyRightOf('4')).toBe('5');
    });

    it('should wrap to next row', () => {
      // Right navigation moves sequentially through items
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyRightOf('3')).toBe('4');
    });

    it('should return null at last item', () => {
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyRightOf('6')).toBe(null);
    });

    it('should skip disabled keys', () => {
      const collection = createGridCollection(6);
      const disabledKeys = new Set<Key>(['2']);
      const delegate = new GridKeyboardDelegate(collection, 3, disabledKeys);

      expect(delegate.getKeyRightOf('1')).toBe('3');
    });
  });

  describe('getKeyLeftOf (horizontal navigation)', () => {
    it('should navigate to previous item in row', () => {
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyLeftOf('3')).toBe('2');
      expect(delegate.getKeyLeftOf('2')).toBe('1');
      expect(delegate.getKeyLeftOf('6')).toBe('5');
    });

    it('should wrap to previous row', () => {
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyLeftOf('4')).toBe('3');
    });

    it('should return null at first item', () => {
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyLeftOf('1')).toBe(null);
    });

    it('should skip disabled keys', () => {
      const collection = createGridCollection(6);
      const disabledKeys = new Set<Key>(['2']);
      const delegate = new GridKeyboardDelegate(collection, 3, disabledKeys);

      expect(delegate.getKeyLeftOf('3')).toBe('1');
    });
  });

  describe('getFirstKey', () => {
    it('should return first key when not disabled', () => {
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getFirstKey()).toBe('1');
    });

    it('should skip disabled first keys', () => {
      const collection = createGridCollection(6);
      const disabledKeys = new Set<Key>(['1', '2']);
      const delegate = new GridKeyboardDelegate(collection, 3, disabledKeys);

      expect(delegate.getFirstKey()).toBe('3');
    });

    it('should return null if all keys are disabled', () => {
      const collection = createGridCollection(3);
      const disabledKeys = new Set<Key>(['1', '2', '3']);
      const delegate = new GridKeyboardDelegate(collection, 3, disabledKeys);

      expect(delegate.getFirstKey()).toBe(null);
    });
  });

  describe('getLastKey', () => {
    it('should return last key when not disabled', () => {
      const collection = createGridCollection(6);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getLastKey()).toBe('6');
    });

    it('should skip disabled last keys', () => {
      const collection = createGridCollection(6);
      const disabledKeys = new Set<Key>(['5', '6']);
      const delegate = new GridKeyboardDelegate(collection, 3, disabledKeys);

      expect(delegate.getLastKey()).toBe('4');
    });
  });

  describe('getKeyForSearch', () => {
    it('should find matching key', () => {
      const items = new Map<Key, string>([
        ['1', 'Apple'],
        ['2', 'Banana'],
        ['3', 'Cherry'],
      ]);
      const collection = createMockCollection(items);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyForSearch('b')).toBe('2');
      expect(delegate.getKeyForSearch('che')).toBe('3');
    });

    it('should skip disabled keys', () => {
      const items = new Map<Key, string>([
        ['1', 'Apple'],
        ['2', 'Banana'],
        ['3', 'Berry'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['2']);
      const delegate = new GridKeyboardDelegate(collection, 3, disabledKeys);

      expect(delegate.getKeyForSearch('b')).toBe('3');
    });

    it('should be case insensitive', () => {
      const items = new Map<Key, string>([
        ['1', 'Apple'],
        ['2', 'Banana'],
      ]);
      const collection = createMockCollection(items);
      const delegate = new GridKeyboardDelegate(collection, 3);

      expect(delegate.getKeyForSearch('APP')).toBe('1');
      expect(delegate.getKeyForSearch('BaN')).toBe('2');
    });
  });

  describe('column count edge cases', () => {
    it('should handle column count of 1 (behaves like list)', () => {
      const collection = createGridCollection(4);
      const delegate = new GridKeyboardDelegate(collection, 1);

      // With 1 column, down = next item
      expect(delegate.getKeyBelow('1')).toBe('2');
      expect(delegate.getKeyBelow('2')).toBe('3');
      expect(delegate.getKeyAbove('3')).toBe('2');
    });

    it('should handle column count larger than items', () => {
      const collection = createGridCollection(3);
      const delegate = new GridKeyboardDelegate(collection, 10);

      // All items are in first row
      expect(delegate.getKeyBelow('1')).toBe(null);
      expect(delegate.getKeyBelow('2')).toBe(null);
      expect(delegate.getKeyRightOf('1')).toBe('2');
      expect(delegate.getKeyRightOf('2')).toBe('3');
    });

    it('should treat column count of 0 as 1', () => {
      const collection = createGridCollection(4);
      const delegate = new GridKeyboardDelegate(collection, 0);

      // Should behave like 1 column
      expect(delegate.getKeyBelow('1')).toBe('2');
    });

    it('should treat negative column count as 1', () => {
      const collection = createGridCollection(4);
      const delegate = new GridKeyboardDelegate(collection, -5);

      expect(delegate.getKeyBelow('1')).toBe('2');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { SpatialKeyboardDelegate } from '../keyboard/SpatialKeyboardDelegate';
import { type Rect } from '../layout/types';
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
 * Creates a grid layout with items positioned in a regular grid.
 * For a 3-column grid with 8 items (100px wide, 50px tall, 10px gap):
 *   1(0,0)    2(110,0)   3(220,0)
 *   4(0,60)   5(110,60)  6(220,60)
 *   7(0,120)  8(110,120)
 */
function createGridRects(
  count: number,
  columns: number,
  itemWidth = 100,
  itemHeight = 50,
  gap = 10,
): Map<Key, Rect> {
  const rects = new Map<Key, Rect>();
  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const key = String(i + 1);
    rects.set(key, {
      x: col * (itemWidth + gap),
      y: row * (itemHeight + gap),
      width: itemWidth,
      height: itemHeight,
    });
  }
  return rects;
}

/**
 * Creates a collection with items at specific positions.
 */
function createSpatialSetup(
  count: number,
  columns: number,
  itemWidth = 100,
  itemHeight = 50,
  gap = 10,
) {
  const items = new Map<Key, string>();
  for (let i = 1; i <= count; i++) {
    items.set(String(i), `Item ${i}`);
  }
  const collection = createMockCollection(items);
  const rects = createGridRects(count, columns, itemWidth, itemHeight, gap);
  const getItemRect = (key: Key) => rects.get(key) ?? null;

  return { collection, rects, getItemRect };
}

describe('SpatialKeyboardDelegate', () => {
  describe('getKeyBelow (vertical navigation)', () => {
    it('should navigate to item below in same column', () => {
      // 3 columns, 6 items:
      //   1  2  3
      //   4  5  6
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyBelow('1')).toBe('4');
      expect(delegate.getKeyBelow('2')).toBe('5');
      expect(delegate.getKeyBelow('3')).toBe('6');
    });

    it('should return null when at bottom row', () => {
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyBelow('4')).toBe(null);
      expect(delegate.getKeyBelow('5')).toBe(null);
      expect(delegate.getKeyBelow('6')).toBe(null);
    });

    it('should handle incomplete last row by finding nearest item', () => {
      // 3 columns, 8 items:
      //   1  2  3
      //   4  5  6
      //   7  8
      const { collection, getItemRect } = createSpatialSetup(8, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyBelow('4')).toBe('7');
      expect(delegate.getKeyBelow('5')).toBe('8');
      // Item 6 is above empty space - should find nearest (7 or 8)
      // Based on spatial distance, 8 is closer to 6's center
      expect(delegate.getKeyBelow('6')).toBe('8');
    });

    it('should skip disabled keys and find next available', () => {
      // 3 columns, 6 items:
      //   1  2  3
      //   4  5  6
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const disabledKeys = new Set<Key>(['4']);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        disabledKeys,
      );

      // Item 4 is disabled, should skip it and find next nearest (5)
      expect(delegate.getKeyBelow('1')).toBe('5');
    });

    it('should work with different column counts', () => {
      // 4 columns, 8 items:
      //   1  2  3  4
      //   5  6  7  8
      const { collection, getItemRect } = createSpatialSetup(8, 4);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyBelow('1')).toBe('5');
      expect(delegate.getKeyBelow('2')).toBe('6');
      expect(delegate.getKeyBelow('3')).toBe('7');
      expect(delegate.getKeyBelow('4')).toBe('8');
    });

    it('should handle single column layout', () => {
      // 1 column, 4 items (vertical list):
      //   1
      //   2
      //   3
      //   4
      const { collection, getItemRect } = createSpatialSetup(4, 1);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyBelow('1')).toBe('2');
      expect(delegate.getKeyBelow('2')).toBe('3');
      expect(delegate.getKeyBelow('3')).toBe('4');
      expect(delegate.getKeyBelow('4')).toBe(null);
    });
  });

  describe('getKeyAbove (vertical navigation)', () => {
    it('should navigate to item above in same column', () => {
      // 3 columns, 6 items:
      //   1  2  3
      //   4  5  6
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyAbove('4')).toBe('1');
      expect(delegate.getKeyAbove('5')).toBe('2');
      expect(delegate.getKeyAbove('6')).toBe('3');
    });

    it('should return null when at top row', () => {
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyAbove('1')).toBe(null);
      expect(delegate.getKeyAbove('2')).toBe(null);
      expect(delegate.getKeyAbove('3')).toBe(null);
    });

    it('should handle incomplete last row navigating up', () => {
      // 3 columns, 8 items:
      //   1  2  3
      //   4  5  6
      //   7  8
      const { collection, getItemRect } = createSpatialSetup(8, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyAbove('7')).toBe('4');
      expect(delegate.getKeyAbove('8')).toBe('5');
    });

    it('should skip disabled keys', () => {
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const disabledKeys = new Set<Key>(['2']);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        disabledKeys,
      );

      // Item 2 is disabled, should find next nearest (1 or 3)
      expect(delegate.getKeyAbove('5')).toBe('1');
    });
  });

  describe('getKeyRightOf (horizontal navigation)', () => {
    it('should navigate to next item in same row', () => {
      // 3 columns, 6 items:
      //   1  2  3
      //   4  5  6
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyRightOf('1')).toBe('2');
      expect(delegate.getKeyRightOf('2')).toBe('3');
      expect(delegate.getKeyRightOf('4')).toBe('5');
      expect(delegate.getKeyRightOf('5')).toBe('6');
    });

    it('should return null at end of row', () => {
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      // Right edge of rows - no item to the right on same row
      expect(delegate.getKeyRightOf('3')).toBe(null);
      expect(delegate.getKeyRightOf('6')).toBe(null);
    });

    it('should skip disabled keys', () => {
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const disabledKeys = new Set<Key>(['2']);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        disabledKeys,
      );

      // Item 2 is disabled, should skip to 3
      expect(delegate.getKeyRightOf('1')).toBe('3');
    });

    it('should handle incomplete last row', () => {
      // 3 columns, 8 items:
      //   1  2  3
      //   4  5  6
      //   7  8
      const { collection, getItemRect } = createSpatialSetup(8, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyRightOf('7')).toBe('8');
      expect(delegate.getKeyRightOf('8')).toBe(null);
    });
  });

  describe('getKeyLeftOf (horizontal navigation)', () => {
    it('should navigate to previous item in same row', () => {
      // 3 columns, 6 items:
      //   1  2  3
      //   4  5  6
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyLeftOf('2')).toBe('1');
      expect(delegate.getKeyLeftOf('3')).toBe('2');
      expect(delegate.getKeyLeftOf('5')).toBe('4');
      expect(delegate.getKeyLeftOf('6')).toBe('5');
    });

    it('should return null at start of row', () => {
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      // Left edge of rows - no item to the left on same row
      expect(delegate.getKeyLeftOf('1')).toBe(null);
      expect(delegate.getKeyLeftOf('4')).toBe(null);
    });

    it('should skip disabled keys', () => {
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const disabledKeys = new Set<Key>(['2']);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        disabledKeys,
      );

      // Item 2 is disabled, should skip to 1
      expect(delegate.getKeyLeftOf('3')).toBe('1');
    });
  });

  describe('getFirstKey', () => {
    it('should return first key in collection', () => {
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getFirstKey()).toBe('1');
    });

    it('should skip disabled first key', () => {
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const disabledKeys = new Set<Key>(['1']);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        disabledKeys,
      );

      expect(delegate.getFirstKey()).toBe('2');
    });

    it('should return null if all keys disabled', () => {
      const { collection, getItemRect } = createSpatialSetup(2, 2);
      const disabledKeys = new Set<Key>(['1', '2']);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        disabledKeys,
      );

      expect(delegate.getFirstKey()).toBe(null);
    });
  });

  describe('getLastKey', () => {
    it('should return last key in collection', () => {
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getLastKey()).toBe('6');
    });

    it('should skip disabled last key', () => {
      const { collection, getItemRect } = createSpatialSetup(6, 3);
      const disabledKeys = new Set<Key>(['6']);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        disabledKeys,
      );

      expect(delegate.getLastKey()).toBe('5');
    });
  });

  describe('getKeyForSearch (type-ahead)', () => {
    it('should find item by text value prefix', () => {
      const items = new Map<Key, string>([
        ['1', 'Apple'],
        ['2', 'Banana'],
        ['3', 'Cherry'],
      ]);
      const collection = createMockCollection(items);
      const rects = createGridRects(3, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        (key) => rects.get(key) ?? null,
        new Set(),
      );

      expect(delegate.getKeyForSearch('a')).toBe('1');
      expect(delegate.getKeyForSearch('b')).toBe('2');
      expect(delegate.getKeyForSearch('c')).toBe('3');
    });

    it('should be case insensitive', () => {
      const items = new Map<Key, string>([
        ['1', 'Apple'],
        ['2', 'Banana'],
      ]);
      const collection = createMockCollection(items);
      const rects = createGridRects(2, 2);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        (key) => rects.get(key) ?? null,
        new Set(),
      );

      expect(delegate.getKeyForSearch('A')).toBe('1');
      expect(delegate.getKeyForSearch('B')).toBe('2');
    });

    it('should skip disabled keys', () => {
      const items = new Map<Key, string>([
        ['1', 'Apple'],
        ['2', 'Apricot'],
      ]);
      const collection = createMockCollection(items);
      const rects = createGridRects(2, 2);
      const disabledKeys = new Set<Key>(['1']);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        (key) => rects.get(key) ?? null,
        disabledKeys,
      );

      expect(delegate.getKeyForSearch('a')).toBe('2');
    });

    it('should search from given key', () => {
      const items = new Map<Key, string>([
        ['1', 'Apple'],
        ['2', 'Apricot'],
        ['3', 'Avocado'],
      ]);
      const collection = createMockCollection(items);
      const rects = createGridRects(3, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        (key) => rects.get(key) ?? null,
        new Set(),
      );

      expect(delegate.getKeyForSearch('a', '1')).toBe('2');
      expect(delegate.getKeyForSearch('a', '2')).toBe('3');
    });

    it('should wrap around when searching', () => {
      const items = new Map<Key, string>([
        ['1', 'Apple'],
        ['2', 'Banana'],
        ['3', 'Cherry'],
      ]);
      const collection = createMockCollection(items);
      const rects = createGridRects(3, 3);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        (key) => rects.get(key) ?? null,
        new Set(),
      );

      expect(delegate.getKeyForSearch('a', '3')).toBe('1');
    });
  });

  describe('variable width items', () => {
    it('should navigate correctly with different item widths', () => {
      // Simulate variable width items:
      //   Wide Item 1 (200px)  |  Item 2 (100px)
      //   Item 3 (100px)       |  Item 4 (100px)  |  Item 5 (100px)
      const items = new Map<Key, string>([
        ['1', 'Wide Item'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
        ['4', 'Item 4'],
        ['5', 'Item 5'],
      ]);
      const collection = createMockCollection(items);

      const rects = new Map<Key, Rect>([
        ['1', { x: 0, y: 0, width: 200, height: 50 }],
        ['2', { x: 210, y: 0, width: 100, height: 50 }],
        ['3', { x: 0, y: 60, width: 100, height: 50 }],
        ['4', { x: 110, y: 60, width: 100, height: 50 }],
        ['5', { x: 220, y: 60, width: 100, height: 50 }],
      ]);

      const delegate = new SpatialKeyboardDelegate(
        collection,
        (key) => rects.get(key) ?? null,
        new Set(),
      );

      // Wide item 1 (center at x=100) should navigate down to item 3 or 4
      // Item 3 center at x=50, Item 4 center at x=160
      // 100 is closer to 50 (distance 50) than to 160 (distance 60)
      expect(delegate.getKeyBelow('1')).toBe('3');

      // Item 2 (center at x=260) should navigate down to item 5 (center at x=270)
      expect(delegate.getKeyBelow('2')).toBe('5');

      // Item 3 should navigate up to item 1 (wide item covers that area)
      expect(delegate.getKeyAbove('3')).toBe('1');

      // Item 5 should navigate up to item 2
      expect(delegate.getKeyAbove('5')).toBe('2');
    });

    it('should navigate horizontally on same row with variable widths', () => {
      // Row with variable widths:
      //   Wide(200px) | Medium(150px) | Small(100px)
      const items = new Map<Key, string>([
        ['1', 'Wide'],
        ['2', 'Medium'],
        ['3', 'Small'],
      ]);
      const collection = createMockCollection(items);

      const rects = new Map<Key, Rect>([
        ['1', { x: 0, y: 0, width: 200, height: 50 }],
        ['2', { x: 210, y: 0, width: 150, height: 50 }],
        ['3', { x: 370, y: 0, width: 100, height: 50 }],
      ]);

      const delegate = new SpatialKeyboardDelegate(
        collection,
        (key) => rects.get(key) ?? null,
        new Set(),
      );

      expect(delegate.getKeyRightOf('1')).toBe('2');
      expect(delegate.getKeyRightOf('2')).toBe('3');
      expect(delegate.getKeyRightOf('3')).toBe(null);

      expect(delegate.getKeyLeftOf('3')).toBe('2');
      expect(delegate.getKeyLeftOf('2')).toBe('1');
      expect(delegate.getKeyLeftOf('1')).toBe(null);
    });
  });

  describe('edge cases', () => {
    it('should handle empty collection', () => {
      const collection = createMockCollection(new Map());
      const delegate = new SpatialKeyboardDelegate(
        collection,
        () => null,
        new Set(),
      );

      expect(delegate.getFirstKey()).toBe(null);
      expect(delegate.getLastKey()).toBe(null);
    });

    it('should handle single item collection', () => {
      const { collection, getItemRect } = createSpatialSetup(1, 1);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyBelow('1')).toBe(null);
      expect(delegate.getKeyAbove('1')).toBe(null);
      expect(delegate.getKeyRightOf('1')).toBe(null);
      expect(delegate.getKeyLeftOf('1')).toBe(null);
      expect(delegate.getFirstKey()).toBe('1');
      expect(delegate.getLastKey()).toBe('1');
    });

    it('should handle invalid key gracefully', () => {
      const { collection, getItemRect } = createSpatialSetup(4, 2);
      const delegate = new SpatialKeyboardDelegate(
        collection,
        getItemRect,
        new Set(),
      );

      expect(delegate.getKeyBelow('nonexistent')).toBe(null);
      expect(delegate.getKeyAbove('nonexistent')).toBe(null);
    });

    it('should handle missing rect gracefully', () => {
      const { collection } = createSpatialSetup(4, 2);
      // Return null for all rects
      const delegate = new SpatialKeyboardDelegate(
        collection,
        () => null,
        new Set(),
      );

      expect(delegate.getKeyBelow('1')).toBe(null);
      expect(delegate.getKeyAbove('1')).toBe(null);
    });
  });
});

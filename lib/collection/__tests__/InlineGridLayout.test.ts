import { describe, it, expect } from 'vitest';
import { InlineGridLayout } from '../layout/InlineGridLayout';
import { SpatialKeyboardDelegate } from '../keyboard/SpatialKeyboardDelegate';
import { type Collection, type Key, type Node } from '../types';

function createMockCollection(count: number): Collection<unknown> {
  const items = new Map<Key, string>();
  for (let i = 1; i <= count; i++) {
    items.set(String(i), `Item ${i}`);
  }

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

describe('InlineGridLayout', () => {
  describe('getKeyboardDelegate', () => {
    it('should return a SpatialKeyboardDelegate', () => {
      const layout = new InlineGridLayout({ itemWidth: 100 });
      const collection = createMockCollection(9);

      const delegate = layout.getKeyboardDelegate(collection, new Set(), 400);

      expect(delegate).toBeInstanceOf(SpatialKeyboardDelegate);
    });

    describe('spatial navigation', () => {
      it('should navigate down to item in same column position', () => {
        // itemWidth: 100, gap: 16 (default)
        // Container width 348: fits 3 items (100 + 16 + 100 + 16 + 100 = 332 + 16 = 348)
        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const collection = createMockCollection(9);

        // Need to set up the layout with items first
        const items = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          items.set(node.key, node);
        }
        layout.setItems(items, Array.from(items.keys()));
        layout.update({ containerWidth: 348 });

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 348);

        // Layout should be:
        //   1  2  3
        //   4  5  6
        //   7  8  9
        expect(delegate.getKeyBelow('1')).toBe('4');
        expect(delegate.getKeyBelow('2')).toBe('5');
        expect(delegate.getKeyBelow('3')).toBe('6');
        expect(delegate.getKeyBelow('4')).toBe('7');
        expect(delegate.getKeyBelow('5')).toBe('8');
        expect(delegate.getKeyBelow('6')).toBe('9');
      });

      it('should navigate up to item in same column position', () => {
        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const collection = createMockCollection(9);

        const items = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          items.set(node.key, node);
        }
        layout.setItems(items, Array.from(items.keys()));
        layout.update({ containerWidth: 348 });

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 348);

        expect(delegate.getKeyAbove('7')).toBe('4');
        expect(delegate.getKeyAbove('8')).toBe('5');
        expect(delegate.getKeyAbove('9')).toBe('6');
        expect(delegate.getKeyAbove('4')).toBe('1');
        expect(delegate.getKeyAbove('5')).toBe('2');
        expect(delegate.getKeyAbove('6')).toBe('3');
      });

      it('should navigate right to next item in same row', () => {
        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const collection = createMockCollection(9);

        const items = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          items.set(node.key, node);
        }
        layout.setItems(items, Array.from(items.keys()));
        layout.update({ containerWidth: 348 });

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 348);

        expect(delegate.getKeyRightOf?.('1')).toBe('2');
        expect(delegate.getKeyRightOf?.('2')).toBe('3');
        expect(delegate.getKeyRightOf?.('3')).toBe(null); // End of row
        expect(delegate.getKeyRightOf?.('4')).toBe('5');
        expect(delegate.getKeyRightOf?.('5')).toBe('6');
      });

      it('should navigate left to previous item in same row', () => {
        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const collection = createMockCollection(9);

        const items = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          items.set(node.key, node);
        }
        layout.setItems(items, Array.from(items.keys()));
        layout.update({ containerWidth: 348 });

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 348);

        expect(delegate.getKeyLeftOf?.('3')).toBe('2');
        expect(delegate.getKeyLeftOf?.('2')).toBe('1');
        expect(delegate.getKeyLeftOf?.('1')).toBe(null); // Start of row
        expect(delegate.getKeyLeftOf?.('6')).toBe('5');
        expect(delegate.getKeyLeftOf?.('5')).toBe('4');
      });

      it('should handle incomplete last row', () => {
        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const collection = createMockCollection(8); // 3 columns, last row has 2 items

        const items = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          items.set(node.key, node);
        }
        layout.setItems(items, Array.from(items.keys()));
        layout.update({ containerWidth: 348 });

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 348);

        // Layout:
        //   1  2  3
        //   4  5  6
        //   7  8
        expect(delegate.getKeyBelow('4')).toBe('7');
        expect(delegate.getKeyBelow('5')).toBe('8');
        // Item 6 is above empty space - should find nearest item in row below
        expect(delegate.getKeyBelow('6')).toBe('8');

        expect(delegate.getKeyAbove('7')).toBe('4');
        expect(delegate.getKeyAbove('8')).toBe('5');
      });

      it('should handle different column counts based on container width', () => {
        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const collection = createMockCollection(8);

        const items = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          items.set(node.key, node);
        }
        layout.setItems(items, Array.from(items.keys()));

        // Narrow container: 2 columns (232px = 100 + 16 + 100 + 16)
        layout.update({ containerWidth: 232 });
        const delegate2col = layout.getKeyboardDelegate(
          collection,
          new Set(),
          232,
        );

        // Layout with 2 columns:
        //   1  2
        //   3  4
        //   5  6
        //   7  8
        expect(delegate2col.getKeyBelow('1')).toBe('3');
        expect(delegate2col.getKeyBelow('2')).toBe('4');
        expect(delegate2col.getKeyRightOf?.('1')).toBe('2');
        expect(delegate2col.getKeyRightOf?.('2')).toBe(null);

        // Wide container: 4 columns (464px = 100+16+100+16+100+16+100+16)
        layout.update({ containerWidth: 464 });
        const delegate4col = layout.getKeyboardDelegate(
          collection,
          new Set(),
          464,
        );

        // Layout with 4 columns:
        //   1  2  3  4
        //   5  6  7  8
        expect(delegate4col.getKeyBelow('1')).toBe('5');
        expect(delegate4col.getKeyBelow('4')).toBe('8');
        expect(delegate4col.getKeyRightOf?.('1')).toBe('2');
        expect(delegate4col.getKeyRightOf?.('3')).toBe('4');
        expect(delegate4col.getKeyRightOf?.('4')).toBe(null);
      });
    });

    describe('disabled keys', () => {
      it('should skip disabled keys when navigating down', () => {
        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const collection = createMockCollection(9);

        const items = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          items.set(node.key, node);
        }
        layout.setItems(items, Array.from(items.keys()));
        layout.update({ containerWidth: 348 });

        const disabledKeys = new Set<Key>(['4']);
        const delegate = layout.getKeyboardDelegate(
          collection,
          disabledKeys,
          348,
        );

        // Item 4 is disabled, should skip it
        // From 1, spatially finds nearest non-disabled item in the same column below
        // That's item 7 (which is directly below 1 in column 0), not item 5 (which is in column 1)
        expect(delegate.getKeyBelow('1')).toBe('7');
      });

      it('should skip disabled keys when navigating right', () => {
        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const collection = createMockCollection(9);

        const items = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          items.set(node.key, node);
        }
        layout.setItems(items, Array.from(items.keys()));
        layout.update({ containerWidth: 348 });

        const disabledKeys = new Set<Key>(['2']);
        const delegate = layout.getKeyboardDelegate(
          collection,
          disabledKeys,
          348,
        );

        // Item 2 is disabled, should skip to 3
        expect(delegate.getKeyRightOf?.('1')).toBe('3');
      });
    });

    describe('first and last key', () => {
      it('should return first key', () => {
        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const collection = createMockCollection(9);

        const items = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          items.set(node.key, node);
        }
        layout.setItems(items, Array.from(items.keys()));
        layout.update({ containerWidth: 348 });

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 348);

        expect(delegate.getFirstKey()).toBe('1');
      });

      it('should return last key', () => {
        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const collection = createMockCollection(9);

        const items = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          items.set(node.key, node);
        }
        layout.setItems(items, Array.from(items.keys()));
        layout.update({ containerWidth: 348 });

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 348);

        expect(delegate.getLastKey()).toBe('9');
      });

      it('should skip disabled keys for first/last', () => {
        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const collection = createMockCollection(9);

        const items = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          items.set(node.key, node);
        }
        layout.setItems(items, Array.from(items.keys()));
        layout.update({ containerWidth: 348 });

        const disabledKeys = new Set<Key>(['1', '9']);
        const delegate = layout.getKeyboardDelegate(
          collection,
          disabledKeys,
          348,
        );

        expect(delegate.getFirstKey()).toBe('2');
        expect(delegate.getLastKey()).toBe('8');
      });
    });

    describe('type-ahead search', () => {
      it('should find item by text prefix', () => {
        const items = new Map<Key, string>([
          ['1', 'Apple'],
          ['2', 'Banana'],
          ['3', 'Cherry'],
          ['4', 'Date'],
        ]);

        const keys = Array.from(items.keys());
        const collection: Collection<unknown> = {
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

        const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
        const nodeItems = new Map<Key, Node<unknown>>();
        for (const node of collection) {
          nodeItems.set(node.key, node);
        }
        layout.setItems(nodeItems, Array.from(nodeItems.keys()));
        layout.update({ containerWidth: 232 });

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 232);

        expect(delegate.getKeyForSearch?.('a')).toBe('1');
        expect(delegate.getKeyForSearch?.('b')).toBe('2');
        expect(delegate.getKeyForSearch?.('c')).toBe('3');
        expect(delegate.getKeyForSearch?.('d')).toBe('4');
      });
    });
  });

  describe('getContainerStyles', () => {
    it('should return flexbox styles', () => {
      const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
      const styles = layout.getContainerStyles();

      expect(styles.display).toBe('flex');
      expect(styles.flexWrap).toBe('wrap');
      expect(styles.gap).toBe(16);
    });

    it('should use custom gap', () => {
      const layout = new InlineGridLayout({ itemWidth: 100, gap: 24 });
      const styles = layout.getContainerStyles();

      expect(styles.gap).toBe(24);
    });
  });

  describe('getItemStyles', () => {
    it('should return empty styles (items control their own width)', () => {
      const layout = new InlineGridLayout({ itemWidth: 100, gap: 16 });
      const styles = layout.getItemStyles();

      expect(styles).toEqual({});
    });
  });

  describe('getGap', () => {
    it('should return configured gap', () => {
      const layout = new InlineGridLayout({ itemWidth: 100, gap: 20 });
      expect(layout.getGap()).toBe(20);
    });

    it('should default to 16', () => {
      const layout = new InlineGridLayout({ itemWidth: 100 });
      expect(layout.getGap()).toBe(16);
    });
  });
});

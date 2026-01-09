import { describe, it, expect } from 'vitest';
import { GridLayout } from '../layout/GridLayout';
import { GridKeyboardDelegate } from '../keyboard/GridKeyboardDelegate';
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

describe('GridLayout', () => {
  describe('getKeyboardDelegate', () => {
    it('should return a GridKeyboardDelegate', () => {
      const layout = new GridLayout({ columns: 3 });
      const collection = createMockCollection(9);

      const delegate = layout.getKeyboardDelegate(collection, new Set());

      expect(delegate).toBeInstanceOf(GridKeyboardDelegate);
    });

    describe('with fixed columns', () => {
      it('should use fixed column count for navigation', () => {
        const layout = new GridLayout({ columns: 3 });
        const collection = createMockCollection(9);
        const delegate = layout.getKeyboardDelegate(collection, new Set());

        // With 3 columns, down from '1' should go to '4'
        expect(delegate.getKeyBelow('1')).toBe('4');
        expect(delegate.getKeyBelow('2')).toBe('5');
        expect(delegate.getKeyBelow('3')).toBe('6');
      });

      it('should respect fixed column count regardless of containerWidth', () => {
        const layout = new GridLayout({ columns: 2 });
        const collection = createMockCollection(6);

        // Even with a wide container, fixed columns should be used
        const delegate = layout.getKeyboardDelegate(
          collection,
          new Set(),
          1000,
        );

        // With 2 columns, down from '1' should go to '3'
        expect(delegate.getKeyBelow('1')).toBe('3');
        expect(delegate.getKeyBelow('2')).toBe('4');
      });
    });

    describe('with auto columns', () => {
      it('should calculate column count from container width', () => {
        // minItemWidth: 200, gap: 16 (defaults)
        // Container width 600: (600 + 16) / (200 + 16) = 2.85 -> 2 columns
        const layout = new GridLayout({ columns: 'auto', minItemWidth: 200 });
        const collection = createMockCollection(8);

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 600);

        // With 2 columns calculated, down from '1' should go to '3'
        expect(delegate.getKeyBelow('1')).toBe('3');
        expect(delegate.getKeyBelow('2')).toBe('4');
      });

      it('should calculate more columns for wider containers', () => {
        // minItemWidth: 200, gap: 16
        // Container width 1000: (1000 + 16) / (200 + 16) = 4.7 -> 4 columns
        const layout = new GridLayout({ columns: 'auto', minItemWidth: 200 });
        const collection = createMockCollection(12);

        const delegate = layout.getKeyboardDelegate(
          collection,
          new Set(),
          1000,
        );

        // With 4 columns, down from '1' should go to '5'
        expect(delegate.getKeyBelow('1')).toBe('5');
        expect(delegate.getKeyBelow('4')).toBe('8');
      });

      it('should calculate fewer columns for narrow containers', () => {
        // minItemWidth: 200, gap: 16
        // Container width 250: (250 + 16) / (200 + 16) = 1.23 -> 1 column
        const layout = new GridLayout({ columns: 'auto', minItemWidth: 200 });
        const collection = createMockCollection(6);

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 250);

        // With 1 column, down from '1' should go to '2'
        expect(delegate.getKeyBelow('1')).toBe('2');
        expect(delegate.getKeyBelow('2')).toBe('3');
      });

      it('should respect custom minItemWidth', () => {
        // minItemWidth: 100, gap: 16
        // Container width 500: (500 + 16) / (100 + 16) = 4.45 -> 4 columns
        const layout = new GridLayout({ columns: 'auto', minItemWidth: 100 });
        const collection = createMockCollection(12);

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 500);

        // With 4 columns, down from '1' should go to '5'
        expect(delegate.getKeyBelow('1')).toBe('5');
      });

      it('should respect custom gap', () => {
        // minItemWidth: 200, gap: 50
        // Container width 600: (600 + 50) / (200 + 50) = 2.6 -> 2 columns
        const layout = new GridLayout({
          columns: 'auto',
          minItemWidth: 200,
          gap: 50,
        });
        const collection = createMockCollection(8);

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 600);

        // With 2 columns, down from '1' should go to '3'
        expect(delegate.getKeyBelow('1')).toBe('3');
      });

      it('should default to 1 column when containerWidth is undefined', () => {
        const layout = new GridLayout({ columns: 'auto' });
        const collection = createMockCollection(6);

        // Without containerWidth, falls back to currentColumnCount (1)
        const delegate = layout.getKeyboardDelegate(collection, new Set());

        // With 1 column, down from '1' should go to '2'
        expect(delegate.getKeyBelow('1')).toBe('2');
      });

      it('should always have at least 1 column', () => {
        // Very narrow container
        const layout = new GridLayout({ columns: 'auto', minItemWidth: 500 });
        const collection = createMockCollection(4);

        const delegate = layout.getKeyboardDelegate(collection, new Set(), 100);

        // Should still have 1 column minimum
        expect(delegate.getKeyBelow('1')).toBe('2');
      });
    });

    describe('disabled keys', () => {
      it('should pass disabled keys to the delegate', () => {
        const layout = new GridLayout({ columns: 3 });
        const collection = createMockCollection(9);
        const disabledKeys = new Set<Key>(['4']);

        const delegate = layout.getKeyboardDelegate(collection, disabledKeys);

        // '4' is disabled, so down from '1' should skip to '5'
        expect(delegate.getKeyBelow('1')).toBe('5');
      });
    });
  });

  describe('getContainerStyles', () => {
    it('should return grid styles for fixed columns', () => {
      const layout = new GridLayout({ columns: 3, gap: 16 });
      const styles = layout.getContainerStyles();

      expect(styles.display).toBe('grid');
      expect(styles.gridTemplateColumns).toBe('repeat(3, 1fr)');
      expect(styles.gap).toBe(16);
    });

    it('should return auto-fill styles for auto columns', () => {
      const layout = new GridLayout({
        columns: 'auto',
        minItemWidth: 200,
        gap: 20,
      });
      const styles = layout.getContainerStyles();

      expect(styles.display).toBe('grid');
      expect(styles.gridTemplateColumns).toBe(
        'repeat(auto-fill, minmax(200px, 1fr))',
      );
      expect(styles.gap).toBe(20);
    });
  });
});

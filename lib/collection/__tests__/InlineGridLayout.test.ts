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
  describe('constructor', () => {
    it('should create with default gap', () => {
      const layout = new InlineGridLayout();
      expect(layout.getGap()).toBe(16);
    });

    it('should create with custom gap', () => {
      const layout = new InlineGridLayout({ gap: 24 });
      expect(layout.getGap()).toBe(24);
    });
  });

  describe('getKeyboardDelegate', () => {
    it('should return a SpatialKeyboardDelegate', () => {
      const layout = new InlineGridLayout({ gap: 16 });
      const collection = createMockCollection(9);

      const delegate = layout.getKeyboardDelegate(collection, new Set(), 400);

      expect(delegate).toBeInstanceOf(SpatialKeyboardDelegate);
    });
  });

  describe('getContainerStyles', () => {
    it('should return flexbox styles with wrap', () => {
      const layout = new InlineGridLayout({ gap: 16 });
      const styles = layout.getContainerStyles();

      expect(styles.display).toBe('flex');
      expect(styles.flexWrap).toBe('wrap');
      expect(styles.gap).toBe(16);
    });

    it('should use custom gap', () => {
      const layout = new InlineGridLayout({ gap: 24 });
      const styles = layout.getContainerStyles();

      expect(styles.gap).toBe(24);
    });

    it('should use default gap when not specified', () => {
      const layout = new InlineGridLayout();
      const styles = layout.getContainerStyles();

      expect(styles.gap).toBe(16);
    });
  });

  describe('getItemStyles', () => {
    it('should return empty styles (items control their own size)', () => {
      const layout = new InlineGridLayout({ gap: 16 });
      const styles = layout.getItemStyles();

      expect(styles).toEqual({});
    });
  });

  describe('getMeasurementInfo', () => {
    it('should return intrinsic measurement mode', () => {
      const layout = new InlineGridLayout({ gap: 16 });
      const info = layout.getMeasurementInfo();

      expect(info.mode).toBe('intrinsic');
      expect(info.constrainedWidth).toBeUndefined();
    });
  });

  describe('getRows', () => {
    it('should return empty rows before measurements', () => {
      const layout = new InlineGridLayout({ gap: 16 });
      layout.update({ containerWidth: 400 });

      const rows = layout.getRows();

      expect(rows).toEqual([]);
    });
  });

  describe('updateWithMeasurements', () => {
    it('should throw error for zero-size items', () => {
      const layout = new InlineGridLayout({ gap: 16 });
      const collection = createMockCollection(3);

      const items = new Map<Key, Node<unknown>>();
      for (const node of collection) {
        items.set(node.key, node);
      }
      layout.setItems(items, Array.from(items.keys()));
      layout.update({ containerWidth: 400 });

      // Zero width should throw
      expect(() => {
        layout.updateWithMeasurements(
          new Map([
            ['1', { width: 0, height: 50 }],
            ['2', { width: 100, height: 50 }],
            ['3', { width: 100, height: 50 }],
          ]),
        );
      }).toThrow(/measured to 0x50/);

      // Zero height should throw
      expect(() => {
        layout.updateWithMeasurements(
          new Map([
            ['1', { width: 100, height: 0 }],
            ['2', { width: 100, height: 50 }],
            ['3', { width: 100, height: 50 }],
          ]),
        );
      }).toThrow(/measured to 100x0/);
    });

    it('should calculate rows from measured sizes', () => {
      const layout = new InlineGridLayout({ gap: 16 });
      const collection = createMockCollection(6);

      const items = new Map<Key, Node<unknown>>();
      for (const node of collection) {
        items.set(node.key, node);
      }
      layout.setItems(items, Array.from(items.keys()));
      layout.update({ containerWidth: 348 }); // Fits 3x100px items with 16px gaps

      // Provide measurements for all items (100px wide, 50px tall)
      layout.updateWithMeasurements(
        new Map([
          ['1', { width: 100, height: 50 }],
          ['2', { width: 100, height: 50 }],
          ['3', { width: 100, height: 50 }],
          ['4', { width: 100, height: 50 }],
          ['5', { width: 100, height: 50 }],
          ['6', { width: 100, height: 50 }],
        ]),
      );

      const rows = layout.getRows();

      // Should have 2 rows: [1,2,3] and [4,5,6]
      expect(rows.length).toBe(2);
      expect(rows[0]?.itemKeys).toEqual(['1', '2', '3']);
      expect(rows[1]?.itemKeys).toEqual(['4', '5', '6']);
    });

    it('should handle variable-width items', () => {
      const layout = new InlineGridLayout({ gap: 16 });
      const collection = createMockCollection(4);

      const items = new Map<Key, Node<unknown>>();
      for (const node of collection) {
        items.set(node.key, node);
      }
      layout.setItems(items, Array.from(items.keys()));
      layout.update({ containerWidth: 400 });

      // Variable widths: 150 + 16 + 150 = 316 (fits 2 per row)
      // Then 200 + 16 + 100 = 316 (fits 2 per row)
      layout.updateWithMeasurements(
        new Map([
          ['1', { width: 150, height: 50 }],
          ['2', { width: 150, height: 60 }],
          ['3', { width: 200, height: 50 }],
          ['4', { width: 100, height: 70 }],
        ]),
      );

      const rows = layout.getRows();

      // Row 1: items 1 and 2 (150 + 16 + 150 = 316 < 400)
      // Row 2: items 3 and 4 (200 + 16 + 100 = 316 < 400)
      expect(rows.length).toBe(2);
      expect(rows[0]?.itemKeys).toEqual(['1', '2']);
      expect(rows[0]?.height).toBe(60); // Max height of row
      expect(rows[1]?.itemKeys).toEqual(['3', '4']);
      expect(rows[1]?.height).toBe(70); // Max height of row
    });

    it('should wrap items that exceed container width', () => {
      const layout = new InlineGridLayout({ gap: 16 });
      const collection = createMockCollection(3);

      const items = new Map<Key, Node<unknown>>();
      for (const node of collection) {
        items.set(node.key, node);
      }
      layout.setItems(items, Array.from(items.keys()));
      layout.update({ containerWidth: 250 });

      // Each item is 150px wide, container is 250px
      // Only 1 item fits per row (150 + 16 + 150 = 316 > 250)
      layout.updateWithMeasurements(
        new Map([
          ['1', { width: 150, height: 50 }],
          ['2', { width: 150, height: 50 }],
          ['3', { width: 150, height: 50 }],
        ]),
      );

      const rows = layout.getRows();

      expect(rows.length).toBe(3);
      expect(rows[0]?.itemKeys).toEqual(['1']);
      expect(rows[1]?.itemKeys).toEqual(['2']);
      expect(rows[2]?.itemKeys).toEqual(['3']);
    });
  });

  describe('getGap', () => {
    it('should return configured gap', () => {
      const layout = new InlineGridLayout({ gap: 20 });
      expect(layout.getGap()).toBe(20);
    });

    it('should default to 16', () => {
      const layout = new InlineGridLayout();
      expect(layout.getGap()).toBe(16);
    });
  });

  describe('items per row calculation (regression tests)', () => {
    it('should calculate exact number of items that fit in container width', () => {
      // This test documents the exact calculation to prevent regressions
      // The bug was that containerWidth was incorrectly including padding,
      // causing more items to appear per row than should fit.
      const layout = new InlineGridLayout({ gap: 8 });
      const collection = createMockCollection(21);

      const items = new Map<Key, Node<unknown>>();
      for (const node of collection) {
        items.set(node.key, node);
      }
      layout.setItems(items, Array.from(items.keys()));

      // Container content width: 890px (this should NOT include padding)
      // Item width: 120px, Gap: 8px
      // Math: 7 items = 7*120 + 6*8 = 840 + 48 = 888px <= 890px ✓
      //       8 items = 8*120 + 7*8 = 960 + 56 = 1016px > 890px ✗
      layout.update({ containerWidth: 890 });

      // Create measurements for all items (120px wide each)
      const measurements = new Map<Key, { width: number; height: number }>();
      for (let i = 1; i <= 21; i++) {
        measurements.set(String(i), { width: 120, height: 120 });
      }
      layout.updateWithMeasurements(measurements);

      const rows = layout.getRows();

      // Should have 3 rows with 7 items each
      expect(rows.length).toBe(3);
      expect(rows[0]?.itemKeys.length).toBe(7);
      expect(rows[1]?.itemKeys.length).toBe(7);
      expect(rows[2]?.itemKeys.length).toBe(7);
    });

    it('should not fit more items than mathematically possible', () => {
      // If this test fails, it means the layout is incorrectly calculating
      // that 8 items fit in a space where only 7 should fit.
      const layout = new InlineGridLayout({ gap: 8 });
      const collection = createMockCollection(16);

      const items = new Map<Key, Node<unknown>>();
      for (const node of collection) {
        items.set(node.key, node);
      }
      layout.setItems(items, Array.from(items.keys()));

      // Container width that fits exactly 4 items
      // 4 items: 4*100 + 3*8 = 400 + 24 = 424px
      // 5 items: 5*100 + 4*8 = 500 + 32 = 532px
      // So container width of 424 should fit exactly 4 items
      layout.update({ containerWidth: 424 });

      const measurements = new Map<Key, { width: number; height: number }>();
      for (let i = 1; i <= 16; i++) {
        measurements.set(String(i), { width: 100, height: 100 });
      }
      layout.updateWithMeasurements(measurements);

      const rows = layout.getRows();

      expect(rows.length).toBe(4);
      expect(rows[0]?.itemKeys.length).toBe(4);
      expect(rows[1]?.itemKeys.length).toBe(4);
      expect(rows[2]?.itemKeys.length).toBe(4);
      expect(rows[3]?.itemKeys.length).toBe(4);
    });

    it('should handle tight fit where items exactly fill container', () => {
      const layout = new InlineGridLayout({ gap: 10 });
      const collection = createMockCollection(6);

      const items = new Map<Key, Node<unknown>>();
      for (const node of collection) {
        items.set(node.key, node);
      }
      layout.setItems(items, Array.from(items.keys()));

      // Container width that exactly fits 3 items
      // 3 items: 3*100 + 2*10 = 300 + 20 = 320px (exact fit)
      layout.update({ containerWidth: 320 });

      const measurements = new Map<Key, { width: number; height: number }>();
      for (let i = 1; i <= 6; i++) {
        measurements.set(String(i), { width: 100, height: 50 });
      }
      layout.updateWithMeasurements(measurements);

      const rows = layout.getRows();

      // With exact fit, 3 items per row
      expect(rows.length).toBe(2);
      expect(rows[0]?.itemKeys.length).toBe(3);
      expect(rows[1]?.itemKeys.length).toBe(3);
    });

    it('should wrap to next row when one more item would overflow', () => {
      const layout = new InlineGridLayout({ gap: 8 });
      const collection = createMockCollection(5);

      const items = new Map<Key, Node<unknown>>();
      for (const node of collection) {
        items.set(node.key, node);
      }
      layout.setItems(items, Array.from(items.keys()));

      // Container width: 319px
      // 3 items: 3*100 + 2*8 = 300 + 16 = 316px <= 319px ✓
      // 4 items: 4*100 + 3*8 = 400 + 24 = 424px > 319px ✗
      layout.update({ containerWidth: 319 });

      const measurements = new Map<Key, { width: number; height: number }>();
      for (let i = 1; i <= 5; i++) {
        measurements.set(String(i), { width: 100, height: 50 });
      }
      layout.updateWithMeasurements(measurements);

      const rows = layout.getRows();

      // 3 items per row, last row has 2
      expect(rows.length).toBe(2);
      expect(rows[0]?.itemKeys.length).toBe(3);
      expect(rows[1]?.itemKeys.length).toBe(2);
    });
  });
});

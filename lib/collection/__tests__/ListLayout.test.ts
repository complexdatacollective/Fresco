import { describe, it, expect } from 'vitest';
import { ListLayout } from '../layout/ListLayout';
import { ListKeyboardDelegate } from '../keyboard/ListKeyboardDelegate';
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

describe('ListLayout', () => {
  describe('constructor', () => {
    it('should create with default options', () => {
      const layout = new ListLayout();

      expect(layout.getGap()).toBe(0);
      expect(layout.getPadding()).toEqual({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      });
    });

    it('should accept gap option', () => {
      const layout = new ListLayout({ gap: 16 });

      expect(layout.getGap()).toBe(16);
    });

    it('should accept numeric padding', () => {
      const layout = new ListLayout({ padding: 20 });

      expect(layout.getPadding()).toEqual({
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      });
    });

    it('should accept object padding', () => {
      const layout = new ListLayout({
        padding: { top: 10, right: 20, bottom: 30, left: 40 },
      });

      expect(layout.getPadding()).toEqual({
        top: 10,
        right: 20,
        bottom: 30,
        left: 40,
      });
    });
  });

  describe('getContainerStyles', () => {
    it('should return flexbox styles', () => {
      const layout = new ListLayout({ gap: 8 });
      const styles = layout.getContainerStyles();

      expect(styles.display).toBe('flex');
      expect(styles.flexDirection).toBe('column');
      expect(styles.gap).toBe(8);
    });

    it('should not include padding in container styles (padding is handled separately)', () => {
      const layout = new ListLayout({ padding: 16 });
      const styles = layout.getContainerStyles();

      // Padding is accessed via getPadding(), not in container styles
      expect(styles.padding).toBeUndefined();
      expect(layout.getPadding()).toEqual({
        top: 16,
        right: 16,
        bottom: 16,
        left: 16,
      });
    });
  });

  describe('getKeyboardDelegate', () => {
    it('should return a ListKeyboardDelegate', () => {
      const layout = new ListLayout();
      const collection = createMockCollection(5);

      const delegate = layout.getKeyboardDelegate(collection, new Set());

      expect(delegate).toBeInstanceOf(ListKeyboardDelegate);
    });

    it('should provide correct sequential navigation', () => {
      const layout = new ListLayout();
      const collection = createMockCollection(5);

      const delegate = layout.getKeyboardDelegate(collection, new Set());

      // List navigation is sequential
      expect(delegate.getKeyBelow('1')).toBe('2');
      expect(delegate.getKeyBelow('2')).toBe('3');
      expect(delegate.getKeyAbove('3')).toBe('2');
      expect(delegate.getKeyAbove('2')).toBe('1');
    });

    it('should pass disabled keys to delegate', () => {
      const layout = new ListLayout();
      const collection = createMockCollection(5);
      const disabledKeys = new Set<Key>(['2', '3']);

      const delegate = layout.getKeyboardDelegate(collection, disabledKeys);

      // Should skip disabled keys
      expect(delegate.getKeyBelow('1')).toBe('4');
      expect(delegate.getKeyAbove('4')).toBe('1');
    });

    it('should ignore containerWidth parameter', () => {
      const layout = new ListLayout();
      const collection = createMockCollection(5);

      // containerWidth doesn't affect list navigation
      const delegate1 = layout.getKeyboardDelegate(collection, new Set(), 100);
      const delegate2 = layout.getKeyboardDelegate(collection, new Set(), 1000);

      expect(delegate1.getKeyBelow('1')).toBe('2');
      expect(delegate2.getKeyBelow('1')).toBe('2');
    });
  });

  describe('update', () => {
    it('should calculate layout positions', () => {
      const layout = new ListLayout({ gap: 10, padding: 20 });
      layout.setItems(
        new Map([
          ['a', { key: 'a', value: 'A', type: 'item', textValue: 'A' }],
          ['b', { key: 'b', value: 'B', type: 'item', textValue: 'B' }],
        ] as [Key, Node<unknown>][]),
        ['a', 'b'],
      );

      layout.update({ containerWidth: 400 });

      const infoA = layout.getLayoutInfo('a');
      const infoB = layout.getLayoutInfo('b');

      expect(infoA).not.toBeNull();
      expect(infoA?.rect.x).toBe(20); // left padding
      expect(infoA?.rect.y).toBe(20); // top padding
      expect(infoA?.rect.width).toBe(360); // 400 - 20 - 20 (padding)

      expect(infoB).not.toBeNull();
      expect(infoB?.rect.x).toBe(20);
      expect(infoB?.rect.y).toBe(30); // top padding + gap
    });

    it('should handle empty collection', () => {
      const layout = new ListLayout();
      layout.setItems(new Map(), []);

      layout.update({ containerWidth: 400 });

      const size = layout.getContentSize();
      expect(size.width).toBe(400);
      expect(size.height).toBe(0);
    });
  });

  describe('getLayoutInfo', () => {
    it('should return null for unknown key', () => {
      const layout = new ListLayout();

      const info = layout.getLayoutInfo('unknown');

      expect(info).toBeNull();
    });
  });

  describe('setItems', () => {
    it('should store items and ordered keys', () => {
      const layout = new ListLayout();
      const items = new Map<Key, Node<unknown>>([
        [
          'a',
          {
            key: 'a',
            value: 'A',
            type: 'item',
            textValue: 'A',
          } as Node<unknown>,
        ],
        [
          'b',
          {
            key: 'b',
            value: 'B',
            type: 'item',
            textValue: 'B',
          } as Node<unknown>,
        ],
      ]);

      layout.setItems(items, ['a', 'b']);
      layout.update({ containerWidth: 400 });

      expect(layout.getLayoutInfo('a')).not.toBeNull();
      expect(layout.getLayoutInfo('b')).not.toBeNull();
    });
  });
});

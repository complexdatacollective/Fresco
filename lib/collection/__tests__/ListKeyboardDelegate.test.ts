import { describe, it, expect } from 'vitest';
import { ListKeyboardDelegate } from '../keyboard/ListKeyboardDelegate';
import { type Collection, type Key, type Node } from '../types';

function createMockCollection(items: Map<Key, unknown>): Collection<unknown> {
  const keys = Array.from(items.keys());

  return {
    size: items.size,
    getKeys: () => new Set(keys),
    getItem: (key: Key) => {
      const value = items.get(key);
      if (!value) return undefined;
      const textValue =
        typeof value === 'string' || typeof value === 'number'
          ? String(value)
          : JSON.stringify(value);
      return {
        key,
        value,
        type: 'item',
        textValue,
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

describe('ListKeyboardDelegate', () => {
  describe('getKeyBelow', () => {
    it('should return the next key when no keys are disabled', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
      ]);
      const collection = createMockCollection(items);
      const delegate = new ListKeyboardDelegate(collection);

      expect(delegate.getKeyBelow('1')).toBe('2');
      expect(delegate.getKeyBelow('2')).toBe('3');
      expect(delegate.getKeyBelow('3')).toBe(null);
    });

    it('should skip disabled keys', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
        ['4', 'Item 4'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['2', '3']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getKeyBelow('1')).toBe('4');
    });

    it('should return null if all remaining keys are disabled', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['2', '3']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getKeyBelow('1')).toBe(null);
    });

    it('should skip multiple consecutive disabled keys', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
        ['4', 'Item 4'],
        ['5', 'Item 5'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['2', '3', '4']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getKeyBelow('1')).toBe('5');
    });
  });

  describe('getKeyAbove', () => {
    it('should return the previous key when no keys are disabled', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
      ]);
      const collection = createMockCollection(items);
      const delegate = new ListKeyboardDelegate(collection);

      expect(delegate.getKeyAbove('3')).toBe('2');
      expect(delegate.getKeyAbove('2')).toBe('1');
      expect(delegate.getKeyAbove('1')).toBe(null);
    });

    it('should skip disabled keys', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
        ['4', 'Item 4'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['2', '3']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getKeyAbove('4')).toBe('1');
    });

    it('should return null if all remaining keys are disabled', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['1', '2']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getKeyAbove('3')).toBe(null);
    });

    it('should skip multiple consecutive disabled keys', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
        ['4', 'Item 4'],
        ['5', 'Item 5'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['2', '3', '4']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getKeyAbove('5')).toBe('1');
    });
  });

  describe('getFirstKey', () => {
    it('should return the first key when no keys are disabled', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
      ]);
      const collection = createMockCollection(items);
      const delegate = new ListKeyboardDelegate(collection);

      expect(delegate.getFirstKey()).toBe('1');
    });

    it('should skip disabled first key', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['1']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getFirstKey()).toBe('2');
    });

    it('should skip multiple disabled keys at the start', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
        ['4', 'Item 4'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['1', '2', '3']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getFirstKey()).toBe('4');
    });

    it('should return null if all keys are disabled', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['1', '2']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getFirstKey()).toBe(null);
    });
  });

  describe('getLastKey', () => {
    it('should return the last key when no keys are disabled', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
      ]);
      const collection = createMockCollection(items);
      const delegate = new ListKeyboardDelegate(collection);

      expect(delegate.getLastKey()).toBe('3');
    });

    it('should skip disabled last key', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['3']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getLastKey()).toBe('2');
    });

    it('should skip multiple disabled keys at the end', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
        ['3', 'Item 3'],
        ['4', 'Item 4'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['2', '3', '4']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getLastKey()).toBe('1');
    });

    it('should return null if all keys are disabled', () => {
      const items = new Map([
        ['1', 'Item 1'],
        ['2', 'Item 2'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['1', '2']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getLastKey()).toBe(null);
    });
  });

  describe('getKeyForSearch', () => {
    it('should return matching key when no keys are disabled', () => {
      const items = new Map([
        ['1', 'Apple'],
        ['2', 'Banana'],
        ['3', 'Cherry'],
      ]);
      const collection = createMockCollection(items);
      const delegate = new ListKeyboardDelegate(collection);

      expect(delegate.getKeyForSearch('b')).toBe('2');
      expect(delegate.getKeyForSearch('che')).toBe('3');
    });

    it('should skip disabled keys when searching', () => {
      const items = new Map([
        ['1', 'Apple'],
        ['2', 'Banana'],
        ['3', 'Berry'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['2']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getKeyForSearch('b')).toBe('3');
    });

    it('should return null if matching keys are all disabled', () => {
      const items = new Map([
        ['1', 'Apple'],
        ['2', 'Banana'],
        ['3', 'Berry'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['2', '3']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getKeyForSearch('b')).toBe(null);
    });

    it('should wrap around and skip disabled keys', () => {
      const items = new Map([
        ['1', 'Apple'],
        ['2', 'Banana'],
        ['3', 'Cherry'],
        ['4', 'Apricot'],
      ]);
      const collection = createMockCollection(items);
      const disabledKeys = new Set<Key>(['1']);
      const delegate = new ListKeyboardDelegate(collection, disabledKeys);

      expect(delegate.getKeyForSearch('a', '2')).toBe('4');
    });

    it('should be case insensitive', () => {
      const items = new Map([
        ['1', 'Apple'],
        ['2', 'Banana'],
      ]);
      const collection = createMockCollection(items);
      const delegate = new ListKeyboardDelegate(collection);

      expect(delegate.getKeyForSearch('app')).toBe('1');
      expect(delegate.getKeyForSearch('APP')).toBe('1');
      expect(delegate.getKeyForSearch('ApP')).toBe('1');
    });
  });
});

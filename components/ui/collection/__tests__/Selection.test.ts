import { describe, it, expect } from 'vitest';
import {
  Selection,
  createSelection,
  selectionToSet,
} from '../selection/Selection';

describe('Selection', () => {
  describe('constructor', () => {
    it('should create an empty selection', () => {
      const selection = new Selection();

      expect(selection.size).toBe(0);
      expect(selection.anchorKey).toBe(null);
      expect(selection.currentKey).toBe(null);
    });

    it('should create selection from array of keys', () => {
      const selection = new Selection(['a', 'b', 'c']);

      expect(selection.size).toBe(3);
      expect(selection.has('a')).toBe(true);
      expect(selection.has('b')).toBe(true);
      expect(selection.has('c')).toBe(true);
    });

    it('should create selection with anchor and current keys', () => {
      const selection = new Selection(['a', 'b', 'c'], 'a', 'c');

      expect(selection.anchorKey).toBe('a');
      expect(selection.currentKey).toBe('c');
    });

    it('should copy anchor/current from source Selection', () => {
      const original = new Selection(['a', 'b'], 'a', 'b');
      const copy = new Selection(original);

      expect(copy.anchorKey).toBe('a');
      expect(copy.currentKey).toBe('b');
      expect(copy.size).toBe(2);
    });

    it('should allow overriding anchor/current when copying', () => {
      const original = new Selection(['a', 'b'], 'a', 'b');
      const copy = new Selection(original, 'x', 'y');

      expect(copy.anchorKey).toBe('x');
      expect(copy.currentKey).toBe('y');
    });
  });

  describe('clone', () => {
    it('should create an independent copy', () => {
      const original = new Selection(['a', 'b'], 'a', 'b');
      const cloned = original.clone();

      // Modify clone
      cloned.add('c');

      expect(original.has('c')).toBe(false);
      expect(cloned.has('c')).toBe(true);
      expect(cloned.anchorKey).toBe('a');
      expect(cloned.currentKey).toBe('b');
    });
  });

  describe('withRange', () => {
    it('should create copy with new range keys', () => {
      const original = new Selection(['a', 'b'], 'a', 'b');
      const updated = original.withRange('x', 'y');

      expect(updated.anchorKey).toBe('x');
      expect(updated.currentKey).toBe('y');
      expect(updated.has('a')).toBe(true);
      expect(updated.has('b')).toBe(true);
    });
  });

  describe('addKey', () => {
    it('should add key and update range', () => {
      const selection = new Selection(['a']);
      const updated = selection.addKey('b');

      expect(updated.has('a')).toBe(true);
      expect(updated.has('b')).toBe(true);
      expect(updated.anchorKey).toBe('b');
      expect(updated.currentKey).toBe('b');
    });

    it('should not mutate original', () => {
      const original = new Selection(['a']);
      original.addKey('b');

      expect(original.has('b')).toBe(false);
    });
  });

  describe('deleteKey', () => {
    it('should remove key', () => {
      const selection = new Selection(['a', 'b', 'c']);
      const updated = selection.deleteKey('b');

      expect(updated.has('a')).toBe(true);
      expect(updated.has('b')).toBe(false);
      expect(updated.has('c')).toBe(true);
    });

    it('should not mutate original', () => {
      const original = new Selection(['a', 'b']);
      original.deleteKey('b');

      expect(original.has('b')).toBe(true);
    });
  });

  describe('toggleKey', () => {
    it('should add key if not present', () => {
      const selection = new Selection(['a']);
      const updated = selection.toggleKey('b');

      expect(updated.has('b')).toBe(true);
    });

    it('should remove key if present', () => {
      const selection = new Selection(['a', 'b']);
      const updated = selection.toggleKey('b');

      expect(updated.has('b')).toBe(false);
    });
  });

  describe('replaceWith', () => {
    it('should replace all keys with single key', () => {
      const selection = new Selection(['a', 'b', 'c']);
      const updated = selection.replaceWith('x');

      expect(updated.size).toBe(1);
      expect(updated.has('x')).toBe(true);
      expect(updated.has('a')).toBe(false);
      expect(updated.anchorKey).toBe('x');
      expect(updated.currentKey).toBe('x');
    });
  });

  describe('clearAll', () => {
    it('should clear all keys', () => {
      const selection = new Selection(['a', 'b', 'c'], 'a', 'c');
      const cleared = selection.clearAll();

      expect(cleared.size).toBe(0);
      expect(cleared.anchorKey).toBe(null);
      expect(cleared.currentKey).toBe(null);
    });
  });
});

describe('createSelection', () => {
  it('should create empty selection when no keys provided', () => {
    const selection = createSelection();

    expect(selection.size).toBe(0);
  });

  it('should create selection from keys', () => {
    const selection = createSelection(['a', 'b']);

    expect(selection.size).toBe(2);
    expect(selection.has('a')).toBe(true);
  });
});

describe('selectionToSet', () => {
  it('should convert Selection to plain Set', () => {
    const selection = new Selection(['a', 'b'], 'a', 'b');
    const set = selectionToSet(selection);

    expect(set).toBeInstanceOf(Set);
    expect(set.size).toBe(2);
    expect(set.has('a')).toBe(true);
    // Plain Set doesn't have anchor/current
    expect((set as Selection).anchorKey).toBeUndefined();
  });

  it('should work with plain Set input', () => {
    const set = new Set(['a', 'b']);
    const result = selectionToSet(set);

    expect(result.size).toBe(2);
    expect(result.has('a')).toBe(true);
  });
});

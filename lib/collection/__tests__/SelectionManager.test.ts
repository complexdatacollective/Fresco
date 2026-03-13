import { describe, it, expect, vi } from 'vitest';
import { SelectionManager } from '../selection/SelectionManager';
import { Selection } from '../selection/Selection';
import { type SelectionState } from '../selection/types';
import { type Collection, type Key, type Node } from '../types';

type SelectionUpdate = {
  selectedKeys: Selection | 'all';
  focusedKey?: Key | null;
  childFocusStrategy?: 'first' | 'last';
  isFocused?: boolean;
};

function createMockCollection(keys: Key[]): Collection<unknown> {
  const items = new Map<Key, string>();
  for (const key of keys) {
    items.set(key, `Item ${key}`);
  }

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

function createDefaultState(
  overrides: Partial<SelectionState> = {},
): SelectionState {
  return {
    selectedKeys: new Selection(),
    focusedKey: null,
    isFocused: false,
    selectionMode: 'multiple',
    selectionBehavior: 'toggle',
    disabledBehavior: 'selection',
    disabledKeys: new Set(),
    disallowEmptySelection: false,
    childFocusStrategy: 'first',
    ...overrides,
  };
}

describe('SelectionManager', () => {
  describe('queries', () => {
    describe('isSelected', () => {
      it('should return true for selected keys', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a', 'b']),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.isSelected('a')).toBe(true);
        expect(manager.isSelected('b')).toBe(true);
        expect(manager.isSelected('c')).toBe(false);
      });

      it('should return false when selectionMode is none', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({
          selectionMode: 'none',
          selectedKeys: new Selection(['a']),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.isSelected('a')).toBe(false);
      });

      it('should handle "all" selection', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: 'all',
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.isSelected('a')).toBe(true);
        expect(manager.isSelected('b')).toBe(true);
        expect(manager.isSelected('c')).toBe(true);
      });

      it('should exclude disabled keys from "all" selection', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: 'all',
          disabledKeys: new Set(['b']),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.isSelected('a')).toBe(true);
        expect(manager.isSelected('b')).toBe(false);
        expect(manager.isSelected('c')).toBe(true);
      });
    });

    describe('isDisabled', () => {
      it('should return true for disabled keys', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          disabledKeys: new Set(['b']),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.isDisabled('a')).toBe(false);
        expect(manager.isDisabled('b')).toBe(true);
        expect(manager.isDisabled('c')).toBe(false);
      });
    });

    describe('canSelectItem', () => {
      it('should return false for disabled keys', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({
          disabledKeys: new Set(['b']),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.canSelectItem('a')).toBe(true);
        expect(manager.canSelectItem('b')).toBe(false);
      });

      it('should return false when selectionMode is none', () => {
        const collection = createMockCollection(['a']);
        const state = createDefaultState({
          selectionMode: 'none',
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.canSelectItem('a')).toBe(false);
      });
    });

    describe('selectedKeys', () => {
      it('should return Set of selected keys', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a', 'b']),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        const keys = manager.selectedKeys;
        expect(keys.size).toBe(2);
        expect(keys.has('a')).toBe(true);
        expect(keys.has('b')).toBe(true);
      });

      it('should expand "all" to actual keys', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: 'all',
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        const keys = manager.selectedKeys;
        expect(keys.size).toBe(3);
        expect(keys.has('a')).toBe(true);
        expect(keys.has('b')).toBe(true);
        expect(keys.has('c')).toBe(true);
      });
    });

    describe('isEmpty', () => {
      it('should return true when no keys selected', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({
          selectedKeys: new Selection(),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.isEmpty).toBe(true);
      });

      it('should return false when keys are selected', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a']),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.isEmpty).toBe(false);
      });

      it('should return false when "all" is selected', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({
          selectedKeys: 'all',
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.isEmpty).toBe(false);
      });
    });

    describe('isSelectAll', () => {
      it('should return true when all selectable keys are selected', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a', 'b', 'c']),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.isSelectAll).toBe(true);
      });

      it('should return true when "all" is the selection', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: 'all',
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.isSelectAll).toBe(true);
      });

      it('should return false when not all keys are selected', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a', 'b']),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.isSelectAll).toBe(false);
      });

      it('should exclude disabled keys from all calculation', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a', 'c']),
          disabledKeys: new Set(['b']),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        // Only a and c are selectable, and both are selected
        expect(manager.isSelectAll).toBe(true);
      });
    });

    describe('firstSelectedKey / lastSelectedKey', () => {
      it('should return first and last selected keys', () => {
        const collection = createMockCollection(['a', 'b', 'c', 'd']);
        const state = createDefaultState({
          selectedKeys: new Selection(['b', 'c']),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.firstSelectedKey).toBe('b');
        expect(manager.lastSelectedKey).toBe('c');
      });

      it('should return null when nothing selected', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: new Selection(),
        });
        const manager = new SelectionManager(
          collection,
          state,
          () => undefined,
        );

        expect(manager.firstSelectedKey).toBe(null);
        expect(manager.lastSelectedKey).toBe(null);
      });
    });
  });

  describe('mutations', () => {
    describe('toggleSelection', () => {
      it('should select unselected key', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a']),
        });
        const setState = vi.fn();
        const onChange = vi.fn();
        const manager = new SelectionManager(collection, state, setState, {
          onSelectionChange: onChange,
        });

        manager.toggleSelection('b');

        expect(setState).toHaveBeenCalled();
        const newSelection = (setState.mock.calls[0]![0] as SelectionUpdate)
          .selectedKeys;
        expect(newSelection).toBeInstanceOf(Selection);
        expect((newSelection as Selection).has('a')).toBe(true);
        expect((newSelection as Selection).has('b')).toBe(true);
        expect(onChange).toHaveBeenCalled();
      });

      it('should deselect selected key', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a', 'b']),
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.toggleSelection('b');

        const newSelection = (setState.mock.calls[0]![0] as SelectionUpdate)
          .selectedKeys;
        expect(newSelection).toBeInstanceOf(Selection);
        expect((newSelection as Selection).has('a')).toBe(true);
        expect((newSelection as Selection).has('b')).toBe(false);
      });

      it('should not deselect when disallowEmptySelection and only one selected', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a']),
          disallowEmptySelection: true,
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.toggleSelection('a');

        expect(setState).not.toHaveBeenCalled();
      });

      it('should replace selection in single mode', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectionMode: 'single',
          selectedKeys: new Selection(['a']),
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.toggleSelection('b');

        const newSelection = (setState.mock.calls[0]![0] as SelectionUpdate)
          .selectedKeys;
        expect(newSelection).toBeInstanceOf(Selection);
        expect((newSelection as Selection).has('a')).toBe(false);
        expect((newSelection as Selection).has('b')).toBe(true);
        expect((newSelection as Selection).size).toBe(1);
      });

      it('should not toggle disabled keys', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({
          disabledKeys: new Set(['b']),
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.toggleSelection('b');

        expect(setState).not.toHaveBeenCalled();
      });

      it('should do nothing when selectionMode is none', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({
          selectionMode: 'none',
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.toggleSelection('a');

        expect(setState).not.toHaveBeenCalled();
      });
    });

    describe('replaceSelection', () => {
      it('should replace entire selection with single key', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a', 'b']),
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.replaceSelection('c');

        const newSelection = (setState.mock.calls[0]![0] as SelectionUpdate)
          .selectedKeys;
        expect(newSelection).toBeInstanceOf(Selection);
        expect((newSelection as Selection).size).toBe(1);
        expect((newSelection as Selection).has('c')).toBe(true);
      });

      it('should not replace with disabled key', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a']),
          disabledKeys: new Set(['b']),
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.replaceSelection('b');

        const newSelection = (setState.mock.calls[0]![0] as SelectionUpdate)
          .selectedKeys;
        expect(newSelection).toBeInstanceOf(Selection);
        expect((newSelection as Selection).size).toBe(0);
      });

      it('should not clear when disallowEmptySelection', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a']),
          disallowEmptySelection: true,
          disabledKeys: new Set(['b']),
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.replaceSelection('b');

        expect(setState).not.toHaveBeenCalled();
      });
    });

    describe('extendSelection', () => {
      it('should extend selection to new key in multiple mode', () => {
        const collection = createMockCollection(['a', 'b', 'c', 'd', 'e']);
        const state = createDefaultState({
          selectionMode: 'multiple',
          selectedKeys: new Selection(['b'], 'b', 'b'),
          focusedKey: 'b',
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.extendSelection('d');

        const newSelection = (setState.mock.calls[0]![0] as SelectionUpdate)
          .selectedKeys;
        expect(newSelection).toBeInstanceOf(Selection);
        expect((newSelection as Selection).has('b')).toBe(true);
        expect((newSelection as Selection).has('c')).toBe(true);
        expect((newSelection as Selection).has('d')).toBe(true);
      });

      it('should replace in single mode', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectionMode: 'single',
          selectedKeys: new Selection(['a']),
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.extendSelection('c');

        const newSelection = (setState.mock.calls[0]![0] as SelectionUpdate)
          .selectedKeys;
        expect(newSelection).toBeInstanceOf(Selection);
        expect((newSelection as Selection).size).toBe(1);
        expect((newSelection as Selection).has('c')).toBe(true);
      });

      it('should skip disabled keys in range', () => {
        const collection = createMockCollection(['a', 'b', 'c', 'd']);
        const state = createDefaultState({
          selectionMode: 'multiple',
          selectedKeys: new Selection(['a'], 'a', 'a'),
          focusedKey: 'a',
          disabledKeys: new Set(['b']),
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.extendSelection('d');

        const newSelection = (setState.mock.calls[0]![0] as SelectionUpdate)
          .selectedKeys;
        expect(newSelection).toBeInstanceOf(Selection);
        expect((newSelection as Selection).has('a')).toBe(true);
        expect((newSelection as Selection).has('b')).toBe(false);
        expect((newSelection as Selection).has('c')).toBe(true);
        expect((newSelection as Selection).has('d')).toBe(true);
      });
    });

    describe('selectAll', () => {
      it('should select all in multiple mode', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectionMode: 'multiple',
          selectedKeys: new Selection(),
        });
        const setState = vi.fn();
        const onChange = vi.fn();
        const manager = new SelectionManager(collection, state, setState, {
          onSelectionChange: onChange,
        });

        manager.selectAll();

        expect(setState).toHaveBeenCalledWith({ selectedKeys: 'all' });
        expect(onChange).toHaveBeenCalled();
      });

      it('should do nothing in single mode', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectionMode: 'single',
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.selectAll();

        expect(setState).not.toHaveBeenCalled();
      });
    });

    describe('clearSelection', () => {
      it('should clear all selections', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a', 'b']),
          focusedKey: 'a',
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.clearSelection();

        expect(setState).toHaveBeenCalledWith({ focusedKey: null });
        const secondCall = setState.mock.calls[1]![0] as SelectionUpdate;
        expect(secondCall.selectedKeys).toBeInstanceOf(Selection);
        expect((secondCall.selectedKeys as Selection).size).toBe(0);
      });

      it('should not clear when disallowEmptySelection', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({
          selectedKeys: new Selection(['a']),
          disallowEmptySelection: true,
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.clearSelection();

        expect(setState).not.toHaveBeenCalled();
      });
    });

    describe('selectRange', () => {
      it('should select range of keys', () => {
        const collection = createMockCollection(['a', 'b', 'c', 'd', 'e']);
        const state = createDefaultState({
          selectionMode: 'multiple',
          selectedKeys: new Selection(),
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.selectRange('b', 'd');

        const newSelection = (setState.mock.calls[0]![0] as SelectionUpdate)
          .selectedKeys;
        expect(newSelection).toBeInstanceOf(Selection);
        expect((newSelection as Selection).has('a')).toBe(false);
        expect((newSelection as Selection).has('b')).toBe(true);
        expect((newSelection as Selection).has('c')).toBe(true);
        expect((newSelection as Selection).has('d')).toBe(true);
        expect((newSelection as Selection).has('e')).toBe(false);
      });

      it('should do nothing in single mode', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState({
          selectionMode: 'single',
        });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.selectRange('a', 'c');

        expect(setState).not.toHaveBeenCalled();
      });
    });

    describe('setFocusedKey', () => {
      it('should set focused key', () => {
        const collection = createMockCollection(['a', 'b', 'c']);
        const state = createDefaultState();
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.setFocusedKey('b');

        expect(setState).toHaveBeenCalledWith({
          focusedKey: 'b',
          childFocusStrategy: 'first',
        });
      });

      it('should allow setting null', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState({ focusedKey: 'a' });
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.setFocusedKey(null);

        expect(setState).toHaveBeenCalledWith({
          focusedKey: null,
          childFocusStrategy: 'first',
        });
      });

      it('should not set invalid key', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState();
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.setFocusedKey('invalid');

        expect(setState).not.toHaveBeenCalled();
      });
    });

    describe('setFocused', () => {
      it('should set isFocused state', () => {
        const collection = createMockCollection(['a', 'b']);
        const state = createDefaultState();
        const setState = vi.fn();
        const manager = new SelectionManager(collection, state, setState);

        manager.setFocused(true);

        expect(setState).toHaveBeenCalledWith({ isFocused: true });
      });
    });
  });
});

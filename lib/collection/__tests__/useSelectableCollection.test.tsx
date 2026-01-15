import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { useRef } from 'react';
import { useSelectableCollection } from '../keyboard/useSelectableCollection';
import { type SelectionManager } from '../selection/SelectionManager';
import { type KeyboardDelegate } from '../keyboard/types';
import { type Key } from '../types';

// Mock SelectionManager
function createMockSelectionManager(
  overrides: Partial<SelectionManager> = {},
): SelectionManager {
  return {
    selectionMode: 'multiple',
    focusedKey: null,
    isFocused: false,
    selectionBehavior: 'toggle',
    disabledBehavior: 'selection',
    selectedKeys: new Set(),
    isEmpty: true,
    isSelectAll: false,
    firstSelectedKey: null,
    lastSelectedKey: null,
    isSelected: vi.fn(() => false),
    isDisabled: vi.fn(() => false),
    canSelectItem: vi.fn(() => true),
    canFocusItem: vi.fn(() => true),
    setFocusedKey: vi.fn(() => {
      // no-op
    }),
    setFocused: vi.fn(() => {
      // no-op
    }),
    toggleSelection: vi.fn(() => {
      // no-op
    }),
    replaceSelection: vi.fn(() => {
      // no-op
    }),
    extendSelection: vi.fn(() => {
      // no-op
    }),
    selectAll: vi.fn(() => {
      // no-op
    }),
    clearSelection: vi.fn(() => {
      // no-op
    }),
    selectRange: vi.fn(() => {
      // no-op
    }),
    ...overrides,
  } as unknown as SelectionManager;
}

// Mock KeyboardDelegate
function createMockKeyboardDelegate(
  overrides: Partial<KeyboardDelegate> = {},
): KeyboardDelegate {
  return {
    getKeyBelow: vi.fn((key: Key) => {
      const num = parseInt(key as string);
      return isNaN(num) ? null : String(num + 1);
    }),
    getKeyAbove: vi.fn((key: Key) => {
      const num = parseInt(key as string);
      return isNaN(num) || num <= 1 ? null : String(num - 1);
    }),
    getFirstKey: vi.fn(() => '1'),
    getLastKey: vi.fn(() => '5'),
    getKeyForSearch: vi.fn(() => null),
    getKeyLeftOf: vi.fn(() => null),
    getKeyRightOf: vi.fn(() => null),
    ...overrides,
  };
}

// Test component that uses the hook
function TestComponent({
  selectionManager,
  keyboardDelegate,
  disallowEmptySelection = false,
  disallowSelectAll = false,
  disallowTypeAhead = false,
}: {
  selectionManager: SelectionManager;
  keyboardDelegate: KeyboardDelegate;
  disallowEmptySelection?: boolean;
  disallowSelectAll?: boolean;
  disallowTypeAhead?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { collectionProps } = useSelectableCollection({
    selectionManager,
    keyboardDelegate,
    ref,
    disallowEmptySelection,
    disallowSelectAll,
    disallowTypeAhead,
  });

  return (
    <div ref={ref} data-testid="collection" {...collectionProps}>
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </div>
  );
}

describe('useSelectableCollection', () => {
  let selectionManager: SelectionManager;
  let keyboardDelegate: KeyboardDelegate;

  beforeEach(() => {
    selectionManager = createMockSelectionManager();
    keyboardDelegate = createMockKeyboardDelegate();
  });

  describe('keyboard navigation', () => {
    describe('ArrowDown', () => {
      it('should focus first item when no item is focused', () => {
        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: 'ArrowDown' });

        expect(keyboardDelegate.getFirstKey).toHaveBeenCalled();
        expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('1');
      });

      it('should focus next item when item is focused', () => {
        selectionManager = createMockSelectionManager({ focusedKey: '2' });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: 'ArrowDown' });

        expect(keyboardDelegate.getKeyBelow).toHaveBeenCalledWith('2');
        expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('3');
      });

      it('should extend selection with Shift+ArrowDown in multiple mode', () => {
        selectionManager = createMockSelectionManager({
          focusedKey: '2',
          selectionMode: 'multiple',
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), {
          key: 'ArrowDown',
          shiftKey: true,
        });

        expect(selectionManager.extendSelection).toHaveBeenCalledWith('3');
        expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('3');
      });

      it('should not extend selection in single mode', () => {
        selectionManager = createMockSelectionManager({
          focusedKey: '2',
          selectionMode: 'single',
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), {
          key: 'ArrowDown',
          shiftKey: true,
        });

        expect(selectionManager.extendSelection).not.toHaveBeenCalled();
        expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('3');
      });
    });

    describe('ArrowUp', () => {
      it('should focus last item when no item is focused', () => {
        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: 'ArrowUp' });

        expect(keyboardDelegate.getLastKey).toHaveBeenCalled();
        expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('5');
      });

      it('should focus previous item when item is focused', () => {
        selectionManager = createMockSelectionManager({ focusedKey: '3' });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: 'ArrowUp' });

        expect(keyboardDelegate.getKeyAbove).toHaveBeenCalledWith('3');
        expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('2');
      });
    });

    describe('ArrowLeft/ArrowRight', () => {
      it('should navigate left when delegate supports it', () => {
        selectionManager = createMockSelectionManager({ focusedKey: '3' });
        keyboardDelegate = createMockKeyboardDelegate({
          getKeyLeftOf: vi.fn(() => '2'),
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: 'ArrowLeft' });

        expect(keyboardDelegate.getKeyLeftOf).toHaveBeenCalledWith('3');
        expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('2');
      });

      it('should navigate right when delegate supports it', () => {
        selectionManager = createMockSelectionManager({ focusedKey: '2' });
        keyboardDelegate = createMockKeyboardDelegate({
          getKeyRightOf: vi.fn(() => '3'),
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: 'ArrowRight' });

        expect(keyboardDelegate.getKeyRightOf).toHaveBeenCalledWith('2');
        expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('3');
      });
    });

    describe('Home/End', () => {
      it('should focus first item on Home', () => {
        selectionManager = createMockSelectionManager({ focusedKey: '3' });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: 'Home' });

        expect(keyboardDelegate.getFirstKey).toHaveBeenCalled();
        expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('1');
      });

      it('should focus last item on End', () => {
        selectionManager = createMockSelectionManager({ focusedKey: '1' });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: 'End' });

        expect(keyboardDelegate.getLastKey).toHaveBeenCalled();
        expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('5');
      });

      it('should extend selection with Shift+Home', () => {
        selectionManager = createMockSelectionManager({
          focusedKey: '3',
          selectionMode: 'multiple',
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), {
          key: 'Home',
          shiftKey: true,
        });

        expect(selectionManager.extendSelection).toHaveBeenCalledWith('1');
      });

      it('should extend selection with Shift+End', () => {
        selectionManager = createMockSelectionManager({
          focusedKey: '2',
          selectionMode: 'multiple',
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), {
          key: 'End',
          shiftKey: true,
        });

        expect(selectionManager.extendSelection).toHaveBeenCalledWith('5');
      });
    });
  });

  describe('selection', () => {
    describe('Space/Enter', () => {
      it('should toggle selection on Space', () => {
        selectionManager = createMockSelectionManager({ focusedKey: '2' });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: ' ' });

        expect(selectionManager.toggleSelection).toHaveBeenCalledWith('2');
      });

      it('should toggle selection on Enter', () => {
        selectionManager = createMockSelectionManager({ focusedKey: '2' });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: 'Enter' });

        expect(selectionManager.toggleSelection).toHaveBeenCalledWith('2');
      });

      it('should not toggle when selectionMode is none', () => {
        selectionManager = createMockSelectionManager({
          focusedKey: '2',
          selectionMode: 'none',
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: ' ' });

        expect(selectionManager.toggleSelection).not.toHaveBeenCalled();
      });
    });

    describe('Ctrl+A', () => {
      it('should select all on Ctrl+A in multiple mode', () => {
        selectionManager = createMockSelectionManager({
          selectionMode: 'multiple',
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), {
          key: 'a',
          ctrlKey: true,
        });

        expect(selectionManager.selectAll).toHaveBeenCalled();
      });

      it('should select all on Cmd+A (Mac) in multiple mode', () => {
        selectionManager = createMockSelectionManager({
          selectionMode: 'multiple',
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), {
          key: 'a',
          metaKey: true,
        });

        expect(selectionManager.selectAll).toHaveBeenCalled();
      });

      it('should not select all when disallowSelectAll is true', () => {
        selectionManager = createMockSelectionManager({
          selectionMode: 'multiple',
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
            disallowSelectAll={true}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), {
          key: 'a',
          ctrlKey: true,
        });

        expect(selectionManager.selectAll).not.toHaveBeenCalled();
      });

      it('should not select all in single mode', () => {
        selectionManager = createMockSelectionManager({
          selectionMode: 'single',
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), {
          key: 'a',
          ctrlKey: true,
        });

        expect(selectionManager.selectAll).not.toHaveBeenCalled();
      });
    });

    describe('Escape', () => {
      it('should clear selection on Escape', () => {
        selectionManager = createMockSelectionManager({
          focusedKey: '2',
          isEmpty: false,
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: 'Escape' });

        expect(selectionManager.clearSelection).toHaveBeenCalled();
      });

      it('should not clear when disallowEmptySelection is true', () => {
        selectionManager = createMockSelectionManager({
          focusedKey: '2',
          isEmpty: false,
        });

        const { getByTestId } = render(
          <TestComponent
            selectionManager={selectionManager}
            keyboardDelegate={keyboardDelegate}
            disallowEmptySelection={true}
          />,
        );

        fireEvent.keyDown(getByTestId('collection'), { key: 'Escape' });

        expect(selectionManager.clearSelection).not.toHaveBeenCalled();
      });
    });
  });

  describe('type-ahead search', () => {
    it('should search on letter keys', () => {
      keyboardDelegate = createMockKeyboardDelegate({
        getKeyForSearch: vi.fn(() => '3'),
      });

      const { getByTestId } = render(
        <TestComponent
          selectionManager={selectionManager}
          keyboardDelegate={keyboardDelegate}
        />,
      );

      fireEvent.keyDown(getByTestId('collection'), { key: 'c' });

      expect(keyboardDelegate.getKeyForSearch).toHaveBeenCalledWith(
        'c',
        undefined,
      );
      expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('3');
    });

    it('should accumulate search characters', () => {
      keyboardDelegate = createMockKeyboardDelegate({
        getKeyForSearch: vi.fn(() => '3'),
      });

      const { getByTestId } = render(
        <TestComponent
          selectionManager={selectionManager}
          keyboardDelegate={keyboardDelegate}
        />,
      );

      fireEvent.keyDown(getByTestId('collection'), { key: 'c' });
      fireEvent.keyDown(getByTestId('collection'), { key: 'h' });

      expect(keyboardDelegate.getKeyForSearch).toHaveBeenLastCalledWith(
        'ch',
        undefined,
      );
    });

    it('should not search when disallowTypeAhead is true', () => {
      keyboardDelegate = createMockKeyboardDelegate({
        getKeyForSearch: vi.fn(() => '3'),
      });

      const { getByTestId } = render(
        <TestComponent
          selectionManager={selectionManager}
          keyboardDelegate={keyboardDelegate}
          disallowTypeAhead={true}
        />,
      );

      fireEvent.keyDown(getByTestId('collection'), { key: 'c' });

      expect(keyboardDelegate.getKeyForSearch).not.toHaveBeenCalled();
    });

    it('should not search on modified keys', () => {
      keyboardDelegate = createMockKeyboardDelegate({
        getKeyForSearch: vi.fn(() => '3'),
      });

      const { getByTestId } = render(
        <TestComponent
          selectionManager={selectionManager}
          keyboardDelegate={keyboardDelegate}
        />,
      );

      // Ctrl+c should not trigger search
      fireEvent.keyDown(getByTestId('collection'), { key: 'c', ctrlKey: true });

      // Only the regular 'a' handling with ctrl should have triggered
      // But 'c' with ctrl should not trigger search
      expect(keyboardDelegate.getKeyForSearch).not.toHaveBeenCalled();
    });
  });

  describe('focus handling', () => {
    it('should set focused state on focus', () => {
      const { getByTestId } = render(
        <TestComponent
          selectionManager={selectionManager}
          keyboardDelegate={keyboardDelegate}
        />,
      );

      const collection = getByTestId('collection');
      fireEvent.focus(collection, { target: collection });

      expect(selectionManager.setFocused).toHaveBeenCalledWith(true);
    });

    it('should set initial focus to first selected item', () => {
      selectionManager = createMockSelectionManager({
        focusedKey: null,
        firstSelectedKey: '3',
      });

      const { getByTestId } = render(
        <TestComponent
          selectionManager={selectionManager}
          keyboardDelegate={keyboardDelegate}
        />,
      );

      const collection = getByTestId('collection');
      fireEvent.focus(collection, { target: collection });

      expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('3');
    });

    it('should set initial focus to first item if none selected', () => {
      selectionManager = createMockSelectionManager({
        focusedKey: null,
        firstSelectedKey: null,
      });

      const { getByTestId } = render(
        <TestComponent
          selectionManager={selectionManager}
          keyboardDelegate={keyboardDelegate}
        />,
      );

      const collection = getByTestId('collection');
      fireEvent.focus(collection, { target: collection });

      expect(selectionManager.setFocusedKey).toHaveBeenCalledWith('1');
    });

    it('should clear focused state on blur', () => {
      const { getByTestId } = render(
        <TestComponent
          selectionManager={selectionManager}
          keyboardDelegate={keyboardDelegate}
        />,
      );

      const collection = getByTestId('collection');
      fireEvent.blur(collection, { relatedTarget: null });

      expect(selectionManager.setFocused).toHaveBeenCalledWith(false);
    });
  });

  describe('tabIndex', () => {
    it('should always return tabIndex 0 for container', () => {
      const { getByTestId } = render(
        <TestComponent
          selectionManager={selectionManager}
          keyboardDelegate={keyboardDelegate}
        />,
      );

      expect(getByTestId('collection').getAttribute('tabIndex')).toBe('0');
    });

    it('should keep tabIndex 0 even when an item is focused', () => {
      selectionManager = createMockSelectionManager({ focusedKey: '2' });

      const { getByTestId } = render(
        <TestComponent
          selectionManager={selectionManager}
          keyboardDelegate={keyboardDelegate}
        />,
      );

      // Container always has tabIndex 0 - items have tabIndex -1
      expect(getByTestId('collection').getAttribute('tabIndex')).toBe('0');
    });
  });
});

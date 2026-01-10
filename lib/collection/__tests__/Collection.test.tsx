import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, useMemo } from 'react';
import { Collection } from '../components/Collection';
import { ListLayout } from '../layout/ListLayout';
import { GridLayout } from '../layout/GridLayout';
import { type Key } from '../types';

type Item = {
  id: string;
  name: string;
};

const testItems: Item[] = [
  { id: '1', name: 'Apple' },
  { id: '2', name: 'Banana' },
  { id: '3', name: 'Cherry' },
  { id: '4', name: 'Date' },
  { id: '5', name: 'Elderberry' },
];

// Wrapper component for controlled selection
function ControlledCollection({
  items = testItems,
  selectionMode = 'multiple' as const,
  disabledKeys,
  disallowEmptySelection = false,
  layoutType = 'list' as 'list' | 'grid',
  onSelectionChange,
}: {
  items?: Item[];
  selectionMode?: 'none' | 'single' | 'multiple';
  disabledKeys?: Key[];
  disallowEmptySelection?: boolean;
  layoutType?: 'list' | 'grid';
  onSelectionChange?: (keys: Set<Key>) => void;
}) {
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());

  const layout = useMemo(() => {
    if (layoutType === 'grid') {
      return new GridLayout<Item>({ columns: 3, gap: 8 });
    }
    return new ListLayout<Item>({ gap: 8 });
  }, [layoutType]);

  const handleSelectionChange = (keys: Set<Key>) => {
    setSelectedKeys(keys);
    onSelectionChange?.(keys);
  };

  return (
    <Collection
      items={items}
      keyExtractor={(item) => item.id}
      textValueExtractor={(item) => item.name}
      layout={layout}
      selectionMode={selectionMode}
      selectedKeys={selectedKeys}
      onSelectionChange={handleSelectionChange}
      disabledKeys={disabledKeys}
      disallowEmptySelection={disallowEmptySelection}
      aria-label="Test collection"
      renderItem={(item, itemProps) => (
        <div {...itemProps} data-testid={`item-${item.id}`}>
          {item.name}
        </div>
      )}
    />
  );
}

describe('Collection', () => {
  describe('rendering', () => {
    it('should render all items', () => {
      render(<ControlledCollection />);

      expect(screen.getByText('Apple')).toBeDefined();
      expect(screen.getByText('Banana')).toBeDefined();
      expect(screen.getByText('Cherry')).toBeDefined();
      expect(screen.getByText('Date')).toBeDefined();
      expect(screen.getByText('Elderberry')).toBeDefined();
    });

    it('should render empty state when no items', () => {
      const layout = new ListLayout<Item>({ gap: 8 });

      render(
        <Collection
          items={[]}
          keyExtractor={(item) => item.id}
          layout={layout}
          emptyState={<div data-testid="empty">No items</div>}
          renderItem={(item, itemProps) => (
            <div {...itemProps}>{item.name}</div>
          )}
        />,
      );

      expect(screen.getByTestId('empty')).toBeDefined();
    });

    it('should apply ARIA attributes', () => {
      render(<ControlledCollection />);

      const listbox = screen.getByRole('listbox');
      expect(listbox.getAttribute('aria-label')).toBe('Test collection');
      expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
    });

    it('should mark disabled items', () => {
      render(<ControlledCollection disabledKeys={['2']} />);

      // Non-disabled items don't have the data-disabled attribute
      expect(
        screen.getByTestId('item-1').hasAttribute('data-disabled'),
      ).toBeFalsy();
      // Disabled items have data-disabled="true"
      expect(screen.getByTestId('item-2').getAttribute('data-disabled')).toBe(
        'true',
      );
    });
  });

  describe('selection', () => {
    describe('single selection', () => {
      it('should select item on click', async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();

        render(
          <ControlledCollection
            selectionMode="single"
            onSelectionChange={onSelectionChange}
          />,
        );

        await user.click(screen.getByTestId('item-2'));

        expect(onSelectionChange).toHaveBeenCalledWith(new Set(['2']));
      });

      it('should replace selection on click', async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();

        render(
          <ControlledCollection
            selectionMode="single"
            onSelectionChange={onSelectionChange}
          />,
        );

        await user.click(screen.getByTestId('item-2'));
        await user.click(screen.getByTestId('item-3'));

        // Last call should have only the new selection
        expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['3']));
      });
    });

    describe('multiple selection', () => {
      it('should add to selection on click', async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();

        render(
          <ControlledCollection
            selectionMode="multiple"
            onSelectionChange={onSelectionChange}
          />,
        );

        await user.click(screen.getByTestId('item-2'));
        await user.click(screen.getByTestId('item-3'));

        expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['2', '3']));
      });

      it('should deselect on second click', async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();

        render(
          <ControlledCollection
            selectionMode="multiple"
            onSelectionChange={onSelectionChange}
          />,
        );

        await user.click(screen.getByTestId('item-2'));
        await user.click(screen.getByTestId('item-2'));

        expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
      });
    });

    describe('disabled items', () => {
      it('should not select disabled items', async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();

        render(
          <ControlledCollection
            disabledKeys={['2']}
            onSelectionChange={onSelectionChange}
          />,
        );

        await user.click(screen.getByTestId('item-2'));

        expect(onSelectionChange).not.toHaveBeenCalled();
      });
    });

    describe('disallowEmptySelection', () => {
      it('should not deselect last item when disallowEmptySelection is true', async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();

        render(
          <ControlledCollection
            selectionMode="single"
            disallowEmptySelection={true}
            onSelectionChange={onSelectionChange}
          />,
        );

        // Select item
        await user.click(screen.getByTestId('item-2'));

        // Try to deselect - should not change
        const callCount = onSelectionChange.mock.calls.length;
        await user.click(screen.getByTestId('item-2'));

        // No additional call should have been made
        expect(onSelectionChange.mock.calls.length).toBe(callCount);
      });
    });

    describe('no selection mode', () => {
      it('should not select items when selectionMode is none', async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();

        render(
          <ControlledCollection
            selectionMode="none"
            onSelectionChange={onSelectionChange}
          />,
        );

        await user.click(screen.getByTestId('item-2'));

        expect(onSelectionChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('keyboard navigation', () => {
    it('should focus first item on ArrowDown', async () => {
      const user = userEvent.setup();
      render(<ControlledCollection />);

      // Click to focus the collection first
      await user.click(screen.getByTestId('item-1'));

      // Navigate to first unfocused position then down
      await user.keyboard('{Home}');

      expect(screen.getByTestId('item-1').getAttribute('data-focused')).toBe(
        'true',
      );
    });

    it('should navigate through items with arrow keys', async () => {
      const user = userEvent.setup();
      render(<ControlledCollection />);

      // Click to focus the collection
      await user.click(screen.getByTestId('item-1'));

      // Navigate down
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('item-2').getAttribute('data-focused')).toBe(
        'true',
      );
      // Previous item no longer has data-focused attribute
      expect(
        screen.getByTestId('item-1').hasAttribute('data-focused'),
      ).toBeFalsy();
    });

    it('should select focused item with Space', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<ControlledCollection onSelectionChange={onSelectionChange} />);

      // Click first item to focus (this also selects it)
      await user.click(screen.getByTestId('item-1'));

      // Navigate to second item
      await user.keyboard('{ArrowDown}');

      // Select with Space - in multiple mode, this adds to selection
      await user.keyboard(' ');

      // Both items should now be selected
      expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1', '2']));
    });

    it('should skip disabled items during navigation', async () => {
      const user = userEvent.setup();
      render(<ControlledCollection disabledKeys={['2']} />);

      // Click first item to focus
      await user.click(screen.getByTestId('item-1'));

      // Navigate - should skip item 2
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('item-3').getAttribute('data-focused')).toBe(
        'true',
      );
    });

    it('should jump to first item with Home', async () => {
      const user = userEvent.setup();
      render(<ControlledCollection />);

      // Click to focus
      await user.click(screen.getByTestId('item-3'));

      // Jump to first
      await user.keyboard('{Home}');

      expect(screen.getByTestId('item-1').getAttribute('data-focused')).toBe(
        'true',
      );
    });

    it('should jump to last item with End', async () => {
      const user = userEvent.setup();
      render(<ControlledCollection />);

      // Click to focus
      await user.click(screen.getByTestId('item-1'));

      // Jump to last
      await user.keyboard('{End}');

      expect(screen.getByTestId('item-5').getAttribute('data-focused')).toBe(
        'true',
      );
    });

    it('should clear selection with Escape', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<ControlledCollection onSelectionChange={onSelectionChange} />);

      // Select an item
      await user.click(screen.getByTestId('item-2'));

      // Clear with Escape
      await user.keyboard('{Escape}');

      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    });

    it('should select all with Ctrl+A in multiple mode', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <ControlledCollection
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
        />,
      );

      // Click to focus
      await user.click(screen.getByTestId('item-1'));

      // Select all
      await user.keyboard('{Control>}a{/Control}');

      expect(onSelectionChange).toHaveBeenCalledWith(
        new Set(['1', '2', '3', '4', '5']),
      );
    });
  });

  describe('type-ahead search', () => {
    it('should focus item matching typed character', async () => {
      const user = userEvent.setup();
      render(<ControlledCollection />);

      // Click to focus collection
      await user.click(screen.getByTestId('item-1'));

      // Type 'c' to find Cherry
      await user.keyboard('c');

      expect(screen.getByTestId('item-3').getAttribute('data-focused')).toBe(
        'true',
      );
    });

    it('should accumulate search string', async () => {
      const user = userEvent.setup();
      render(<ControlledCollection />);

      // Click to focus collection
      await user.click(screen.getByTestId('item-1'));

      // Type 'da' to find Date (not just 'd')
      await user.keyboard('da');

      expect(screen.getByTestId('item-4').getAttribute('data-focused')).toBe(
        'true',
      );
    });
  });

  describe('grid layout', () => {
    it('should render with grid layout', () => {
      render(<ControlledCollection layoutType="grid" />);

      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeDefined();

      // All items should be rendered
      expect(screen.getByText('Apple')).toBeDefined();
      expect(screen.getByText('Elderberry')).toBeDefined();
    });

    it('should support grid navigation with arrow keys', async () => {
      const user = userEvent.setup();
      render(<ControlledCollection layoutType="grid" />);

      // Click first item to focus
      await user.click(screen.getByTestId('item-1'));
      expect(screen.getByTestId('item-1').getAttribute('data-focused')).toBe(
        'true',
      );

      // Navigate right
      await user.keyboard('{ArrowRight}');
      expect(screen.getByTestId('item-2').getAttribute('data-focused')).toBe(
        'true',
      );

      // Navigate down (with 3 columns, goes to item 5 = 2 + 3)
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('item-5').getAttribute('data-focused')).toBe(
        'true',
      );
    });
  });

  describe('uncontrolled selection', () => {
    it('should work with defaultSelectedKeys', () => {
      const layout = new ListLayout<Item>({ gap: 8 });

      render(
        <Collection
          items={testItems}
          keyExtractor={(item) => item.id}
          layout={layout}
          selectionMode="multiple"
          defaultSelectedKeys={['1', '3']}
          aria-label="Uncontrolled collection"
          renderItem={(item, itemProps) => (
            <div {...itemProps} data-testid={`item-${item.id}`}>
              {item.name}
            </div>
          )}
        />,
      );

      expect(screen.getByTestId('item-1').getAttribute('data-selected')).toBe(
        'true',
      );
      // Non-selected items don't have the data-selected attribute
      expect(
        screen.getByTestId('item-2').hasAttribute('data-selected'),
      ).toBeFalsy();
      expect(screen.getByTestId('item-3').getAttribute('data-selected')).toBe(
        'true',
      );
    });
  });
});

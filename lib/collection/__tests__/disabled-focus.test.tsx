import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Collection } from '../components/Collection';
import { ListLayout } from '../layout';

type TestItem = {
  id: string;
  name: string;
};

const testItems: TestItem[] = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' },
  { id: '4', name: 'Item 4' },
  { id: '5', name: 'Item 5' },
];

const layout = new ListLayout<TestItem>({ gap: 0 });

describe('Collection - Disabled Item Focus', () => {
  it('should skip disabled items when navigating with keyboard', async () => {
    const user = userEvent.setup();

    render(
      <Collection<TestItem>
        items={testItems}
        keyExtractor={(item) => item.id}
        textValueExtractor={(item) => item.name}
        layout={layout}
        selectionMode="single"
        disabledKeys={['2', '4']}
        defaultSelectedKeys={['1']}
        renderItem={(item, state) => (
          <div
            data-testid={`item-${item.id}`}
            data-selected={state.isSelected}
            data-focused={state.isFocused}
            data-disabled={state.isDisabled}
          >
            {item.name}
          </div>
        )}
      />,
    );

    const item1 = screen.getByTestId('item-1');
    const item2 = screen.getByTestId('item-2');
    const item3 = screen.getByTestId('item-3');
    const item4 = screen.getByTestId('item-4');
    const item5 = screen.getByTestId('item-5');

    expect(item2.getAttribute('data-disabled')).toBe('true');
    expect(item4.getAttribute('data-disabled')).toBe('true');

    // Click on item1 to focus it (focus must go through CollectionItem wrapper)
    await user.click(item1);

    await user.keyboard('{ArrowDown}');
    expect(item3.getAttribute('data-focused')).toBe('true');
    expect(item2.getAttribute('data-focused')).toBe('false');

    await user.keyboard('{ArrowDown}');
    expect(item5.getAttribute('data-focused')).toBe('true');
    expect(item4.getAttribute('data-focused')).toBe('false');
  });

  it('should skip disabled items when navigating backwards', async () => {
    const user = userEvent.setup();

    render(
      <Collection<TestItem>
        items={testItems}
        keyExtractor={(item) => item.id}
        textValueExtractor={(item) => item.name}
        layout={layout}
        selectionMode="single"
        disabledKeys={['2', '4']}
        defaultSelectedKeys={['5']}
        renderItem={(item, state) => (
          <div
            data-testid={`item-${item.id}`}
            data-selected={state.isSelected}
            data-focused={state.isFocused}
            data-disabled={state.isDisabled}
          >
            {item.name}
          </div>
        )}
      />,
    );

    const item1 = screen.getByTestId('item-1');
    const item2 = screen.getByTestId('item-2');
    const item3 = screen.getByTestId('item-3');
    const item4 = screen.getByTestId('item-4');
    const item5 = screen.getByTestId('item-5');

    // Click on item5 to focus it (focus must go through CollectionItem wrapper)
    await user.click(item5);

    await user.keyboard('{ArrowUp}');
    expect(item3.getAttribute('data-focused')).toBe('true');
    expect(item4.getAttribute('data-focused')).toBe('false');

    await user.keyboard('{ArrowUp}');
    expect(item1.getAttribute('data-focused')).toBe('true');
    expect(item2.getAttribute('data-focused')).toBe('false');
  });

  it('should navigate to first enabled item when pressing Home', async () => {
    const user = userEvent.setup();

    render(
      <Collection<TestItem>
        items={testItems}
        keyExtractor={(item) => item.id}
        textValueExtractor={(item) => item.name}
        layout={layout}
        selectionMode="single"
        disabledKeys={['1', '2']}
        defaultSelectedKeys={['5']}
        renderItem={(item, state) => (
          <div
            data-testid={`item-${item.id}`}
            data-selected={state.isSelected}
            data-focused={state.isFocused}
            data-disabled={state.isDisabled}
          >
            {item.name}
          </div>
        )}
      />,
    );

    const item1 = screen.getByTestId('item-1');
    const item2 = screen.getByTestId('item-2');
    const item3 = screen.getByTestId('item-3');
    const item5 = screen.getByTestId('item-5');

    // Click on item5 to focus it (focus must go through CollectionItem wrapper)
    await user.click(item5);

    await user.keyboard('{Home}');
    expect(item3.getAttribute('data-focused')).toBe('true');
    expect(item1.getAttribute('data-focused')).toBe('false');
    expect(item2.getAttribute('data-focused')).toBe('false');
  });

  it('should navigate to last enabled item when pressing End', async () => {
    const user = userEvent.setup();

    render(
      <Collection<TestItem>
        items={testItems}
        keyExtractor={(item) => item.id}
        textValueExtractor={(item) => item.name}
        layout={layout}
        selectionMode="single"
        disabledKeys={['4', '5']}
        defaultSelectedKeys={['1']}
        renderItem={(item, state) => (
          <div
            data-testid={`item-${item.id}`}
            data-selected={state.isSelected}
            data-focused={state.isFocused}
            data-disabled={state.isDisabled}
          >
            {item.name}
          </div>
        )}
      />,
    );

    const item1 = screen.getByTestId('item-1');
    const item3 = screen.getByTestId('item-3');
    const item4 = screen.getByTestId('item-4');
    const item5 = screen.getByTestId('item-5');

    // Click on item1 to focus it (focus must go through CollectionItem wrapper)
    await user.click(item1);

    await user.keyboard('{End}');
    expect(item3.getAttribute('data-focused')).toBe('true');
    expect(item4.getAttribute('data-focused')).toBe('false');
    expect(item5.getAttribute('data-focused')).toBe('false');
  });

  it('should not allow clicking on disabled items', async () => {
    const user = userEvent.setup();

    render(
      <Collection<TestItem>
        items={testItems}
        keyExtractor={(item) => item.id}
        textValueExtractor={(item) => item.name}
        layout={layout}
        selectionMode="single"
        disabledKeys={['2']}
        defaultSelectedKeys={['1']}
        renderItem={(item, state) => (
          <div
            data-testid={`item-${item.id}`}
            data-selected={state.isSelected}
            data-disabled={state.isDisabled}
          >
            {item.name}
          </div>
        )}
      />,
    );

    const item1 = screen.getByTestId('item-1');
    const item2 = screen.getByTestId('item-2');

    expect(item1.getAttribute('data-selected')).toBe('true');
    expect(item2.getAttribute('data-disabled')).toBe('true');

    await user.click(item2);

    expect(item1.getAttribute('data-selected')).toBe('true');
    expect(item2.getAttribute('data-selected')).toBe('false');
  });

  it('should skip disabled items when using type-ahead search', async () => {
    const user = userEvent.setup();

    const items: TestItem[] = [
      { id: '1', name: 'Apple' },
      { id: '2', name: 'Apricot' },
      { id: '3', name: 'Banana' },
      { id: '4', name: 'Berry' },
    ];

    render(
      <Collection<TestItem>
        items={items}
        keyExtractor={(item) => item.id}
        textValueExtractor={(item) => item.name}
        layout={layout}
        selectionMode="single"
        disabledKeys={['1']}
        defaultSelectedKeys={['3']}
        renderItem={(item, state) => (
          <div
            data-testid={`item-${item.id}`}
            data-selected={state.isSelected}
            data-focused={state.isFocused}
            data-disabled={state.isDisabled}
          >
            {item.name}
          </div>
        )}
      />,
    );

    const item1 = screen.getByTestId('item-1');
    const item2 = screen.getByTestId('item-2');
    const item3 = screen.getByTestId('item-3');

    // Click on item3 to focus it (focus must go through CollectionItem wrapper)
    await user.click(item3);

    await user.keyboard('a');

    expect(item2.getAttribute('data-focused')).toBe('true');
    expect(item1.getAttribute('data-focused')).toBe('false');
  });

  it('should handle all items disabled scenario gracefully', () => {
    render(
      <Collection<TestItem>
        items={testItems}
        keyExtractor={(item) => item.id}
        textValueExtractor={(item) => item.name}
        layout={layout}
        selectionMode="single"
        disabledKeys={['1', '2', '3', '4', '5']}
        renderItem={(item, state) => (
          <div data-testid={`item-${item.id}`} data-disabled={state.isDisabled}>
            {item.name}
          </div>
        )}
      />,
    );

    testItems.forEach((item) => {
      const element = screen.getByTestId(`item-${item.id}`);
      expect(element.getAttribute('data-disabled')).toBe('true');
    });
  });
});

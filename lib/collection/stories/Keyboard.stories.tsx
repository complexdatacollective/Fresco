import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '~/components/ui/Button';
import Checkbox from '~/lib/form/components/fields/Checkbox';
import { Collection } from '../components/Collection';
import { ListLayout } from '../layout';
import { type Key } from '../types';

const meta: Meta<typeof Collection> = {
  title: 'Systems/Collection/Keyboard Navigation',
  component: Collection,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

type Item = {
  id: string;
  name: string;
  description: string;
};

const sampleItems: Item[] = [
  { id: '1', name: 'Apple', description: 'A red fruit' },
  { id: '2', name: 'Banana', description: 'A yellow fruit' },
  { id: '3', name: 'Cherry', description: 'A small red fruit' },
  { id: '4', name: 'Date', description: 'A sweet fruit' },
  { id: '5', name: 'Elderberry', description: 'A dark purple berry' },
  { id: '6', name: 'Fig', description: 'A soft fruit' },
  { id: '7', name: 'Grape', description: 'A small round fruit' },
  { id: '8', name: 'Honeydew', description: 'A green melon' },
];

export const BasicKeyboardNavigation: Story = {
  render: function BasicKeyboardNavigationRender() {
    const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);
    return (
      <div className="w-96 space-y-2">
        <div className="rounded bg-gray-100 p-4 text-sm">
          <strong>Keyboard Navigation:</strong>
          <ul className="mt-2 space-y-1">
            <li>↑/↓ - Navigate up/down</li>
            <li>Home/End - First/last item</li>
            <li>Type letters - Jump to item</li>
          </ul>
        </div>
        <Collection<Item>
          items={sampleItems}
          keyExtractor={(item) => item.id}
          textValueExtractor={(item) => item.name}
          layout={layout}
          selectionMode="none"
          renderItem={(item, state) => (
            <div
              className={`cursor-pointer rounded border p-3 outline-none ${state.isFocused ? 'focus-styles bg-blue-50' : 'bg-white'} ${state.isSelected ? 'bg-blue-100' : ''}`}
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
            </div>
          )}
          aria-label="Fruit list"
        />
      </div>
    );
  },
};

export const SingleSelection: Story = {
  render: function SingleSelectionRender() {
    const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);
    return (
      <div className="w-96 space-y-2">
        <div className="rounded bg-gray-100 p-4 text-sm">
          <strong>Single Selection:</strong>
          <ul className="mt-2 space-y-1">
            <li>↑/↓ - Navigate</li>
            <li>Space/Enter - Select item</li>
            <li>Esc - Clear selection</li>
          </ul>
        </div>
        <Collection<Item>
          items={sampleItems}
          keyExtractor={(item) => item.id}
          textValueExtractor={(item) => item.name}
          layout={layout}
          selectionMode="single"
          renderItem={(item, state) => (
            <div
              className={`cursor-pointer rounded border p-3 transition-colors outline-none ${state.isFocused ? 'focus-styles' : ''} ${state.isSelected ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              <div className="font-medium">{item.name}</div>
              <div
                className={state.isSelected ? 'text-blue-100' : 'text-gray-500'}
              >
                {item.description}
              </div>
            </div>
          )}
          aria-label="Fruit list with single selection"
        />
      </div>
    );
  },
};

export const MultipleSelection: Story = {
  render: function MultipleSelectionRender() {
    const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);
    return (
      <div className="w-96 space-y-2">
        <div className="rounded bg-gray-100 p-4 text-sm">
          <strong>Multiple Selection:</strong>
          <ul className="mt-2 space-y-1">
            <li>↑/↓ - Navigate</li>
            <li>Space/Enter - Toggle selection</li>
            <li>Shift+↑/↓ - Range selection</li>
            <li>Ctrl+A / Cmd+A - Select all</li>
            <li>Esc - Clear selection</li>
          </ul>
        </div>
        <Collection<Item>
          items={sampleItems}
          keyExtractor={(item) => item.id}
          textValueExtractor={(item) => item.name}
          layout={layout}
          selectionMode="multiple"
          renderItem={(item, state) => (
            <div
              className={`cursor-pointer rounded border p-3 transition-colors outline-none ${state.isSelected ? 'bg-blue-500 text-white' : 'bg-white'} ${state.isFocused ? 'focus-styles' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={state.isSelected}
                  readOnly
                  size="sm"
                  className="pointer-events-none"
                />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div
                    className={`text-sm ${state.isSelected ? 'text-blue-100' : 'text-gray-500'}`}
                  >
                    {item.description}
                  </div>
                </div>
              </div>
            </div>
          )}
          aria-label="Fruit list with multiple selection"
        />
      </div>
    );
  },
};

export const TypeAheadSearch: Story = {
  render: function TypeAheadSearchRender() {
    const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);
    return (
      <div className="w-96 space-y-2">
        <div className="rounded bg-gray-100 p-4 text-sm">
          <strong>Type-Ahead Search:</strong>
          <ul className="mt-2 space-y-1">
            <li>Type &quot;a&quot; - Jump to Apple</li>
            <li>Type &quot;ba&quot; - Jump to Banana</li>
            <li>Type &quot;ch&quot; - Jump to Cherry</li>
            <li>500ms timeout resets search</li>
          </ul>
        </div>
        <Collection<Item>
          items={sampleItems}
          keyExtractor={(item) => item.id}
          textValueExtractor={(item) => item.name}
          layout={layout}
          selectionMode="single"
          renderItem={(item, state) => (
            <div
              className={`cursor-pointer rounded border p-3 transition-colors outline-none ${state.isFocused ? 'focus-styles bg-green-50' : 'bg-white'} ${state.isSelected ? 'bg-green-100' : ''}`}
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
            </div>
          )}
          aria-label="Fruit list with type-ahead search"
        />
      </div>
    );
  },
};

export const ControlledSelection: Story = {
  render: function ControlledSelectionRender() {
    const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set(['2']));
    const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);

    return (
      <div className="w-96 space-y-4">
        <div className="rounded bg-gray-100 p-4">
          <strong>Selected Items:</strong>
          <div className="mt-2 text-sm">
            {selectedKeys.size === 0 ? (
              <span className="text-gray-500">None</span>
            ) : (
              Array.from(selectedKeys).join(', ')
            )}
          </div>
          <Button
            onClick={() => setSelectedKeys(new Set())}
            size="sm"
            variant="outline"
            className="mt-2"
          >
            Clear Selection
          </Button>
        </div>
        <Collection<Item>
          items={sampleItems}
          keyExtractor={(item) => item.id}
          textValueExtractor={(item) => item.name}
          layout={layout}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          renderItem={(item, state) => (
            <div
              className={`cursor-pointer rounded border p-3 transition-colors outline-none ${state.isSelected ? 'bg-blue-500 text-white' : 'bg-white'} ${state.isFocused ? 'focus-styles' : ''}`}
            >
              <div className="font-medium">{item.name}</div>
              <div
                className={`text-sm ${state.isSelected ? 'text-blue-100' : 'text-gray-500'}`}
              >
                {item.description}
              </div>
            </div>
          )}
          aria-label="Controlled selection fruit list"
        />
      </div>
    );
  },
};

export const RangeSelection: Story = {
  render: function RangeSelectionRender() {
    const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);
    return (
      <div className="w-96 space-y-2">
        <div className="rounded bg-gray-100 p-4 text-sm">
          <strong>Range Selection Demo:</strong>
          <ul className="mt-2 space-y-1">
            <li>1. Banana is pre-selected</li>
            <li>2. Hold Shift and press ↓ 3 times</li>
            <li>3. Items from Banana to Elderberry will be selected</li>
            <li>4. Shift+↑ to adjust range upward</li>
          </ul>
        </div>
        <Collection<Item>
          items={sampleItems}
          keyExtractor={(item) => item.id}
          textValueExtractor={(item) => item.name}
          layout={layout}
          selectionMode="multiple"
          defaultSelectedKeys={['2']}
          renderItem={(item, state) => (
            <div
              className={`cursor-pointer rounded border p-3 transition-colors outline-none ${state.isSelected ? 'bg-purple-500 text-white' : 'bg-white'} ${state.isFocused ? 'focus-styles' : ''}`}
            >
              <div className="font-medium">{item.name}</div>
              <div
                className={`text-sm ${state.isSelected ? 'text-purple-100' : 'text-gray-500'}`}
              >
                {item.description}
              </div>
            </div>
          )}
          aria-label="Range selection demo"
        />
      </div>
    );
  },
};

export const SelectAllDemo: Story = {
  render: function SelectAllDemoRender() {
    const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());
    const layout = useMemo(() => new ListLayout<Item>({ gap: 8 }), []);

    return (
      <div className="w-96 space-y-4">
        <div className="rounded bg-gray-100 p-4">
          <div>
            <strong>Selected:</strong> {selectedKeys.size} of{' '}
            {sampleItems.length}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Press Ctrl+A (or Cmd+A on Mac) to select all items
          </div>
        </div>
        <Collection<Item>
          items={sampleItems}
          keyExtractor={(item) => item.id}
          textValueExtractor={(item) => item.name}
          layout={layout}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          renderItem={(item, state) => (
            <div
              className={`cursor-pointer rounded border p-3 transition-colors outline-none ${state.isSelected ? 'bg-indigo-500 text-white' : 'bg-white'} ${state.isFocused ? 'focus-styles' : ''}`}
            >
              <div className="font-medium">{item.name}</div>
              <div
                className={`text-sm ${state.isSelected ? 'text-indigo-100' : 'text-gray-500'}`}
              >
                {item.description}
              </div>
            </div>
          )}
          aria-label="Select all demo"
        />
      </div>
    );
  },
};

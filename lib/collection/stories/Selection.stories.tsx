'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo, useState } from 'react';
import { action } from 'storybook/actions';
import { Button } from '~/components/ui/Button';
import { Collection } from '../components/Collection';
import { ListLayout } from '../layout';
import { type Key } from '../types';

/**
 * The Collection component supports flexible selection modes for interactive lists.
 *
 * ## Selection Modes
 *
 * - **none**: No selection allowed (default)
 * - **single**: Only one item can be selected at a time
 * - **multiple**: Multiple items can be selected using:
 *   - Click to toggle selection
 *   - Ctrl/Cmd+Click to toggle individual items
 *   - Shift+Click to select a range
 *
 * ## Selection State
 *
 * Selection can be controlled (via `selectedKeys` + `onSelectionChange`) or
 * uncontrolled (via `defaultSelectedKeys`).
 *
 * ## Visual States
 *
 * The `state` parameter in `renderItem` provides access to:
 * - `isSelected`: Whether the item is currently selected
 * - `isFocused`: Whether the item has keyboard focus
 * - `isDisabled`: Whether the item is disabled
 */
const meta: Meta<typeof Collection> = {
  title: 'Systems/Collection/Selection',
  component: Collection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A flexible selection system supporting single and multiple selection modes with
keyboard navigation and visual feedback.

### Usage

\`\`\`tsx
import { Collection } from '~/lib/collection';

<Collection
  items={users}
  keyExtractor={(user) => user.id}
  selectionMode="multiple"
  onSelectionChange={(keys) => console.log('Selected:', keys)}
  renderItem={(user, state) => (
    <div data-selected={state.isSelected}>
      {user.name}
    </div>
  )}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data type
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

// Sample data
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Developer',
  },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Designer' },
  {
    id: '3',
    name: 'Carol Williams',
    email: 'carol@example.com',
    role: 'Manager',
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david@example.com',
    role: 'Developer',
  },
  {
    id: '5',
    name: 'Eva Martinez',
    email: 'eva@example.com',
    role: 'QA Engineer',
  },
];

/**
 * Single selection mode allows only one item to be selected at a time.
 * Selecting a new item automatically deselects the previous one.
 */
export const SingleSelection: Story = {
  render: function SingleSelectionRender() {
    const layout = useMemo(() => new ListLayout<User>({ gap: 8 }), []);
    return (
      <Collection<User>
        items={sampleUsers}
        keyExtractor={(user) => user.id}
        textValueExtractor={(user) => user.name}
        layout={layout}
        selectionMode="single"
        defaultSelectedKeys={['2']}
        aria-label="User list with single selection"
        renderItem={(user, state) => (
          <div
            className="border-border bg-card data-[focused=true]:ring-primary data-[selected=true]:border-primary data-[selected=true]:bg-primary/10 rounded-md border p-3 transition-colors data-[focused=true]:ring-2"
            data-selected={state.isSelected}
            data-focused={state.isFocused}
          >
            <div className="font-medium">{user.name}</div>
            <div className="text-muted-foreground text-sm">{user.email}</div>
            <div className="text-muted-foreground mt-1 text-xs">
              {user.role}
            </div>
          </div>
        )}
      />
    );
  },
};

/**
 * Multiple selection mode allows selecting multiple items.
 * - Click to toggle selection
 * - Ctrl/Cmd+Click to toggle individual items
 * - Shift+Click to select a range
 */
export const MultipleSelection: Story = {
  render: function MultipleSelectionRender() {
    const layout = useMemo(() => new ListLayout<User>({ gap: 8 }), []);
    return (
      <Collection<User>
        items={sampleUsers}
        keyExtractor={(user) => user.id}
        textValueExtractor={(user) => user.name}
        layout={layout}
        selectionMode="multiple"
        defaultSelectedKeys={['1', '3']}
        aria-label="User list with multiple selection"
        renderItem={(user, state) => (
          <div
            className="border-border bg-card data-[focused=true]:ring-primary data-[selected=true]:border-primary data-[selected=true]:bg-primary/10 flex items-center gap-3 rounded-md border p-3 transition-colors data-[focused=true]:ring-2"
            data-selected={state.isSelected}
            data-focused={state.isFocused}
          >
            <div
              className="border-primary data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground flex h-5 w-5 items-center justify-center rounded border transition-colors"
              data-selected={state.isSelected}
            >
              {state.isSelected && (
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M10 3L4.5 8.5L2 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">{user.name}</div>
              <div className="text-muted-foreground text-sm">{user.email}</div>
            </div>
            <div className="bg-primary/10 text-primary rounded px-2 py-1 text-xs">
              {user.role}
            </div>
          </div>
        )}
      />
    );
  },
};

/**
 * Controlled selection with external state management.
 * This example shows how to manage selection state externally using React hooks.
 */
export const ControlledSelection: Story = {
  render: function ControlledSelectionRender() {
    const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(
      new Set(['2', '4']),
    );
    const layout = useMemo(() => new ListLayout<User>({ gap: 8 }), []);

    return (
      <div className="space-y-4">
        <div className="border-border rounded-md border p-3">
          <div className="text-sm font-medium">
            Selected: {selectedKeys.size} items
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {selectedKeys.size > 0
              ? Array.from(selectedKeys).join(', ')
              : 'None'}
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

        <Collection<User>
          items={sampleUsers}
          keyExtractor={(user) => user.id}
          textValueExtractor={(user) => user.name}
          layout={layout}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          aria-label="User list with controlled selection"
          renderItem={(user, state) => (
            <div
              className="border-border bg-card data-[focused=true]:ring-primary data-[selected=true]:border-primary data-[selected=true]:bg-primary/10 rounded-md border p-3 transition-colors data-[focused=true]:ring-2"
              data-selected={state.isSelected}
              data-focused={state.isFocused}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {user.email}
                  </div>
                </div>
                {state.isSelected && (
                  <div className="text-primary text-xs font-medium">
                    ✓ SELECTED
                  </div>
                )}
              </div>
            </div>
          )}
        />
      </div>
    );
  },
};

/**
 * Items can be disabled to prevent selection.
 * Disabled items are visually dimmed and cannot be selected or focused.
 */
export const DisabledItems: Story = {
  render: function DisabledItemsRender() {
    const layout = useMemo(() => new ListLayout<User>({ gap: 8 }), []);
    return (
      <Collection<User>
        items={sampleUsers}
        keyExtractor={(user) => user.id}
        textValueExtractor={(user) => user.name}
        layout={layout}
        selectionMode="multiple"
        disabledKeys={['2', '4']}
        defaultSelectedKeys={['1']}
        aria-label="User list with disabled items"
        renderItem={(user, state) => (
          <div
            className="border-border bg-card data-[focused=true]:ring-primary data-[selected=true]:border-primary data-[selected=true]:bg-primary/10 rounded-md border p-3 transition-colors data-[disabled=true]:opacity-50 data-[focused=true]:ring-2"
            data-selected={state.isSelected}
            data-focused={state.isFocused}
            data-disabled={state.isDisabled}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-muted-foreground text-sm">
                  {user.email}
                </div>
              </div>
              {state.isDisabled && (
                <div className="text-muted-foreground text-xs">DISABLED</div>
              )}
            </div>
          </div>
        )}
      />
    );
  },
};

/**
 * When disallowEmptySelection is true, at least one item must remain selected.
 * Attempting to deselect the last selected item will have no effect.
 */
export const DisallowEmptySelection: Story = {
  render: function DisallowEmptySelectionRender() {
    const layout = useMemo(() => new ListLayout<User>({ gap: 8 }), []);
    return (
      <div className="space-y-4">
        <div className="border-border rounded-md border p-3">
          <div className="text-sm font-medium">
            ⚠️ At least one item must be selected
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            Try to deselect the last selected item - it won&apos;t work!
          </div>
        </div>

        <Collection<User>
          items={sampleUsers}
          keyExtractor={(user) => user.id}
          textValueExtractor={(user) => user.name}
          layout={layout}
          selectionMode="multiple"
          disallowEmptySelection={true}
          defaultSelectedKeys={['3']}
          aria-label="User list with required selection"
          renderItem={(user, state) => (
            <div
              className="border-border bg-card data-[focused=true]:ring-primary data-[selected=true]:border-primary data-[selected=true]:bg-primary/10 rounded-md border p-3 transition-colors data-[focused=true]:ring-2"
              data-selected={state.isSelected}
              data-focused={state.isFocused}
            >
              <div className="font-medium">{user.name}</div>
              <div className="text-muted-foreground text-sm">{user.email}</div>
            </div>
          )}
        />
      </div>
    );
  },
};

/**
 * The onSelectionChange callback is called whenever selection changes.
 * This example logs selection changes to the Storybook actions panel.
 */
export const SelectionWithCallback: Story = {
  render: function SelectionWithCallbackRender() {
    const layout = useMemo(() => new ListLayout<User>({ gap: 8 }), []);
    const handleSelectionChange = (keys: Set<Key>) => {
      action('selection-change')({
        count: keys.size,
        keys: Array.from(keys),
        users: sampleUsers.filter((user) => keys.has(user.id)),
      });
    };

    return (
      <div className="space-y-4">
        <div className="border-border rounded-md border p-3">
          <div className="text-sm font-medium">
            📊 Check the Actions panel for selection events
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            View the Storybook Actions panel to see selection changes
          </div>
        </div>

        <Collection<User>
          items={sampleUsers}
          keyExtractor={(user) => user.id}
          textValueExtractor={(user) => user.name}
          layout={layout}
          selectionMode="multiple"
          onSelectionChange={handleSelectionChange}
          aria-label="User list with selection callback"
          renderItem={(user, state) => (
            <div
              className="border-border bg-card data-[focused=true]:ring-primary data-[selected=true]:border-primary data-[selected=true]:bg-primary/10 rounded-md border p-3 transition-colors data-[focused=true]:ring-2"
              data-selected={state.isSelected}
              data-focused={state.isFocused}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {user.email}
                  </div>
                </div>
                {state.isSelected && <div className="text-primary">✓</div>}
              </div>
            </div>
          )}
        />
      </div>
    );
  },
};

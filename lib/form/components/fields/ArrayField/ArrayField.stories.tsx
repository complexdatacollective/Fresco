'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type JSONContent } from '@tiptap/core';
import { useState } from 'react';
import { action } from 'storybook/actions';
import { useArgs } from 'storybook/preview-api';
import { cx } from '~/utils/cva';
import { ArrayField } from './ArrayField';
import {
  type NameGeneratorPrompt,
  PromptEditor,
  PromptItem,
  SimpleEditor,
  SimpleItem,
} from './ItemRenderers';

// Sample data
const sampleItems = [
  { id: '1', label: 'First item' },
  { id: '2', label: 'Second item' },
  { id: '3', label: 'Third item' },
];

type SimpleItem = { id: string; label: string };

const meta: Meta<typeof ArrayField<SimpleItem>> = {
  title: 'Systems/Form/Fields/ArrayField',
  component: ArrayField<SimpleItem>,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    sortable: {
      control: 'boolean',
      description: 'Enable drag-and-drop reordering of items',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    addButtonLabel: {
      control: 'text',
      description: 'Label for the "Add Item" button',
      table: {
        defaultValue: { summary: 'Add Item' },
      },
    },
    emptyStateMessage: {
      control: 'text',
      description: 'Message shown when the list is empty',
      table: {
        defaultValue: {
          summary: 'No items added yet. Click "Add Item" to get started.',
        },
      },
    },
    value: {
      control: 'object',
      description: 'Array of items with id and label properties',
    },
    onChange: {
      action: 'onChange',
      description: 'Callback fired when items are added, removed, or reordered',
    },
    itemComponent: {
      control: false,
      description: 'Custom component for rendering each item',
    },
    editorComponent: {
      control: false,
      description: 'Custom component for editing an item',
    },
    itemTemplate: {
      control: false,
      description: 'Function that returns a new item template',
    },
  },
  args: {
    sortable: false,
    addButtonLabel: 'Add Item',
    emptyStateMessage: 'No items added yet. Click "Add Item" to get started.',
    value: [],
    itemTemplate: () => ({ id: crypto.randomUUID(), label: '' }),
    itemComponent: SimpleItem,
    editorComponent: SimpleEditor,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render(args) {
    const [, updateArgs] = useArgs();

    return (
      <ArrayField
        {...args}
        onChange={(newValue) => {
          updateArgs({ value: newValue });
          action('onChange')(newValue);
        }}
      />
    );
  },
};

export const WithInitialItems: Story = {
  args: {
    value: sampleItems,
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();

    return (
      <ArrayField
        {...args}
        onChange={(newValue) => {
          updateArgs({ value: newValue });
          action('onChange')(newValue);
        }}
      />
    );
  },
};

// Custom item type with additional properties
type TagItem = {
  id: string;
  label: string;
  color: 'node-1' | 'node-2' | 'node-3' | 'node-4' | 'node-5';
};

export const CustomComponents: Story = {
  args: {
    sortable: true,
    addButtonLabel: 'Add Tag',
    emptyStateMessage: 'No tags yet. Create one!',
  },
  render: function Render(args) {
    const [tags, setTags] = useState<TagItem[]>([
      { id: '1', label: 'Important', color: 'node-1' },
      { id: '2', label: 'In Progress', color: 'node-2' },
      { id: '3', label: 'Completed', color: 'node-3' },
    ]);

    const colorClasses = (item: TagItem) =>
      cx([
        'flex w-full items-center gap-2 border px-3 py-1 select-none',
        item.color === 'node-1' && 'border-node-1/30 bg-node-1/10 text-node-1',
        item.color === 'node-2' && 'border-node-2/30 bg-node-2/10 text-node-2',
        item.color === 'node-3' && 'border-node-3/30 bg-node-3/10 text-node-3',
        item.color === 'node-4' && 'border-node-4/30 bg-node-4/10 text-node-4',
        item.color === 'node-5' && 'border-node-5/30 bg-node-5/10 text-node-5',
      ]);

    return (
      <ArrayField<TagItem>
        {...args}
        value={tags}
        onChange={(newValue) => {
          setTags(newValue);
          action('onChange')(newValue);
        }}
        itemTemplate={() => ({
          id: crypto.randomUUID(),
          label: '',
          color: 'node-1',
        })}
        itemComponent={(props) => {
          const classNames = colorClasses(props.item);

          return <SimpleItem {...props} className={classNames} />;
        }}
        editorComponent={(props) => {
          const {} = props;

          return <div>hello</div>;
        }}
      />
    );
  },
};

export const ManyItems: Story = {
  args: {
    sortable: true,
    value: Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      label: `Item number ${i + 1}`,
    })),
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();

    return (
      <ArrayField
        {...args}
        onChange={(newValue) => {
          updateArgs({ value: newValue });
          action('onChange')(newValue);
        }}
      />
    );
  },
};

export const DialogEditor: Story = {
  args: {
    sortable: true,
    addButtonLabel: 'Add Prompt',
    emptyStateMessage: 'No prompts yet. Add your first prompt!',
  },
  parameters: {
    layout: 'centered',
  },
  render: function Render(args) {
    const [prompts, setPrompts] = useState<NameGeneratorPrompt[]>([
      {
        id: '1',
        text: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Generate a list of creative names for a new product.',
                },
              ],
            },
          ],
        } as JSONContent,
      },
    ]);

    return (
      <ArrayField<NameGeneratorPrompt>
        {...args}
        value={prompts}
        onChange={(newValue) => {
          setPrompts(newValue);
          action('onChange')(newValue);
        }}
        itemTemplate={() => ({ id: crypto.randomUUID(), text: {} })}
        itemComponent={PromptItem}
        editorComponent={PromptEditor}
      />
    );
  },
};

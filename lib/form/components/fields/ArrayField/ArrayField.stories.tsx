'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type JSONContent } from '@tiptap/core';
import { GripVertical, PencilIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { action } from 'storybook/actions';
import { useArgs } from 'storybook/preview-api';
import { IconButton } from '~/components/ui/Button';
import { cx } from '~/utils/cva';
import { ArrayField, type ArrayFieldItemProps } from './ArrayField';
import {
  Editor,
  type NameGeneratorPrompt,
  PromptEditor,
  PromptItem,
  SimpleItem,
} from './ItemRenderers';

// Sample data
const sampleItems = [
  { id: '1', label: 'First item' },
  { id: '2', label: 'Second item' },
  { id: '3', label: 'Third item' },
];

type SimpleItemType = { id: string; label: string };

const meta: Meta<typeof ArrayField<SimpleItemType>> = {
  title: 'Systems/Form/Fields/ArrayField',
  component: ArrayField<SimpleItemType>,
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
    confirmDelete: {
      control: 'boolean',
      description: 'Show a confirmation dialog before deleting an item',
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
    confirmDelete: true,
    addButtonLabel: 'Add Item',
    emptyStateMessage: 'No items added yet. Click "Add Item" to get started.',
    value: [],
    itemTemplate: () => ({ id: crypto.randomUUID(), label: '' }),
    itemComponent: SimpleItem,
    editorComponent: Editor,
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

// Custom item component for TagItem - handles its own styling based on color
function TagItemComponent({
  item,
  isSortable,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<TagItem>) {
  const colorClasses = cx([
    'flex w-full items-center gap-2 border px-3 py-1 select-none',
    item.color === 'node-1' && 'border-node-1/30 bg-node-1/10 text-node-1',
    item.color === 'node-2' && 'border-node-2/30 bg-node-2/10 text-node-2',
    item.color === 'node-3' && 'border-node-3/30 bg-node-3/10 text-node-3',
    item.color === 'node-4' && 'border-node-4/30 bg-node-4/10 text-node-4',
    item.color === 'node-5' && 'border-node-5/30 bg-node-5/10 text-node-5',
  ]);

  return (
    <div className={colorClasses}>
      {isSortable && (
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </div>
      )}
      <div className="flex-1">{item.label}</div>
      <div className="ml-auto flex items-center gap-1">
        <IconButton
          size="sm"
          variant="textMuted"
          color="primary"
          onClick={onEdit}
          aria-label="Edit item"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="textMuted"
          color="destructive"
          size="sm"
          onClick={onDelete}
          icon={<X />}
          aria-label="Remove item"
        />
      </div>
    </div>
  );
}

// Simple editor for TagItem - reuses the label editing pattern
function TagEditor({
  item,
  isEditing,
  isNewItem,
  onChange,
  onCancel,
}: {
  item: TagItem | undefined;
  isEditing: boolean;
  isNewItem: boolean;
  onChange: (value: TagItem) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(item?.label ?? '');

  useEffect(() => {
    if (isEditing) {
      setLabel(item?.label ?? '');
    }
  }, [isEditing, item]);

  if (!isEditing) return null;

  return (
    <div className="bg-surface-1 flex w-full flex-col gap-2 border p-4">
      <input
        className="w-full border px-2 py-1"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          onClick={() => onChange({ ...item!, label })}
          disabled={label.trim() === ''}
        >
          {isNewItem ? 'Add' : 'Save'}
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export const CustomComponents: Story = {
  args: {
    sortable: true,
    addButtonLabel: 'Add Tag',
    emptyStateMessage: 'No tags yet. Create one!',
  },
  render: function Render() {
    const [tags, setTags] = useState<TagItem[]>([
      { id: '1', label: 'Important', color: 'node-1' },
      { id: '2', label: 'In Progress', color: 'node-2' },
      { id: '3', label: 'Completed', color: 'node-3' },
    ]);

    return (
      <ArrayField<TagItem>
        sortable
        addButtonLabel="Add Tag"
        emptyStateMessage="No tags yet. Create one!"
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
        itemComponent={TagItemComponent}
        editorComponent={TagEditor}
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
  render: function Render() {
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
        sortable
        addButtonLabel="Add Prompt"
        emptyStateMessage="No prompts yet. Add your first prompt!"
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

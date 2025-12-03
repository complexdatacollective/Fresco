'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type JSONContent } from '@tiptap/core';
import { Reorder, useDragControls } from 'motion/react';
import { useId, useState } from 'react';
import { action } from 'storybook/actions';
import { useArgs } from 'storybook/preview-api';
import { z } from 'zod';
import { surfaceVariants } from '~/components/layout/Surface';
import { MotionButton } from '~/components/ui/Button';
import { Dialog } from '~/lib/dialogs/Dialog';
import { cx } from '~/utils/cva';
import { Field, Form, SubmitButton } from '../..';
import { RichTextEditorField } from '../RichTextEditor';
import { RichTextRenderer } from '../RichTextRenderer';
import { ArrayField, type ArrayFieldItemProps } from './ArrayField';
import { InlineItemRenderer, SimplePreview } from './ItemRenderers';

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
    ItemComponent: {
      control: false,
      description: 'Custom component for rendering each item',
    },
  },
  args: {
    sortable: false,
    addButtonLabel: 'Add Item',
    emptyStateMessage: 'No items added yet. Click "Add Item" to get started.',
    value: [],
    ItemComponent: InlineItemRenderer,
    itemTemplate: () => ({ id: crypto.randomUUID(), label: '' }),
  },
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

export const Sortable: Story = {
  args: {
    value: sampleItems,
    sortable: true,
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

export const CustomLabels: Story = {
  args: {
    addButtonLabel: 'Add New Option',
    emptyStateMessage: 'No options configured yet. Add one to get started!',
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
        sortable={args.sortable}
        addButtonLabel={args.addButtonLabel}
        emptyStateMessage={args.emptyStateMessage}
        value={tags}
        onChange={(newValue) => {
          setTags(newValue);
          action('onChange')(newValue);
        }}
        itemClassName={colorClasses}
        itemTemplate={() => ({
          id: crypto.randomUUID(),
          label: '',
          color: 'node-1',
        })}
        ItemComponent={InlineItemRenderer}
      />
    );
  },
};

export const InForm: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <Form
      onSubmit={async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        action('form-submitted')(data);
        return { success: true };
      }}
    >
      <Field
        name="items"
        label="List Items"
        hint="Add and reorder items in your list"
        component={ArrayField<{ id: string; label: string }>}
        sortable
        addButtonLabel="Add Item"
        itemTemplate={() => ({ id: crypto.randomUUID(), label: '' })}
        ItemComponent={InlineItemRenderer}
        validation={z.array(z.object({ id: z.string(), label: z.string() }))}
      />
      <SubmitButton className="mt-4">Submit</SubmitButton>
    </Form>
  ),
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

// Modal Editor Story - demonstrates using Dialog primitives to recreate the
// current architect prompt editing experience.

// Simplified version of name generator prompt
type NameGeneratorPrompt = {
  id: string;
  text: JSONContent;
};

/**
 * PromptItem is an item component for ArrayField.
 *
 * It uses layoutId to transition between view and edit modes. Edit mode is
 * a modal dialog.
 */

export function SociogramPromptItemRenderer(
  props: ArrayFieldItemProps<NameGeneratorPrompt>,
) {
  const id = useId();
  const {
    onChange,
    onCancel,
    isNewItem,
    isEditing,
    value,
    onEdit,
    isSortable,
    onDelete,
  } = props;

  const controls = useDragControls();

  const handleSubmit = (data: unknown) => {
    onChange({
      ...value,
      ...(data as Record<string, unknown>),
    });
    return { success: true as const };
  };

  return (
    <>
      <Dialog
        title={isNewItem ? 'Edit Prompt' : 'Add New Prompt'}
        description={
          isNewItem ? 'Update this prompt below' : 'Fill in the prompt details'
        }
        open={isEditing}
        closeDialog={onCancel}
        {...(isNewItem ? {} : { layoutId: id })}
        footer={
          <>
            <MotionButton type="button" onClick={onCancel}>
              Cancel
            </MotionButton>
            <SubmitButton form="contact-form" color="primary">
              {isEditing ? 'Save Changes' : 'Add Contact'}
            </SubmitButton>
          </>
        }
      >
        <Form
          id="contact-form"
          onSubmit={handleSubmit}
          className="w-full max-w-full gap-4"
        >
          <Field
            name="text"
            label="Prompt Text"
            hint="The prompt text instructs your participant about the task on this screen."
            component={RichTextEditorField}
            initialValue={value?.text ?? {}}
            required
          />
        </Form>
      </Dialog>
      <Reorder.Item
        layoutId={id}
        value={value}
        dragListener={false}
        dragControls={controls}
        layout
        className={cx(
          surfaceVariants({ level: 2, spacing: 'sm', elevation: 'none' }),
          'flex w-full items-center gap-2 rounded-none border select-none',
        )}
        style={{ borderRadius: 'var(--radius)' }}
      >
        <SimplePreview
          isSortable={isSortable}
          onClickEdit={onEdit}
          onClickDelete={onDelete}
          onDragHandlePointerDown={(e) => controls.start(e)}
        >
          <RichTextRenderer content={value.text} />
        </SimplePreview>
      </Reorder.Item>
    </>
  );
}

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
    const [prompts, setPrompts] = useState<NameGeneratorPrompt[]>([]);

    return (
      <ArrayField<NameGeneratorPrompt>
        sortable={args.sortable}
        addButtonLabel={args.addButtonLabel}
        emptyStateMessage={args.emptyStateMessage}
        value={prompts}
        onChange={(newValue) => {
          setPrompts(newValue);
          action('onChange')(newValue);
        }}
        itemTemplate={() => ({ id: crypto.randomUUID(), text: {} })}
        ItemComponent={SociogramPromptItemRenderer}
      />
    );
  },
};

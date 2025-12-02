'use client';

import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { motion } from 'motion/react';
import { useState } from 'react';
import { action } from 'storybook/actions';
import { useArgs } from 'storybook/preview-api';
import { z } from 'zod';
import CloseButton from '~/components/CloseButton';
import { surfaceVariants } from '~/components/layout/Surface';
import Modal from '~/components/Modal';
import { MotionButton } from '~/components/ui/Button';
import ModalPopup from '~/lib/dialogs/ModalPopup';
import { cx } from '~/utils/cva';
import { Field, Form, SubmitButton } from '..';
import { ArrayField } from './ArrayField';
import { PromptItem } from './ArrayField/ItemComponents';
import { InputField } from './InputField';

// Sample data
const sampleItems = [
  { id: '1', label: 'First item' },
  { id: '2', label: 'Second item' },
  { id: '3', label: 'Third item' },
];

const meta: Meta<typeof ArrayField> = {
  title: 'Form/Fields/ArrayField',
  component: ArrayField,
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
    buttonLabel: {
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
    EditorComponent: {
      control: false,
      description: 'Custom component for the add/edit form',
    },
  },
  args: {
    sortable: false,
    buttonLabel: 'Add Item',
    emptyStateMessage: 'No items added yet. Click "Add Item" to get started.',
    value: [],
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
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
    buttonLabel: 'Add New Option',
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

const tagColors = [
  'node-1',
  'node-2',
  'node-3',
  'node-4',
  'node-5',
] as const satisfies TagItem['color'][];

const TagEditorComponent = ({
  item,
  onSave,
  onCancel,
}: {
  layoutId?: string;
  item?: TagItem;
  onSave: (item: TagItem) => void;
  onCancel: () => void;
}) => {
  const [label, setLabel] = useState(item?.label ?? '');
  const [color, setColor] = useState<TagItem['color']>(item?.color ?? 'node-2');

  return (
    <div
      className="bg-surface-1 flex flex-wrap items-center gap-2 border p-3"
      style={{ borderRadius: 9999 }}
    >
      <InputField
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Tag name..."
        className="flex-1"
        autoFocus
      />
      <div className="flex gap-1">
        {tagColors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={cx(
              'h-6 w-6 border-2',
              color === c ? 'border-text' : 'border-transparent',
              c === 'node-1' && 'bg-node-1',
              c === 'node-2' && 'bg-node-2',
              c === 'node-3' && 'bg-node-3',
              c === 'node-4' && 'bg-node-4',
              c === 'node-5' && 'bg-node-5',
            )}
            aria-label={`Select ${c} color`}
            style={{ borderRadius: 9999 }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <MotionButton
          size="sm"
          onClick={() => {
            if (label.trim()) {
              onSave({
                id: item?.id ?? crypto.randomUUID(),
                label: label.trim(),
                color,
              });
            }
          }}
          color="primary"
        >
          Save
        </MotionButton>
        <MotionButton size="sm" onClick={onCancel}>
          Cancel
        </MotionButton>
      </div>
    </div>
  );
};

export const CustomComponents: Story = {
  args: {
    sortable: true,
    buttonLabel: 'Add Tag',
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
        EditorComponent={TagEditorComponent}
        itemClassName={colorClasses}
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
        component={ArrayField}
        sortable
        buttonLabel="Add Item"
        validation={z.array(z.object({ id: z.string(), label: z.string() }))}
      />
      <SubmitButton className="mt-4" />
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

// Modal Editor Story - demonstrates using Dialog primitives for editing

type ContactItem = {
  id: string;
  label: string;
  email: string;
  phone: string;
  notes: string;
};

const DialogItemComponent = ({ item }: { item: ContactItem }) => {
  return (
    <motion.div layout className="flex-1">
      <h4 className="font-semibold">{item.label}</h4>
      <p className="text-sm opacity-70">{item.email}</p>
    </motion.div>
  );
};

const DialogEditorComponent = ({
  item,
  onSave,
  onCancel,
  layoutId,
}: {
  layoutId?: string;
  item?: ContactItem;
  onSave: (item: ContactItem) => void;
  onCancel: () => void;
}) => {
  const isEditing = !!item;

  const handleSubmit = (data: unknown) => {
    const formData = data as Record<string, unknown>;
    onSave({
      id: item?.id ?? crypto.randomUUID(),
      label: (formData.label as string).trim(),
      email: (formData.email as string).trim(),
      phone: (formData.phone as string).trim(),
      notes: (formData.notes as string).trim(),
    });
    return Promise.resolve({ success: true });
  };

  return (
    <Modal open={true} onOpenChange={(open) => !open && onCancel()}>
      <ModalPopup
        key="dialog-editor"
        layoutId={layoutId ?? 'dialog-editor'}
        className={cx(
          surfaceVariants({ level: 0, spacing: 'md', elevation: 'high' }),
          'w-[calc(100%-var(--spacing)*4)] max-w-2xl @2xl:w-auto @2xl:min-w-xl',
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'flex max-h-[calc(100vh-var(--spacing)*4)]',
          'flex flex-col',
          'rounded-none',
        )}
        style={{ borderRadius: 'var(--radius)' }}
      >
        <BaseDialog.Title
          render={(props) => (
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 {...props} className="text-lg font-semibold">
                {isEditing ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <BaseDialog.Close render={<CloseButton />} />
            </div>
          )}
        />
        <div className="-mx-8 overflow-y-auto px-8 pb-2">
          <BaseDialog.Description
            render={(props) => (
              <p {...props} className="mb-4 text-current/70">
                {isEditing
                  ? 'Update the contact details below'
                  : 'Fill in the contact details'}
              </p>
            )}
          />
          <Form
            id="contact-form"
            onSubmit={handleSubmit}
            className="w-full max-w-full gap-4"
          >
            <Field
              name="label"
              label="Name"
              component={InputField}
              initialValue={item?.label ?? ''}
              placeholder="John Doe"
              required
              validation={z.string().min(1, 'Name is required')}
            />
            <Field
              name="email"
              label="Email"
              component={InputField}
              type="email"
              initialValue={item?.email ?? ''}
              placeholder="john@example.com"
              required
              validation={z.email()}
            />
            <Field
              name="phone"
              label="Phone"
              component={InputField}
              type="tel"
              initialValue={item?.phone ?? ''}
              placeholder="+1 (555) 123-4567"
            />
            <Field
              name="notes"
              label="Notes"
              component={InputField}
              initialValue={item?.notes ?? ''}
              placeholder="Any additional notes..."
            />
          </Form>
        </div>
        <footer className="tablet:flex-row mt-4 flex flex-col justify-end gap-4">
          <MotionButton type="button" onClick={onCancel}>
            Cancel
          </MotionButton>
          <SubmitButton form="contact-form" color="primary">
            {isEditing ? 'Save Changes' : 'Add Contact'}
          </SubmitButton>
        </footer>
      </ModalPopup>
    </Modal>
  );
};

export const DialogEditor: Story = {
  args: {
    sortable: true,
    buttonLabel: 'Add Contact',
    emptyStateMessage: 'No contacts yet. Add your first contact!',
  },
  parameters: {
    layout: 'centered',
  },
  render: function Render(args) {
    const [contacts, setContacts] = useState<ContactItem[]>([
      {
        id: '1',
        label: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1 (555) 123-4567',
        notes: 'Product manager',
      },
      {
        id: '2',
        label: 'Bob Smith',
        email: 'bob@example.com',
        phone: '+1 (555) 987-6543',
        notes: 'Engineering lead',
      },
      {
        id: '3',
        label: 'Carol Williams',
        email: 'carol@example.com',
        phone: '+1 (555) 456-7890',
        notes: 'Designer',
      },
    ]);

    return (
      <ArrayField<ContactItem>
        {...args}
        value={contacts}
        onChange={(newValue) => {
          setContacts(newValue);
          action('onChange')(newValue);
        }}
        ItemComponent={PromptItem}
      />
    );
  },
};

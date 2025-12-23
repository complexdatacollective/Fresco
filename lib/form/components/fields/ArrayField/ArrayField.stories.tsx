'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { GripVertical, PencilIcon, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { action } from 'storybook/actions';
import { useArgs } from 'storybook/preview-api';
import { Button, IconButton, MotionButton } from '~/components/ui/Button';
import { Dialog } from '~/lib/dialogs/Dialog';
import Field from '~/lib/form/components/Field';
import { InputField } from '~/lib/form/components/fields/InputField';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import { FormStoreProvider } from '~/lib/form/store/formStoreProvider';
import { cx } from '~/utils/cva';
import {
  ArrayField,
  type ArrayFieldEditorProps,
  type ArrayFieldItemProps,
} from './ArrayField';

type SimpleItemBase = { id: string; label: string };

/**
 * Simple inline editor for basic label items.
 * Demonstrates the inline editing pattern where the item component
 * handles both display and edit modes using isBeingEdited.
 */
export function SimpleInlineItem({
  item,
  isSortable,
  isBeingEdited,
  isNewItem,
  onChange,
  onCancel,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<SimpleItemBase>) {
  const [label, setLabel] = useState(item?.label ?? '');

  useEffect(() => {
    if (isBeingEdited) {
      setLabel(item?.label ?? '');
    }
  }, [isBeingEdited, item]);

  if (isBeingEdited) {
    return (
      <div className="flex gap-2">
        <InputField
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter a label..."
          minLength={2}
          // Enter key saves
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onChange?.({ id: item.id ?? '', label });
            }
            // Escape key cancels
            if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
          autoFocus
        />
        <div className="flex gap-2">
          <IconButton
            color="primary"
            onClick={() => onChange?.({ id: item.id ?? '', label })}
            disabled={label.trim() === ''}
            icon={<PencilIcon />}
            aria-label={isNewItem ? 'Add item' : 'Save changes'}
          />
          <IconButton
            onClick={onCancel}
            aria-label="Cancel editing"
            icon={<X />}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
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
          variant="text"
          className="text-current"
          color="primary"
          onClick={onEdit}
          aria-label="Edit item"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="text"
          className="text-current"
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

/**
 * Simple item content renderer for basic label items.
 * Renders drag handle, label text, and edit/delete buttons.
 */
export function SimpleItem({
  item,
  isSortable,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<{ id: string; label: string }>) {
  return (
    <div className="border-b-input-contrast/10 flex w-full items-center gap-2 border-b px-2 py-1 last:border-b-0">
      {isSortable && (
        <motion.div
          layout
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </motion.div>
      )}
      <motion.div layout className="flex-1">
        {item.label}
      </motion.div>
      <motion.div layout className="ml-auto flex items-center gap-1">
        <IconButton
          size="sm"
          variant="text"
          className="text-current"
          color="primary"
          onClick={onEdit}
          aria-label="Edit item"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="text"
          className="text-current"
          color="destructive"
          size="sm"
          onClick={onDelete}
          icon={<X />}
          aria-label="Remove item"
        />
      </motion.div>
    </div>
  );
}

// ============================================================================
// Sample Data Types
// ============================================================================

type SimpleItemType = { id: string; label: string };

const sampleItems: SimpleItemType[] = [
  { id: '1', label: 'First item' },
  { id: '2', label: 'Second item' },
  { id: '3', label: 'Third item' },
];

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof ArrayField<SimpleItemType>> = {
  title: 'Systems/Form/Fields/ArrayField',
  component: ArrayField<SimpleItemType>,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
ArrayField manages arrays of items with support for:
- **Inline editing**: Item component handles both display and edit modes
- **Dialog editing**: Separate editorComponent for complex forms in dialogs
- **Drag-and-drop reordering**: Enable with \`sortable\` prop
- **Draft items**: New items are drafts until saved

## Three Editing Patterns

### 1. Inline Editing (No editorComponent)
The \`itemComponent\` handles both display and edit modes using \`isBeingEdited\`.
When editing, call \`onChange\` to save and exit edit mode.

### 2. Dialog Editing (With editorComponent)
The \`itemComponent\` only displays items. A separate \`editorComponent\` receives
\`item\`, \`isNewItem\`, \`onSave\`, and \`onCancel\` to handle editing in a dialog.
### 3. Always editing (always display editing UI)
For simple cases, the \`itemComponent\` can always show editing UI without
needing to call \`onEdit\`. Useful for lists where all items are edited
immediately upon creation.
        `,
      },
    },
  },
  argTypes: {
    sortable: {
      control: 'boolean',
      description: 'Enable drag-and-drop reordering of items',
      table: { defaultValue: { summary: 'false' } },
    },
    confirmDelete: {
      control: 'boolean',
      description: 'Show a confirmation dialog before deleting an item',
      table: { defaultValue: { summary: 'true' } },
    },
    addButtonLabel: {
      control: 'text',
      description: 'Label for the "Add Item" button',
      table: { defaultValue: { summary: 'Add Item' } },
    },
    emptyStateMessage: {
      control: 'text',
      description: 'Message shown when the list is empty',
    },
    itemComponent: {
      control: false,
      description:
        'Component for rendering each item. Receives ArrayFieldItemProps including isBeingEdited for inline editing.',
    },
    editorComponent: {
      control: false,
      description:
        'Optional component for dialog-based editing. Receives ArrayFieldEditorProps with onSave callback.',
    },
    itemTemplate: {
      control: false,
      description: 'Function that returns a new item template when adding',
    },
  },
  args: {
    sortable: false,
    confirmDelete: true,
    addButtonLabel: 'Add Item',
    emptyStateMessage: 'No items added yet. Click "Add Item" to get started.',
  },
  decorators: [
    (Story) => (
      <div className="w-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Stories
// ============================================================================

/**
 * Default ArrayField with inline editing.
 * The SimpleInlineItem component handles both display and edit modes.
 */
export const Default: Story = {
  args: {
    value: [],
    itemTemplate: () => ({ id: crypto.randomUUID(), label: '' }),
    itemComponent: SimpleInlineItem,
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

/**
 * ArrayField with pre-populated items and sorting enabled.
 */
export const WithInitialItems: Story = {
  args: {
    value: sampleItems,
    sortable: true,
    itemTemplate: () => ({ id: crypto.randomUUID(), label: '' }),
    itemComponent: SimpleInlineItem,
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

// ============================================================================
// Inline Editing Pattern
// ============================================================================

type TagItem = {
  id: string;
  label: string;
  color: 'node-1' | 'node-2' | 'node-3' | 'node-4' | 'node-5';
};

const TAG_COLORS: Record<TagItem['color'], string> = {
  'node-1': 'var(--color-node-1)',
  'node-2': 'var(--color-node-2)',
  'node-3': 'var(--color-node-3)',
  'node-4': 'var(--color-node-4)',
  'node-5': 'var(--color-node-5)',
};

/**
 * Inline editing item component for TagItem.
 * Handles both display and edit modes within the same component.
 */
function TagInlineItem({
  item,
  isSortable,
  isBeingEdited,
  isNewItem,
  onChange,
  onCancel,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<TagItem>) {
  const [label, setLabel] = useState(item?.label ?? '');
  const [color, setColor] = useState<TagItem['color']>(item?.color ?? 'node-1');

  useEffect(() => {
    if (isBeingEdited) {
      setLabel(item?.label ?? '');
      setColor(item?.color ?? 'node-1');
    }
  }, [isBeingEdited, item]);

  // Edit mode
  if (isBeingEdited) {
    return (
      <motion.div
        key="edit-mode"
        layout
        className={cx('flex w-full flex-col gap-4 p-4')}
      >
        <motion.div layout className="flex flex-col gap-2">
          <label className="text-sm font-medium">Label</label>
          <InputField
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter tag label"
          />
        </motion.div>
        <motion.div layout className="flex flex-col gap-2">
          <label className="text-sm font-medium">Color</label>
          <motion.div layout className="flex gap-2">
            {(Object.keys(TAG_COLORS) as TagItem['color'][]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: TAG_COLORS[c] }}
                className={cx(
                  'h-8 w-8 rounded-full transition-all',
                  color === c
                    ? 'ring-primary ring-2 ring-offset-2'
                    : 'opacity-50 hover:opacity-100',
                )}
                aria-label={c}
              />
            ))}
          </motion.div>
        </motion.div>
        <motion.div layout className="flex gap-2">
          <Button
            color="primary"
            size="sm"
            onClick={() => onChange?.({ id: item.id ?? '', label, color })}
            disabled={label.trim() === ''}
          >
            {isNewItem ? 'Add' : 'Save'}
          </Button>
          <Button size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="view-mode"
      layout
      className="flex w-full items-center gap-2"
    >
      {isSortable && (
        <motion.div
          layout
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </motion.div>
      )}
      <motion.div layout className="flex-1">
        {item.label}
      </motion.div>
      <motion.div layout className="ml-auto flex items-center gap-1">
        <IconButton
          size="sm"
          variant="text"
          className="text-current"
          color="primary"
          onClick={onEdit}
          aria-label="Edit item"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="text"
          className="text-current"
          color="destructive"
          size="sm"
          onClick={onDelete}
          icon={<X />}
          aria-label="Remove item"
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Inline editing pattern demonstration.
 * The TagInlineItem component handles both display and edit modes.
 * No separate editorComponent is needed.
 */
export const InlineEditing: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Inline Editing Pattern**

The item component handles both display and edit modes:
- Check \`isBeingEdited\` to determine which UI to render
- In edit mode, call \`onChange(updatedItem)\` to save
- Call \`onCancel()\` to cancel and discard changes
- Use \`isNewItem\` to show "Add" vs "Save" button labels
        `,
      },
    },
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
        confirmDelete={false}
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
        itemComponent={TagInlineItem}
        itemClasses={(item, isBeingEdited) =>
          cx([
            'flex w-full items-center gap-2 border px-3 py-2 select-none',
            item.color === 'node-1' &&
              'border-node-1/30 bg-node-1/10 text-node-1',
            item.color === 'node-2' &&
              'border-node-2/30 bg-node-2/10 text-node-2',
            item.color === 'node-3' &&
              'border-node-3/30 bg-node-3/10 text-node-3',
            item.color === 'node-4' &&
              'border-node-4/30 bg-node-4/10 text-node-4',
            item.color === 'node-5' &&
              'border-node-5/30 bg-node-5/10 text-node-5',
            isBeingEdited &&
              'bg-surface-2 text-surface-2-contrast border-inherit',
          ])
        }
      />
    );
  },
};

// ============================================================================
// Dialog Editing Pattern
// ============================================================================

type ContactItem = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

/**
 * Display-only item component for contacts.
 * Editing is handled by the separate dialog editor.
 */
function ContactDisplayItem({
  item,
  isSortable,
  isBeingEdited,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<ContactItem>) {
  // Hide when being edited (dialog takes over) or when it's a new draft
  if (isBeingEdited || item._draft) {
    return null;
  }

  return (
    <motion.div
      layoutId={item._internalId}
      className="border-b-input-contrast/10 flex w-full items-center gap-3 border-b px-2 py-2 last:border-b-0"
    >
      {isSortable && (
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <span className="font-medium">{item.name}</span>
        <span className="text-sm text-current/70">{item.email}</span>
        {item.phone && (
          <span className="text-sm text-current/50">{item.phone}</span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <IconButton
          size="sm"
          variant="text"
          className="text-current"
          color="primary"
          onClick={onEdit}
          aria-label="Edit contact"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="text"
          className="text-current"
          color="destructive"
          size="sm"
          onClick={onDelete}
          icon={<X />}
          aria-label="Remove contact"
        />
      </div>
    </motion.div>
  );
}

// Simulated list of "existing" emails on the server
const EXISTING_EMAILS = [
  'john@example.com',
  'jane@example.com',
  'admin@example.com',
  'test@example.com',
];

/**
 * Simulates checking if an email already exists on the server.
 * Returns true if the email is already taken.
 */
async function checkEmailExists(
  email: string,
  currentItemEmail?: string,
): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // If we're editing and the email hasn't changed, it's valid
  if (
    currentItemEmail &&
    email.toLowerCase() === currentItemEmail.toLowerCase()
  ) {
    return false;
  }

  // Check against "existing" emails
  return EXISTING_EMAILS.some(
    (existing) => existing.toLowerCase() === email.toLowerCase(),
  );
}

/**
 * Dialog editor for contacts.
 * Demonstrates async validation - checking if email already exists on server.
 */
function ContactDialogEditor({
  item,
  isNewItem,
  onSave,
  onCancel,
}: ArrayFieldEditorProps<ContactItem>) {
  const formId = `contact-form-${item?._internalId ?? 'new'}`;

  return (
    <FormStoreProvider>
      <Dialog
        title={isNewItem ? 'Add Contact' : 'Edit Contact'}
        description="Enter the contact details below"
        open={!!item}
        closeDialog={onCancel}
        layoutId={isNewItem ? undefined : item?._internalId}
        footer={
          <>
            <MotionButton type="button" onClick={onCancel}>
              Cancel
            </MotionButton>
            <SubmitButton form={formId} color="primary">
              {isNewItem ? 'Add Contact' : 'Save Changes'}
            </SubmitButton>
          </>
        }
      >
        <FormWithoutProvider
          id={formId}
          onSubmit={async (data: unknown) => {
            const formData = data as Record<string, string>;
            const email = formData.email ?? '';

            if (isNewItem) {
              // Check if email already exists on server
              const emailExists = await checkEmailExists(email, item?.email);

              if (emailExists) {
                return {
                  success: false,
                  fieldErrors: {
                    email: ['This email address is already in use'],
                  },
                };
              }
            }

            onSave({
              id: item?.id ?? crypto.randomUUID(),
              name: formData.name ?? '',
              email,
              phone: formData.phone,
            });

            return { success: true };
          }}
        >
          <Field
            name="name"
            label="Name"
            hint="Full name of the contact"
            component={InputField}
            initialValue={item?.name}
            required
          />
          <Field
            name="email"
            label="Email"
            hint="Try 'admin@example.com' or 'test@example.com' to see validation error"
            component={InputField}
            type="email"
            initialValue={item?.email}
            required
          />
          <Field
            name="phone"
            label="Phone"
            hint="Optional phone number"
            component={InputField}
            type="tel"
            initialValue={item?.phone}
          />
        </FormWithoutProvider>
      </Dialog>
    </FormStoreProvider>
  );
}

/**
 * Dialog editing pattern demonstration.
 * Uses a separate editorComponent for complex form editing in a dialog.
 */
export const DialogEditing: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Dialog Editing Pattern**

For complex forms, use a separate \`editorComponent\`:
- \`itemComponent\` only handles display (return null when \`isBeingEdited\` or \`item._draft\`)
- \`editorComponent\` receives \`item\`, \`isNewItem\`, \`onSave\`, and \`onCancel\`
- Check \`!!item\` to determine if the dialog should be open
- Call \`onSave(updatedItem)\` to save and close
- Use \`layoutId\` for smooth animations between item and dialog
        `,
      },
    },
  },
  render: function Render() {
    const [contacts, setContacts] = useState<ContactItem[]>([
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
      },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ]);

    return (
      <ArrayField<ContactItem>
        sortable
        addButtonLabel="Add Contact"
        emptyStateMessage="No contacts yet. Add your first contact!"
        value={contacts}
        onChange={(newValue) => {
          setContacts(newValue);
          action('onChange')(newValue);
        }}
        itemTemplate={() => ({
          id: crypto.randomUUID(),
          name: '',
          email: '',
        })}
        itemComponent={ContactDisplayItem}
        editorComponent={ContactDialogEditor}
      />
    );
  },
};

// ============================================================================
// Display-Only (No Editing)
// ============================================================================

/**
 * Display-only item component without edit functionality.
 */
function DisplayOnlyItem({
  item,
  isSortable,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<SimpleItemType>) {
  return (
    <div className="border-b-input-contrast/10 flex w-full items-center gap-2 border-b px-2 py-1 last:border-b-0">
      {isSortable && (
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </div>
      )}
      <div className="flex-1">{item.label}</div>
      <IconButton
        variant="text"
        className="text-current"
        color="destructive"
        size="sm"
        onClick={onDelete}
        icon={<X />}
        aria-label="Remove item"
      />
    </div>
  );
}

/**
 * Simplified ArrayField without editing.
 * Items can only be added (with template values) and removed.
 */
export const NoEditing: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**No Editing Pattern**

For simple lists where items are added with default values:
- \`itemComponent\` only shows display UI and delete button
- Don't call \`onEdit\` - items are created fully-formed from template
- Useful for lists where items don't need customization
        `,
      },
    },
  },
  render: function Render() {
    const [items, setItems] = useState<SimpleItemType[]>([
      { id: '1', label: 'Pre-defined item 1' },
      { id: '2', label: 'Pre-defined item 2' },
    ]);

    let counter = items.length;

    return (
      <ArrayField<SimpleItemType>
        sortable
        confirmDelete={false}
        addButtonLabel="Add Pre-defined Item"
        emptyStateMessage="No items yet."
        value={items}
        onChange={(newValue) => {
          setItems(newValue);
          action('onChange')(newValue);
        }}
        itemTemplate={() => ({
          id: crypto.randomUUID(),
          label: `Pre-defined item ${++counter}`,
        })}
        itemComponent={DisplayOnlyItem}
      />
    );
  },
};

/**
 * Always editing - used for situations such as configuration lists.
 * The item component always shows editing UI without needing to call onEdit.
 */

type ConfigItem = { label: string };

/**
 * Item component for always-editing pattern.
 * Uses onUpdate to directly update item data without affecting editing state.
 */
function AlwaysEditingItem({
  item,
  isSortable,
  onDelete,
  onUpdate,
  dragControls,
}: ArrayFieldItemProps<ConfigItem>) {
  return (
    <div className="flex items-center gap-2">
      {isSortable && (
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </div>
      )}
      <InputField
        value={item.label ?? ''}
        onChange={(e) => onUpdate({ label: e.target.value })}
        placeholder="Enter a label..."
        className="flex-1"
      />
      <IconButton
        variant="text"
        className="text-current"
        color="destructive"
        size="sm"
        onClick={onDelete}
        icon={<X />}
        aria-label="Remove item"
      />
    </div>
  );
}

export const AlwaysEditing: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Always Editing Pattern**

For lists where all items are edited immediately:
- Set \`immediateAdd={true}\` to add items directly without entering editing mode
- \`itemComponent\` always shows editing UI
- Uses \`onUpdate\` to update item data without exiting editing mode
- No need to call \`onEdit\` or manage editing state
- Uses internal \`_internalId\` for tracking (no custom id field needed)

The key difference from inline editing:
- \`onChange\` saves and exits editing mode
- \`onUpdate\` updates the item data without affecting editing state
        `,
      },
    },
  },
  render: function Render() {
    const [items, setItems] = useState<ConfigItem[]>([
      { label: 'Config item 1' },
      { label: 'Config item 2' },
    ]);

    return (
      <ArrayField<ConfigItem>
        sortable
        confirmDelete={false}
        immediateAdd
        addButtonLabel="Add Config Item"
        emptyStateMessage="No configuration items yet."
        value={items}
        onChange={(newValue) => {
          setItems(newValue);
          action('onChange')(newValue);
        }}
        itemTemplate={() => ({ label: '' })}
        itemComponent={AlwaysEditingItem}
      />
    );
  },
};

// ============================================================================
// Many Items
// ============================================================================

/**
 * Performance test with many items.
 */
export const ManyItems: Story = {
  args: {
    sortable: true,
    value: Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      label: `Item number ${i + 1}`,
    })),
    itemTemplate: () => ({ id: crypto.randomUUID(), label: '' }),
    itemComponent: SimpleInlineItem,
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

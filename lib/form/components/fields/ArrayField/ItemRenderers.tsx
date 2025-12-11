import { type JSONContent } from '@tiptap/core';
import { GripVertical, PencilIcon, X } from 'lucide-react';
import { type DragControls, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import Button, { IconButton, MotionButton } from '~/components/ui/Button';
import { Dialog } from '~/lib/dialogs/Dialog';
import { cx } from '~/utils/cva';
import Field from '../../Field';
import Form from '../../Form';
import SubmitButton from '../../SubmitButton';
import { InputField } from '../InputField';
import { RichTextEditorField } from '../RichTextEditor';
import { RichTextRenderer } from '../RichTextRenderer';
import { type ArrayFieldEditorProps } from './ArrayField';

type SimpleItemBase = { id: string; label: string };

export function SimpleEditor({
  item,
  isEditing,
  isNewItem,
  onChange,
  onCancel,
}) {
  const [label, setLabel] = useState(item?.label ?? '');

  useEffect(() => {
    if (isEditing) {
      setLabel(item?.label ?? '');
    }
  }, [isEditing, item]);

  if (!isEditing) {
    return null;
  }

  return (
    <div className="w-full px-2 py-4">
      <InputField value={label} onChange={(e) => setLabel(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <Button
          color="primary"
          onClick={() => onChange({ ...item!, label })}
          disabled={label.trim() === ''}
          icon={<PencilIcon />}
          size="sm"
        >
          {isNewItem ? 'Add' : 'Save'}
        </Button>
        <Button
          onClick={onCancel}
          aria-label="Cancel editing"
          icon={<X />}
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function ItemShell({
  children,
  dragControls,
  isSortable,
  className,
  onEdit,
  onDelete,
  disabled,
}: {
  children: React.ReactNode;
  dragControls: DragControls;
  isSortable: boolean;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className={cx(
        'flex w-full items-center gap-2 px-4 py-2 select-none',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {isSortable && (
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </div>
      )}
      {children}
      {(onDelete ?? onEdit) && (
        <div className="ml-auto flex items-center gap-1">
          {onEdit && (
            <IconButton
              size="sm"
              variant="textMuted"
              color="primary"
              onClick={onEdit}
              aria-label="Edit item"
              icon={<PencilIcon />}
            />
          )}
          {onDelete && (
            <IconButton
              variant="textMuted"
              color="destructive"
              size="sm"
              onClick={onDelete}
              icon={<X />}
              aria-label="Remove item"
            />
          )}
        </div>
      )}
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
}: ArrayFieldEditorProps<SimpleItemBase>) {
  return (
    <ItemShell
      dragControls={dragControls}
      isSortable={isSortable}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {item.label}
    </ItemShell>
  );
}

// Modal Editor Story - demonstrates using Dialog primitives to recreate the
// current architect prompt editing experience.

// Simplified version of name generator prompt
export type NameGeneratorPrompt = {
  id: string;
  text: JSONContent;
};

/**
 * Item content renderer for rich text prompt items.
 * Renders drag handle, rich text content, and edit/delete buttons.
 */
export function PromptItem({
  item,
  isSortable,
  onEdit,
  onDelete,
  dragControls,
}) {
  return (
    <motion.div
      layoutId={item.id}
      className="flex w-full items-center gap-2 px-2 py-1"
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
        <RichTextRenderer content={item.text} />
      </motion.div>
      <motion.div
        layout
        className="ml-auto flex items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
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
      </motion.div>
    </motion.div>
  );
}

export function PromptEditor({
  isEditing,
  isNewItem,
  onCancel,
  onChange,
  item,
}) {
  const handleSubmit = (data: unknown) => {
    onChange(data as NameGeneratorPrompt);

    return { success: true as const };
  };

  return (
    <Dialog
      title="Edit Prompt"
      description="Update this prompt below"
      open={isEditing}
      closeDialog={onCancel}
      layoutId={isNewItem ? undefined : item?.id}
      footer={
        <>
          <MotionButton type="button" onClick={onCancel}>
            Cancel
          </MotionButton>
          <SubmitButton form="contact-form" color="primary">
            Save Changes
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
          initialValue={item?.text ?? {}}
          required
        />
      </Form>
    </Dialog>
  );
}

/**
 * TestComponent1 - inline editor
 * TestComponent2 - no editor, just inputs
 * TestComponent3 - modal editor
 */

export function TestComponent1({
  item,
  isSortable,
  onEdit,
  onDelete,
  isEditing,
  isNewItem,
  onChange,
  onCancel,
  dragControls,
}: ArrayFieldEditorProps) {
  if (isEditing) {
    return (
      <SimpleEditor
        item={item}
        isEditing={isEditing}
        isNewItem={isNewItem}
        onChange={onChange}
        onCancel={onCancel}
      />
    );
  }

  return (
    <SimpleItem
      dragControls={dragControls}
      isSortable={isSortable}
      item={item}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

// Renders a div with inputs that directly update the item
export function TestComponent2({
  item,
  isSortable,
  onEdit,
  onDelete,
  isEditing,
  isNewItem,
  onChange,
  onCancel,
  dragControls,
}: ArrayFieldEditorProps) {
  return (
    <ItemShell dragControls={dragControls} isSortable={isSortable}>
      <input
        type="text"
        value={item.label as string}
        onChange={(e) => onChange({ ...item, label: e.target.value } as any)}
      />
      <MotionButton size="sm" onClick={onDelete}>
        Delete
      </MotionButton>
    </ItemShell>
  );
}

// TestComponent3 uses the PromptItem and PromptEditor defined above
export function TestComponent3({
  item,
  isSortable,
  onEdit,
  onDelete,
  isEditing,
  isNewItem,
  onChange,
  onCancel,
  dragControls,
}: ArrayFieldEditorProps<NameGeneratorPrompt>) {
  if (isEditing) {
    return (
      <PromptEditor
        isEditing={isEditing}
        isNewItem={isNewItem}
        onCancel={onCancel}
        onChange={onChange}
        item={item}
      />
    );
  }

  return (
    <PromptItem
      dragControls={dragControls}
      isSortable={isSortable}
      item={item}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

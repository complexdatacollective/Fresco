import { type nameGeneratorPromptSchema } from '@codaco/protocol-validation';
import { GripVertical, PencilIcon, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type z from 'zod';
import { surfaceVariants } from '~/components/layout/Surface';
import Button, { IconButton, MotionButton } from '~/components/ui/Button';
import { Dialog } from '~/lib/dialogs/Dialog';
import { cx } from '~/utils/cva';
import Field from '../../Field';
import Form from '../../Form';
import SubmitButton from '../../SubmitButton';
import { InputField } from '../InputField';
import {
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
      <motion.div
        layout
        className={cx(
          surfaceVariants({ level: 2, spacing: 'sm', elevation: 'none' }),
          'flex w-full flex-col gap-2 border p-4',
        )}
      >
        <InputField value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className="mt-2 flex gap-2">
          <Button
            color="primary"
            onClick={() => onChange?.({ id: item.id ?? '', label })}
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
      </motion.div>
    );
  }

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

// Modal Editor Story - demonstrates using Dialog primitives to recreate the
// current architect prompt editing experience.

// Simplified version of name generator prompt
export type NameGeneratorPrompt = z.infer<typeof nameGeneratorPromptSchema>;

/**
 * Item content renderer for rich text prompt items.
 * Renders drag handle, rich text content, and edit/delete buttons.
 */
export function PromptItem({
  item,
  isSortable,
  isBeingEdited,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<NameGeneratorPrompt>) {
  // Hide item when being edited (layoutId transfers to editor) or when it's a new draft
  if (isBeingEdited || item._draft) {
    return null;
  }

  return (
    <motion.div
      layoutId={item.id}
      className="border-b-input-contrast/10 flex w-full items-center gap-2 border-b px-2 py-1 last:border-b-0"
    >
      {isSortable && (
        <motion.div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </motion.div>
      )}
      <motion.div className="flex-1">{item.text}</motion.div>
      <motion.div
        className="ml-auto flex items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
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
 * Dialog-based editor for rich text prompt items.
 * Demonstrates the dialog editing pattern where a separate editorComponent
 * handles editing in a modal dialog.
 */
export function PromptEditor({
  isNewItem,
  onCancel,
  onSave,
  item,
}: ArrayFieldEditorProps<NameGeneratorPrompt>) {
  const handleSubmit = (data: unknown) => {
    onSave(data as NameGeneratorPrompt);

    return { success: true as const };
  };

  return (
    <Dialog
      title={isNewItem ? 'Add Prompt' : 'Edit Prompt'}
      description="Configure the prompt text shown to participants"
      open={!!item}
      closeDialog={onCancel}
      layoutId={isNewItem ? undefined : item?.id}
      footer={
        <>
          <MotionButton type="button" onClick={onCancel}>
            Cancel
          </MotionButton>
          <SubmitButton form="prompt-editor-form" color="primary">
            {isNewItem ? 'Add Prompt' : 'Save Changes'}
          </SubmitButton>
        </>
      }
    >
      <Form
        id="prompt-editor-form"
        onSubmit={handleSubmit}
        className="w-full max-w-full gap-4"
      >
        <Field
          name="text"
          label="Prompt Text"
          hint="The prompt text instructs your participant about the task on this screen."
          component={InputField}
          initialValue={item?.text}
          required
        />
      </Form>
    </Dialog>
  );
}

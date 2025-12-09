import { type JSONContent } from '@tiptap/core';
import { GripVertical, PencilIcon, X } from 'lucide-react';
import { motion } from 'motion/react';
import { forwardRef, useEffect, useState } from 'react';
import { surfaceVariants } from '~/components/layout/Surface';
import Button, { IconButton, MotionButton } from '~/components/ui/Button';
import { Dialog } from '~/lib/dialogs/Dialog';
import { cx } from '~/utils/cva';
import Field from '../../Field';
import Form from '../../Form';
import SubmitButton from '../../SubmitButton';
import { InputField } from '../InputField';
import { RichTextEditorField } from '../RichTextEditor';
import { RichTextRenderer } from '../RichTextRenderer';
import {
  type ArrayFieldEditorProps,
  type ArrayFieldItemProps,
} from './ArrayField';

type SimpleItemBase = { id: string; label: string };

export const Editor = forwardRef<
  HTMLDivElement,
  ArrayFieldEditorProps<SimpleItemBase>
>(function Editor({ item, isEditing, isNewItem, onChange, onCancel }, ref) {
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
    <motion.div
      ref={ref}
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
    </motion.div>
  );
});

export const SimpleEditor = motion.create(Editor);

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
    </div>
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
}: ArrayFieldItemProps<NameGeneratorPrompt>) {
  return (
    <motion.div
      layoutId={item.id}
      className="border-b-input-contrast/10 flex w-full items-center gap-2 border-b px-2 py-1 last:border-b-0"
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

export const PromptEditor = forwardRef<
  HTMLDivElement,
  ArrayFieldEditorProps<NameGeneratorPrompt>
>(function PromptEditor(
  { isEditing, isNewItem, onCancel, onChange, item },
  ref,
) {
  const handleSubmit = (data: unknown) => {
    onChange(data as NameGeneratorPrompt);

    return { success: true as const };
  };

  return (
    <Dialog
      ref={ref}
      title="Edit Prompt"
      description="Update this prompt below"
      open={isEditing}
      closeDialog={onCancel}
      layoutId={item?.id}
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
});

import { type JSONContent } from '@tiptap/core';
import { GripVertical, PencilIcon, X } from 'lucide-react';
import { motion, Reorder, useDragControls } from 'motion/react';
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

const ItemAnimationProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, scale: 0.6 },
};

export const SimpleEditor = <T extends { id: string; text: string }>({
  item,
  isEditing,
  isNewItem,
  onChange,
  onCancel,
}: ArrayFieldEditorProps<T>) => {
  const [text, setText] = useState(item?.text ?? '');

  useEffect(() => {
    if (isEditing) {
      setText(item?.text || '');
    }
  }, [isEditing, item]);

  if (!isEditing) {
    return null;
  }

  return (
    <motion.div
      layoutId={isNewItem ? 'new-item-editor' : item?.id}
      layout
      className={cx(
        surfaceVariants({ level: 2, spacing: 'sm', elevation: 'none' }),
        'flex w-full flex-col gap-2 border p-4',
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <InputField value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <Button
          color="primary"
          onClick={() => onChange({ ...item!, text } as T)}
          disabled={text.trim() === ''}
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
};

export const SimpleItem = forwardRef<
  HTMLElement,
  ArrayFieldItemProps<{ id: string; label: string }>
>(function PromptItem({ item, isSortable, onEdit, onDelete, className }, ref) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      ref={ref as React.Ref<HTMLLIElement>}
      layoutId={item.id}
      value={item}
      dragListener={false}
      dragControls={controls}
      layout
      className={cx(
        surfaceVariants({ level: 2, spacing: 'sm', elevation: 'none' }),
        'flex w-full items-center gap-2 border select-none',
        className,
      )}
      {...ItemAnimationProps}
    >
      {isSortable && (
        <motion.div
          layout
          onPointerDown={(e) => controls.start(e)}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </motion.div>
      )}
      <motion.div layout className="flex-1">
        {item.label}
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
    </Reorder.Item>
  );
});

// Modal Editor Story - demonstrates using Dialog primitives to recreate the
// current architect prompt editing experience.

// Simplified version of name generator prompt
export type NameGeneratorPrompt = {
  id: string;
  text: JSONContent;
};

export const PromptItem = forwardRef<
  HTMLElement,
  ArrayFieldItemProps<NameGeneratorPrompt>
>(function PromptItem({ item, isSortable, onEdit, onDelete }, ref) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      ref={ref as React.Ref<HTMLLIElement>}
      layoutId={item.id}
      value={item}
      dragListener={false}
      dragControls={controls}
      layout
      className={cx(
        surfaceVariants({ level: 2, spacing: 'sm', elevation: 'none' }),
        'flex w-full items-center gap-2 border select-none',
      )}
      {...ItemAnimationProps}
    >
      {isSortable && (
        <motion.div
          layout
          onPointerDown={(e) => controls.start(e)}
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
    </Reorder.Item>
  );
});

export const PromptEditor = forwardRef<
  HTMLDivElement,
  ArrayFieldEditorProps<NameGeneratorPrompt>
>(function PromptEditor(
  { isEditing, isNewItem, onCancel, onChange, item },
  ref,
) {
  const handleSubmit = (data: NameGeneratorPrompt) => {
    onChange(data);

    return { success: true as const };
  };

  return (
    <Dialog
      ref={ref}
      title="Edit Prompt"
      description="Update this prompt below"
      open={isEditing}
      closeDialog={onCancel}
      {...(isNewItem ? {} : { layoutId: item?.id ?? undefined })}
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

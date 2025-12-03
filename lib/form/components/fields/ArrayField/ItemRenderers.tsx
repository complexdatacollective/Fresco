import { type Stage } from '@codaco/protocol-validation';
import { GripVertical, PencilIcon, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
} from 'motion/react';
import { type ComponentProps, useId } from 'react';
import z from 'zod';
import { surfaceVariants } from '~/components/layout/Surface';
import { IconButton, MotionButton } from '~/components/ui/Button';
import { Dialog } from '~/lib/dialogs/Dialog';
import { DialogPopupAnimation } from '~/lib/dialogs/DialogPopup';
import { cx } from '~/utils/cva';
import Field from '../../Field';
import Form from '../../Form';
import SubmitButton from '../../SubmitButton';
import { InputField } from '../InputField';
import { type Item } from './ArrayField';

export function SimplePreview({
  isSortable,
  onDragHandlePointerDown,
  onClickEdit,
  onClickDelete,
  children,
  className,
  ...props
}: Omit<ComponentProps<typeof motion.div>, 'children'> & {
  isSortable?: boolean;
  onDragHandlePointerDown?: ComponentProps<typeof motion.div>['onPointerDown'];
  onClickEdit?: () => void;
  onClickDelete?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      className={cx('flex w-full items-center gap-2', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      {...props}
    >
      {isSortable && (
        <motion.div
          layout="position"
          onPointerDown={onDragHandlePointerDown}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </motion.div>
      )}
      {children}
      <motion.div
        layout="position"
        className="ml-auto flex items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <IconButton
          size="sm"
          variant="text"
          onClick={onClickEdit}
          aria-label="Edit item"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="text"
          size="sm"
          onClick={onClickDelete}
          icon={<X />}
          aria-label="Remove item"
        />
      </motion.div>
    </motion.div>
  );
}

export type ArrayFieldItemProps<T extends Item = Item> = {
  onChange: (value: T) => void;
  onCancel: () => void;
  onDelete: () => void;
  onEdit: () => void;
  value: T;
  isEditing: boolean;
  isNewItem: boolean;
  isSortable: boolean;
  className?: string;
};

/**
 * SimpleItem is an item component for ArrayField.
 *
 * It swaps between view and edit modes using a simple AnimatePresence and
 * conditional rendering.
 */

export function InlineItemRenderer(
  props: ArrayFieldItemProps<{
    id: string;
    label: string;
  }>,
) {
  const {
    onChange,
    onCancel,
    onDelete,
    onEdit,
    isEditing,
    value,
    isSortable,
    isNewItem,
    className,
  } = props;

  const controls = useDragControls();

  return (
    <Reorder.Item
      value={value}
      dragListener={false}
      dragControls={controls}
      layout
      className={cx(
        surfaceVariants({ level: 2, spacing: 'sm', elevation: 'none' }),
        'flex w-full items-center gap-2 rounded-none border select-none',
        className,
      )}
      style={{ borderRadius: 'var(--radius-sm)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key={`editor-${value.id}`}
            layout
            className="flex w-full items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <InputField
              autoFocus
              type="text"
              value={value?.label ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  label: e.target.value,
                })
              }
            />
            <MotionButton type="button" color="primary" onClick={onCancel}>
              Done
            </MotionButton>
            {isNewItem && (
              <MotionButton
                type="button"
                color="destructive"
                onClick={onDelete}
              >
                Cancel
              </MotionButton>
            )}
          </motion.div>
        ) : (
          <SimplePreview
            key={`item-${value.id}`}
            isSortable={isSortable}
            onClickEdit={onEdit}
            onClickDelete={onDelete}
            onDragHandlePointerDown={(e) => controls.start(e)}
            transition={{ duration: 0.1 }}
          >
            {value.label}
          </SimplePreview>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

/**
 * PromptItem is an item component for ArrayField.
 *
 * It uses layoutId to transition between view and edit modes. Edit mode is
 * a modal dialog.
 */

type NameGeneratorPrompt = Extract<
  Stage,
  { type: 'NameGenerator' }
>['prompts'][number];

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
        {...(isNewItem ? { ...DialogPopupAnimation } : { layoutId: id })}
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
            component={InputField}
            initialValue={value?.text ?? ''}
            required
            validation={z.string().min(1, 'Prompt text is required')}
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
          {value.text}
        </SimplePreview>
      </Reorder.Item>
    </>
  );
}

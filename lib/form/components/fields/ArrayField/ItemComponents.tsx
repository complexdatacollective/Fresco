import { Dialog } from '@base-ui-components/react/dialog';
import { GripVertical, PencilIcon, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
} from 'motion/react';
import { type ComponentProps, useId } from 'react';
import z from 'zod';
import CloseButton from '~/components/CloseButton';
import { surfaceVariants } from '~/components/layout/Surface';
import Modal from '~/components/Modal';
import { IconButton, MotionButton } from '~/components/ui/Button';
import ModalPopup from '~/lib/dialogs/ModalPopup';
import { cx } from '~/utils/cva';
import Field from '../../Field';
import Form from '../../Form';
import SubmitButton from '../../SubmitButton';
import { type Item } from '../ArrayField';
import { InputField } from '../InputField';

export function SimplePreview({
  isSortable,
  onDragStart,
  onClickEdit,
  onClickDelete,
  children,
  className,
  ...props
}: ComponentProps<typeof motion.div> & {
  isSortable?: boolean;
  onDragStart?: (event: React.PointerEvent) => void;
  onClickEdit?: () => void;
  onClickDelete?: () => void;
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
          onPointerDown={onDragStart}
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

export type ArrayFieldItemProps = {
  onChange: (value: Item) => void;
  onCancel: () => void;
  onDelete: () => void;
  onEdit: () => void;
  value: Item;
  isEditing: boolean;
  isNewItem?: boolean;
  isSortable?: boolean;
};

/**
 * SimpleItem is an item component for ArrayField.
 *
 * It swaps between view and edit modes using a simple AnimatePresence and
 * conditional rendering.
 */

export function SimpleItem(
  props: ArrayFieldItemProps & {
    confirmDelete?: boolean;
  },
) {
  const { onChange, onCancel, onDelete, onEdit, isEditing, value, isSortable } =
    props;

  const controls = useDragControls();

  return (
    <Reorder.Item
      value={value}
      dragListener={false}
      dragControls={controls}
      layout
      className={cx(
        surfaceVariants({ level: 2, spacing: 'sm', elevation: 'none' }),
        'flex w-full items-center gap-2 border select-none',
      )}
    >
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key={`editor-${value.id}`}
            layout
            className="flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            <MotionButton type="button" onClick={onCancel}>
              Done
            </MotionButton>
          </motion.div>
        ) : (
          <SimplePreview
            key={`item-${value.id}`}
            isSortable={isSortable}
            onClickEdit={onEdit}
            onClickDelete={onDelete}
            onDragStart={(e) => controls.start(e)}
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
export function PromptItem(props: ArrayFieldItemProps) {
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

  const handleSubmit = (data: Record<string, any>) => {
    onChange({
      ...value,
      ...data,
    });
  };

  console.log('Rendering PromptItem', { isEditing, value });

  return (
    <>
      <Modal open={isEditing} onOpenChange={onCancel}>
        <ModalPopup
          key="dialog-editor"
          layoutId={id}
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
          <Dialog.Title
            render={(props) => (
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 {...props} className="text-lg font-semibold">
                  {isNewItem ? 'Edit Contact' : 'Add New Contact'}
                </h2>
                <Dialog.Close render={<CloseButton />} />
              </div>
            )}
          />
          <div className="-mx-8 overflow-y-auto px-8 pb-2">
            <Dialog.Description
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
                initialValue={value?.label ?? ''}
                placeholder="John Doe"
                required
                validation={z.string().min(1, 'Name is required')}
              />
              <Field
                name="email"
                label="Email"
                component={InputField}
                type="email"
                initialValue={value?.email ?? ''}
                placeholder="john@example.com"
                required
                validation={z.email()}
              />
              <Field
                name="phone"
                label="Phone"
                component={InputField}
                type="tel"
                initialValue={value?.phone ?? ''}
                placeholder="+1 (555) 123-4567"
              />
              <Field
                name="notes"
                label="Notes"
                component={InputField}
                initialValue={value?.notes ?? ''}
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
      <Reorder.Item
        layoutId={id}
        value={value}
        dragListener={false}
        dragControls={controls}
        layout
        className={cx(
          surfaceVariants({ level: 2, spacing: 'sm', elevation: 'none' }),
          'flex w-full items-center gap-2 border select-none',
        )}
      >
        <SimplePreview
          isSortable={isSortable}
          onClickEdit={onEdit}
          onClickDelete={onDelete}
          onDragStart={(e) => controls.start(e)}
        >
          {value.label}
        </SimplePreview>
      </Reorder.Item>
    </>
  );
}

import { GripVertical, PencilIcon, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
} from 'motion/react';
import { useState, type ComponentProps } from 'react';
import { surfaceVariants } from '~/components/layout/Surface';
import { IconButton, MotionButton } from '~/components/ui/Button';
import { cx } from '~/utils/cva';
import { InputField } from '../InputField';
import { type ArrayFieldItemProps } from './ArrayField';

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
      <motion.div layout="position" className="flex-1">
        {children}
      </motion.div>
      <motion.div
        layout="position"
        className="ml-auto flex items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <IconButton
          size="sm"
          variant="textMuted"
          color="primary"
          onClick={onClickEdit}
          aria-label="Edit item"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="textMuted"
          color="destructive"
          size="sm"
          onClick={onClickDelete}
          icon={<X />}
          aria-label="Remove item"
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * SimpleItem is an item component for ArrayField.
 *
 * It swaps between view and edit modes using a simple AnimatePresence and
 * conditional rendering.
 */

export function InlineItemRenderer<T extends { id: string; label: string }>(
  props: ArrayFieldItemProps<T>,
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

  const [label, setLabel] = useState(value.label);

  const controls = useDragControls();

  const handleClickDone = () => {
    onChange({
      ...value,
      label,
    });
  };

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
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <MotionButton
              type="button"
              color="primary"
              onClick={handleClickDone}
            >
              Done
            </MotionButton>
            <MotionButton
              type="button"
              color="destructive"
              onClick={isNewItem ? onCancel : onDelete}
            >
              Cancel
            </MotionButton>
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

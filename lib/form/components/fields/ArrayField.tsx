// MultiSelectField.tsx (React 18)

import { GripVertical, PencilIcon, PlusIcon, X } from 'lucide-react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  Reorder,
  useDragControls,
} from 'motion/react';
import { type ComponentProps, useCallback, useState } from 'react';
import { surfaceVariants } from '~/components/layout/Surface';
import { IconButton, MotionButton } from '~/components/ui/Button';
import { cx } from '~/utils/cva';
import { type BaseFieldComponentProps } from '../../types';
import { SimpleItem } from './ArrayField/ItemComponents';
import { InputField } from './InputField';

export type Item = {
  id: string;
  label: string;
} & Record<string, unknown>;

type ItemComponentProps<T extends Item> = {
  item: T;
  onEdit?: () => void;
  onRemove?: () => void;
  sortable?: boolean;
  layoutId?: string;
};

type EditorComponentProps<T extends Item> = {
  item?: T;
  onSave: (item: T) => void;
  onCancel: () => void;
  layoutId?: string;
};

type ArrayFieldProps<T extends Item = Item> = BaseFieldComponentProps<T[]> & {
  value?: T[];
  onChange: (value: T[]) => void;
  sortable?: boolean;
  ItemComponent?: React.ComponentType<ItemComponentProps<T>>;
  EditorComponent?: React.ComponentType<EditorComponentProps<T>>;
  buttonLabel?: string;
  emptyStateMessage?: string;
};

const ReorderItem = ({
  sortable,
  allowEdit = true,
  allowRemove = true,
  children,
  className,
  onEdit,
  onRemove,
  ...props
}: ComponentProps<typeof Reorder.Item> & {
  sortable?: boolean;
  allowEdit?: boolean;
  allowRemove?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
}) => {
  const controls = useDragControls();
  return (
    <Reorder.Item
      dragListener={false}
      className={cx(
        surfaceVariants({ level: 2, spacing: 'sm', elevation: 'none' }),
        'flex w-full items-center gap-2 border select-none',
        className,
      )}
      whileDrag={{
        boxShadow: '10px 20px 30px rgba(0, 0, 0, 0.2)',
      }}
      whileHover={{
        boxShadow: '5px 10px 15px rgba(0, 0, 0, 0.1)',
      }}
      dragControls={controls}
      style={{ borderRadius: 9999, boxShadow: 'none' }}
      {...props}
    >
      {sortable && (
        <motion.div
          layout="position"
          onPointerDown={(e) => controls.start(e)}
          className="touch-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </motion.div>
      )}
      {children}
      {(allowEdit ?? allowRemove) && (
        <motion.div
          layout="position"
          className="ml-auto flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {allowEdit && onEdit && (
            <IconButton
              size="sm"
              variant="text"
              onClick={onEdit}
              aria-label="Edit item"
              icon={<PencilIcon />}
            />
          )}
          {allowRemove && onRemove && (
            <IconButton
              variant="text"
              size="sm"
              onClick={onRemove}
              icon={<X />}
              aria-label="Remove item"
            />
          )}
        </motion.div>
      )}
    </Reorder.Item>
  );
};

const DefaultItemComponent = ({
  item,
  sortable,
  onEdit,
  onRemove,
  itemComponentProps,
}: {
  item: Item;
  sortable: boolean;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  itemComponentProps?: ComponentProps<typeof ReorderItem>;
}) => {
  return (
    <motion.span layout className="flex-1">
      {item.label}
    </motion.span>
  );
};

const DefaultEditorComponent = ({
  item,
  onSave,
  onCancel,
}: {
  item?: Item;
  onSave: (item: Item) => void;
  onCancel: () => void;
}) => {
  const [label, setLabel] = useState(item?.label ?? '');

  return (
    <motion.div layout>
      <InputField
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Enter label..."
        autoFocus
      />
      <MotionButton
        layout
        size="sm"
        onClick={() => {
          if (label.trim()) {
            onSave({
              id: item?.id ?? crypto.randomUUID(),
              label: label.trim(),
            } as Item);
          }
        }}
        color="primary"
      >
        Save
      </MotionButton>
      <MotionButton layout size="sm" onClick={onCancel}>
        Cancel
      </MotionButton>
    </motion.div>
  );
};

export function ArrayField<T extends Item = Item>({
  id,
  value = [],
  onChange,
  sortable = false,
  ItemComponent = SimpleItem,
  itemTemplate = () => ({ id: crypto.randomUUID(), label: '' }) as T,
  buttonLabel = 'Add Item',
  emptyStateMessage = 'No items added yet. Click "Add Item" to get started.',
}: ArrayFieldProps<T>) {
  const NEW_ITEM_KEY = '__new__';
  const [editingId, setEditingId] = useState<string | null>(null);

  const addItem = useCallback(
    (item: T) => {
      onChange([...value, item]);
      setEditingId(null);
    },
    [value, onChange],
  );

  const updateItem = useCallback(
    (id: string, updatedItem: T) => {
      onChange(value.map((i) => (i.id === id ? updatedItem : i)));
      setEditingId(null);
    },
    [value, onChange],
  );

  const removeItem = useCallback(
    (id: string) => {
      onChange(value.filter((i) => i.id !== id));
    },
    [value, onChange],
  );

  const handleReorder = useCallback(
    (newOrder: T[]) => {
      onChange(newOrder);
    },
    [onChange],
  );

  return (
    <LayoutGroup id={id}>
      <motion.div layout className="flex flex-col items-start gap-4">
        <Reorder.Group
          layout
          axis="y"
          values={value}
          onReorder={handleReorder}
          className="flex w-full flex-col gap-2"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {value.length === 0 && !editingId && (
              <Reorder.Item
                value={null}
                key="no-items"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-current/70"
                dragListener={false}
              >
                {emptyStateMessage}
              </Reorder.Item>
            )}
            {value.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <ItemComponent
                  key={item.id}
                  value={item}
                  isSortable={sortable}
                  isEditing={isEditing}
                  onChange={(updatedValue) => {
                    updateItem(item.id, {
                      ...(updatedValue as T),
                      id: item.id,
                    });
                  }}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => removeItem(item.id)}
                  onEdit={() => setEditingId(item.id)}
                />
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
        <MotionButton
          layout
          key="add-button"
          size="sm"
          onClick={() => setEditingId(NEW_ITEM_KEY)}
          icon={<PlusIcon />}
          disabled={editingId === NEW_ITEM_KEY}
        >
          {buttonLabel}
        </MotionButton>
      </motion.div>
    </LayoutGroup>
  );
}

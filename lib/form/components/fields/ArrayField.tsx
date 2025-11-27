// ArrayField.tsx (React 18)

import { GripVertical, PencilIcon, PlusIcon, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
} from 'motion/react';
import { useCallback, useState } from 'react';
import { IconButton, MotionButton } from '~/components/ui/Button';
import { InputField } from './InputField';

type Item = {
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

type ArrayFieldProps<T extends Item = Item> = {
  value?: T[];
  onChange: (value: T[]) => void;
  sortable?: boolean;
  ItemComponent?: React.ComponentType<ItemComponentProps<T>>;
  EditorComponent?: React.ComponentType<EditorComponentProps<T>>;
  buttonLabel?: string;
  emptyStateMessage?: string;
};

const DefaultItemComponent = ({
  item,
  onEdit,
  onRemove,
  sortable,
  layoutId,
}: {
  layoutId?: string;
  sortable?: boolean;
  item: Item;
  onEdit?: () => void;
  onRemove?: () => void;
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      layout
      layoutId={layoutId}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      dragListener={false}
      className="bg-surface-1 flex w-full items-center gap-2 rounded-lg border px-4 py-2 select-none"
      dragControls={controls}
    >
      {sortable && (
        <motion.div layout onPointerDown={(e) => controls.start(e)}>
          <GripVertical className="cursor-grab" />
        </motion.div>
      )}
      <motion.span layout className="flex-1">
        {item.label}
      </motion.span>
      {onEdit && (
        <IconButton
          size="sm"
          variant="text"
          onClick={onEdit}
          aria-label="Edit item"
          icon={<PencilIcon />}
        />
      )}
      {onRemove && (
        <IconButton
          variant="text"
          size="sm"
          onClick={onRemove}
          icon={<X />}
          aria-label="Remove item"
        />
      )}
    </Reorder.Item>
  );
};

const DefaultEditorComponent = ({
  item,
  onSave,
  onCancel,
  layoutId,
}: {
  layoutId?: string;
  item?: Item;
  onSave: (item: Item) => void;
  onCancel: () => void;
}) => {
  const [label, setLabel] = useState(item?.label ?? '');

  return (
    <motion.div
      layoutId={layoutId}
      className="bg-surface-1 flex items-center gap-2 rounded-lg border p-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
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
  value = [],
  onChange,
  sortable = false,
  ItemComponent = DefaultItemComponent as React.ComponentType<
    ItemComponentProps<T>
  >,
  EditorComponent = DefaultEditorComponent as React.ComponentType<
    EditorComponentProps<T>
  >,
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
    <motion.div layout className="flex flex-col items-start gap-2">
      <Reorder.Group
        axis="y"
        values={value}
        onReorder={handleReorder}
        className="flex w-full flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {value.length === 0 && (
            <Reorder.Item
              value={null}
              key="no-items"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3 } }}
              exit={{ opacity: 0 }}
              className="text-sm text-current/70"
              dragListener={false}
            >
              {emptyStateMessage}
            </Reorder.Item>
          )}
          {value.map((item) => {
            const isEditing = editingId === item.id;

            if (isEditing) {
              return (
                <EditorComponent
                  key={`editor-${item.id}`}
                  layoutId={item.id}
                  item={item}
                  onSave={(updatedItem) => updateItem(item.id, updatedItem)}
                  onCancel={() => setEditingId(null)}
                />
              );
            }

            return (
              <ItemComponent
                key={`item-${item.id}`}
                layoutId={item.id}
                item={item}
                onEdit={() => setEditingId(item.id)}
                onRemove={() => removeItem(item.id)}
                sortable={sortable}
              />
            );
          })}
        </AnimatePresence>
      </Reorder.Group>

      {/* Add new item */}
      <AnimatePresence>
        {editingId === NEW_ITEM_KEY && (
          <EditorComponent
            key="new-editor"
            onSave={addItem}
            onCancel={() => setEditingId(null)}
          />
        )}
      </AnimatePresence>
      <MotionButton
        layout="position"
        key="add-button"
        size="sm"
        onClick={() => setEditingId(NEW_ITEM_KEY)}
        icon={<PlusIcon />}
        disabled={editingId === NEW_ITEM_KEY}
      >
        {buttonLabel}
      </MotionButton>
    </motion.div>
  );
}

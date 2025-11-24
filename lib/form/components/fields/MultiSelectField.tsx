// MultiSelectField.tsx (React 18)

import { GripVertical, PencilIcon, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
} from 'motion/react';
import { useCallback, useState } from 'react';
import Button, { IconButton } from '~/components/ui/Button';
import { InputField } from './Input';

type Item = {
  id: string;
  label: string;
} & Record<string, unknown>;

// Type the element properly
type MultiSelectElement = HTMLElement & {
  value: Item[];
  validity: ValidityState;
  validationMessage: string;
  checkValidity(): boolean;
  reportValidity(): boolean;
};

type MultiSelectFieldProps<T extends Item = Item> = {
  value?: T[];
  onChange: (value: T[]) => void;
  sortable?: boolean;
  ItemComponent?: React.ComponentType<{
    item: T;
    onEdit?: () => void;
    onRemove?: () => void;
    sortable?: boolean;
  }>;
  EditorComponent?: React.ComponentType<{
    item?: T;
    onSave: (item: T) => void;
    onCancel: () => void;
  }>;
};

const DefaultItemComponent = ({
  item,
  onEdit,
  onRemove,
  sortable,
}: {
  sortable?: boolean;
  item: Item;
  onEdit?: () => void;
  onRemove?: () => void;
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      layoutId={`item-${item.id}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      dragListener={false}
      className="bg-surface-1 flex items-center gap-2 rounded-lg border p-2"
      dragControls={controls}
    >
      {sortable && (
        <div
          className="reorder-handle"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical className="cursor-grab" />
        </div>
      )}
      <span className="flex-1">{item.label}</span>
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
}: {
  item?: Item;
  onSave: (item: Item) => void;
  onCancel: () => void;
}) => {
  const [label, setLabel] = useState(item?.label ?? '');

  return (
    <div className="bg-surface-1 flex items-center gap-2 rounded-lg border p-2">
      <InputField
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Enter label..."
        autoFocus
      />
      <Button
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
      </Button>
      <Button size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
};

export function MultiSelectField<T extends Item = Item>({
  value = [],
  onChange,
  sortable = false,
  ItemComponent = DefaultItemComponent as React.ComponentType<{
    item: T;
    onEdit?: () => void;
    onRemove?: () => void;
  }>,
  EditorComponent = DefaultEditorComponent as React.ComponentType<{
    item?: T;
    onSave: (item: T) => void;
    onCancel: () => void;
  }>,
}: MultiSelectFieldProps<T>) {
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
    <div className="flex flex-col gap-2">
      {value.length === 0 && (
        <p className="text-sm text-current/70">
          No items added yet. Click &quot;Add Item&quot; to get started.
        </p>
      )}
      {/* Items list */}
      {value.length > 0 && (
        <Reorder.Group
          axis="y"
          values={value}
          onReorder={handleReorder}
          className="flex flex-col gap-2"
        >
          <AnimatePresence mode="popLayout">
            {value.map((item) => {
              const isEditing = editingId === item.id;

              if (isEditing) {
                return (
                  <EditorComponent
                    key={item.id}
                    item={item}
                    onSave={(updatedItem) => updateItem(item.id, updatedItem)}
                    onCancel={() => setEditingId(null)}
                  />
                );
              }

              return (
                <ItemComponent
                  key={item.id}
                  item={item}
                  onEdit={() => setEditingId(item.id)}
                  onRemove={() => removeItem(item.id)}
                  sortable={sortable}
                />
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* Add new item */}
      <AnimatePresence mode="wait">
        {editingId === NEW_ITEM_KEY ? (
          <motion.div
            key="new-editor"
            layoutId="new-item"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <EditorComponent
              onSave={addItem}
              onCancel={() => setEditingId(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="add-button"
            layoutId="new-item"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              type="button"
              onClick={() => setEditingId(NEW_ITEM_KEY)}
              variant="outline"
              className="w-full"
            >
              Add Item
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

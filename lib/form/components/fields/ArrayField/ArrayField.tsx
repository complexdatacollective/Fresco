// MultiSelectField.tsx (React 18)

import { PlusIcon } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, Reorder } from 'motion/react';
import { useCallback, useState } from 'react';
import { MotionButton } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';
import { type ArrayFieldItemProps, InlineItemRenderer } from './ItemRenderers';

// The base type for items in the array field. Must have an id.
export type Item = {
  id: string;
} & Record<string, unknown>;

type ArrayFieldProps<T extends Item = Item> = {
  // Props compatible with BaseFieldComponentProps<T[]>
  id?: string;
  name?: string;
  value?: T[];
  onChange: (value: T[]) => void;
  // ArrayField-specific props
  sortable?: boolean;
  ItemComponent?: React.ComponentType<ArrayFieldItemProps<T>>;
  itemClassName?: (item: T) => string;
  itemTemplate: () => T;
  addButtonLabel?: string;
  emptyStateMessage?: string;
  confirmDelete?: boolean;
};

export function ArrayField<T extends Item = Item>({
  value = [],
  onChange,
  sortable = false,
  ItemComponent = InlineItemRenderer,
  itemClassName,
  itemTemplate,
  addButtonLabel = 'Add Item',
  emptyStateMessage = 'No items added yet. Click "Add Item" to get started.',
  confirmDelete = false,
}: ArrayFieldProps<T>) {
  const { confirm } = useDialog();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  const addItem = useCallback(
    (item: T) => {
      onChange([...value, item]);
    },
    [value, onChange],
  );

  const updateItem = useCallback(
    (id: string, updatedItem: T) => {
      onChange(value.map((i) => (i.id === id ? updatedItem : i)));
      setEditingId(null);
      setIsNewItem(false);
    },
    [value, onChange],
  );

  const removeItem = useCallback(
    (id: string) => {
      onChange(value.filter((i) => i.id !== id));
      setEditingId(null);
      setIsNewItem(false);
    },
    [value, onChange],
  );

  const requestDelete = useCallback(
    async (id: string) => {
      if (confirmDelete) {
        await confirm({
          confirmLabel: 'Delete',
          onConfirm: () => removeItem(id),
        });
      } else {
        removeItem(id);
      }
    },
    [confirmDelete, confirm, removeItem],
  );

  const handleReorder = useCallback(
    (newOrder: T[]) => {
      onChange(newOrder);
    },
    [onChange],
  );

  return (
    <LayoutGroup>
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
                  isNewItem={isNewItem && isEditing}
                  value={item}
                  isSortable={sortable}
                  isEditing={isEditing}
                  onChange={(updatedValue) => {
                    updateItem(item.id, {
                      ...updatedValue,
                      id: item.id,
                    });
                  }}
                  onCancel={() => {
                    setEditingId(null);

                    // Wait for animation to finish before removing the new item
                    setTimeout(() => {
                      if (isNewItem) {
                        removeItem(item.id);
                        setIsNewItem(false);
                      }
                    }, 100); // Adjust the timeout duration to match the animation duration
                  }}
                  onDelete={() => requestDelete(item.id)}
                  onEdit={() => setEditingId(item.id)}
                  className={itemClassName ? itemClassName(item) : undefined}
                />
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
        <MotionButton
          layout
          key="add-button"
          size="sm"
          onClick={() => {
            const newItem = itemTemplate();
            setIsNewItem(true);
            addItem(newItem);
            setEditingId(newItem.id);
          }}
          icon={<PlusIcon />}
          disabled={editingId !== null}
        >
          {addButtonLabel}
        </MotionButton>
      </motion.div>
    </LayoutGroup>
  );
}

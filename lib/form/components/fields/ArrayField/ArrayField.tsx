// MultiSelectField.tsx (React 18)

import { PlusIcon } from 'lucide-react';
import { AnimatePresence, motion, Reorder } from 'motion/react';
import {
  type ForwardRefExoticComponent,
  type RefAttributes,
  useCallback,
  useState,
} from 'react';
import { MotionButton } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';
import { controlGroupVariants } from '~/styles/shared/controlVariants';
import { compose, cva } from '~/utils/cva';

const arrayFieldVariants = compose(
  controlGroupVariants,
  cva({
    base: 'w-full flex-col text-wrap',
    variants: {
      isEmpty: {
        true: 'items-center justify-center p-10',
        false: '',
      },
    },
    defaultVariants: {
      isEmpty: false,
    },
  }),
);

// The base type for items in the array field. Must have an id.
export type Item = {
  id: string;
} & Record<string, unknown>;

export type ArrayFieldItemProps<T extends Item = Item> = {
  onDelete: () => void;
  onEdit: () => void;
  item: T;
  isSortable: boolean;
  isLeaving?: boolean;
  className?: string;
};

export type ArrayFieldEditorProps<T extends Item = Item> = {
  item: T | undefined;
  isEditing: boolean;
  isNewItem: boolean;
  onChange: (value: T) => void;
  onCancel: () => void;
};

export type ArrayFieldProps<T extends Item = Item> = {
  // Props compatible with BaseFieldComponentProps<T[]>
  id?: string;
  name?: string;
  value?: T[];
  onChange: (value: T[]) => void;
  // ArrayField-specific props
  sortable?: boolean;
  itemComponent: ForwardRefExoticComponent<
    ArrayFieldItemProps<T> & RefAttributes<HTMLElement>
  >;
  editorComponent?: ForwardRefExoticComponent<
    ArrayFieldEditorProps<T> & RefAttributes<HTMLDivElement>
  >;
  itemTemplate: () => T;
  addButtonLabel?: string;
  emptyStateMessage?: string;
  confirmDelete?: boolean;
};

export function ArrayField<T extends Item = Item>({
  value = [],
  onChange,
  sortable = false,
  itemComponent: ItemComponent,
  editorComponent: EditorComponent,
  itemTemplate,
  addButtonLabel = 'Add Item',
  emptyStateMessage = 'No items added yet. Click "Add Item" to get started.',
  confirmDelete = true,
}: ArrayFieldProps<T>) {
  const { confirm } = useDialog();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftItem, setDraftItem] = useState<T | null>(null);
  const [isDraftEditing, setIsDraftEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const startAddingItem = useCallback(() => {
    const newItem = itemTemplate();
    setDraftItem(newItem);
    setIsDraftEditing(true);
    setShowEditor(true);
  }, [itemTemplate]);

  const confirmDraft = useCallback(
    (confirmedItem: T) => {
      if (draftItem) {
        onChange([...value, { ...confirmedItem, id: draftItem.id }]);
        setDraftItem(null);
        setIsDraftEditing(false);
        setShowEditor(false);
      }
    },
    [draftItem, onChange, value],
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
      setEditingId(null);
      onChange(value.filter((i) => i.id !== id));
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

  const isAddingNew = draftItem !== null;
  const isEditing = editingId !== null || isDraftEditing;

  return (
    <div className="flex flex-col items-start gap-4">
      <Reorder.Group
        layout
        axis="y"
        values={value}
        onReorder={handleReorder}
        className={arrayFieldVariants({
          isEmpty: value.length === 0 && !isAddingNew,
        })}
      >
        <AnimatePresence initial={false}>
          {value.length === 0 && !isAddingNew && (
            <motion.li
              layout
              key="no-items"
              className="text-sm text-current/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3 } }}
              exit={{ opacity: 0 }}
            >
              {emptyStateMessage}
            </motion.li>
          )}
          {value.map((item) => (
            <ItemComponent
              key={item.id}
              item={item}
              isSortable={sortable}
              onDelete={() => requestDelete(item.id)}
              onEdit={() => {
                setEditingId(item.id);
                setShowEditor(true);
              }}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
      <MotionButton
        layout
        key="add-button"
        size="sm"
        onClick={startAddingItem}
        icon={<PlusIcon />}
        disabled={isEditing}
      >
        {addButtonLabel}
      </MotionButton>
      {EditorComponent && (
        <EditorComponent
          item={draftItem ?? value.find((i) => i.id === editingId)}
          isEditing={showEditor}
          isNewItem={isAddingNew}
          onChange={(updatedItem: T) => {
            if (isAddingNew) {
              confirmDraft(updatedItem);
            } else {
              updateItem(editingId!, updatedItem);
            }
          }}
          onCancel={() => {
            setShowEditor(false);
            setEditingId(null);
            setDraftItem(null);
            setIsDraftEditing(false);
          }}
        />
      )}
    </div>
  );
}

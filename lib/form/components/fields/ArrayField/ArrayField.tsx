import { PlusIcon } from 'lucide-react';
import {
  AnimatePresence,
  type DragControls,
  motion,
  Reorder,
  useDragControls,
} from 'motion/react';
import {
  type ComponentType,
  type ReactNode,
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

const itemVariants = cva({
  base: 'w-full select-none',
});

const itemAnimationProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, scale: 0.6 },
};

// Re-export DragControls for consumers implementing custom item content
export { type DragControls } from 'motion/react';

// The base type for items in the array field. Must have an id.
export type Item = {
  id: string;
} & Record<string, unknown>;

/**
 * Props passed to the item content renderer component.
 * The component renders the CONTENT inside a Reorder.Item (not the Reorder.Item itself).
 */
export type ArrayFieldItemProps<T extends Item = Item> = {
  item: T;
  onDelete: () => void;
  onEdit: () => void;
  isSortable: boolean;
  dragControls: DragControls;
};

export type ArrayFieldEditorProps<T extends Item = Item> = {
  item: T | undefined;
  isEditing: boolean;
  isNewItem: boolean;
  onChange: (value: T) => void;
  onCancel: () => void;
};

/**
 * Type for editor components.
 */
type EditorComponent<P> = ComponentType<P>;

export type ArrayFieldProps<T extends Item = Item> = {
  id?: string;
  name?: string;
  value?: T[];
  onChange: (value: T[]) => void;
  sortable?: boolean;

  /**
   * Component that renders the content inside each Reorder.Item.
   * Receives item data, callbacks, and dragControls for implementing a drag handle.
   *
   * Note: ArrayField handles the Reorder.Item wrapper automatically.
   * This component only needs to render the item's visual content and styling.
   */
  itemComponent: ComponentType<ArrayFieldItemProps<T>>;

  /**
   * Component used to edit an item in the array.
   * Accepts ArrayFieldEditorProps<T>.
   */
  editorComponent: EditorComponent<ArrayFieldEditorProps<T>>;

  /**
   * Function that returns a new item template when adding a new item.
   */
  itemTemplate: () => T;
  addButtonLabel?: string;
  emptyStateMessage?: string;
  confirmDelete?: boolean;
};

/**
 * Internal wrapper component for each item that provides drag controls.
 */
function ArrayFieldItem<T extends Item>({
  item,
  isSortable,
  onDelete,
  onEdit,
  ItemContent,
}: {
  item: T;
  isSortable: boolean;
  onDelete: () => void;
  onEdit: () => void;
  ItemContent: ComponentType<ArrayFieldItemProps<T>>;
}): ReactNode {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      layout
      className={itemVariants()}
      {...itemAnimationProps}
    >
      <ItemContent
        item={item}
        isSortable={isSortable}
        onDelete={onDelete}
        onEdit={onEdit}
        dragControls={dragControls}
      />
    </Reorder.Item>
  );
}

export function ArrayField<T extends Item = Item>({
  value = [],
  onChange,
  sortable = false,
  itemComponent: ItemContent,
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
      onChange(value.map((i) => (i.id === id ? { ...updatedItem, id } : i)));
      setEditingId(null);
      setShowEditor(false);
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
            <ArrayFieldItem
              key={item.id}
              item={item}
              isSortable={sortable}
              onDelete={() => requestDelete(item.id)}
              onEdit={() => {
                setEditingId(item.id);
                setShowEditor(true);
              }}
              ItemContent={ItemContent}
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
    </div>
  );
}

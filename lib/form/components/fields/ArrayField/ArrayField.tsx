import { PlusIcon } from 'lucide-react';
import {
  AnimatePresence,
  type DragControls,
  LayoutGroup,
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
import {
  useInternalIds,
  type WithInternalId,
} from '~/lib/form/hooks/useInternalIds';
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

// Re-export for consumers
export { type DragControls } from 'motion/react';
export { type WithInternalId } from '~/lib/form/hooks/useInternalIds';

/**
 * Props passed to the item content renderer component.
 * The component renders the CONTENT inside a Reorder.Item (not the Reorder.Item itself).
 */
export type ArrayFieldItemProps<T extends object> = {
  item: WithInternalId<T>;
  onDelete: () => void;
  onEdit: () => void;
  isSortable: boolean;
  dragControls: DragControls;
};

export type ArrayFieldEditorProps<T extends object> = {
  item: T | undefined;
  isEditing: boolean;
  isNewItem: boolean;
  onChange: (value: T) => void;
  onCancel: () => void;
};

export type ArrayFieldProps<T extends object> = {
  id?: string;
  name?: string;
  value?: T[];
  onChange: (value: T[]) => void;
  sortable?: boolean;

  /**
   * Optional function to extract an ID from an item.
   * If the item has its own ID, return it. Otherwise return undefined.
   * When undefined is returned, ArrayField generates and tracks an internal ID.
   *
   * @example
   * // For items with an 'id' property
   * getId={(item) => item.id}
   *
   * @example
   * // For items without IDs (all get internal IDs)
   * // Simply omit this prop
   */
  getId?: (item: T) => string | undefined;

  /**
   * Component that renders the content inside each Reorder.Item.
   * Receives item data (with _internalId), callbacks, and dragControls for implementing a drag handle.
   *
   * Note: ArrayField handles the Reorder.Item wrapper automatically.
   * This component only needs to render the item's visual content and styling.
   */
  itemComponent: ComponentType<ArrayFieldItemProps<T>>;

  /**
   * Component used to edit an item in the array.
   * Accepts ArrayFieldEditorProps<T>.
   */
  editorComponent: ComponentType<ArrayFieldEditorProps<T>>;

  /**
   * Function that returns a new item template when adding a new item.
   * Note: You don't need to include an 'id' property - ArrayField handles ID generation internally.
   */
  itemTemplate: () => Partial<T>;
  addButtonLabel?: string;
  emptyStateMessage?: string;
  confirmDelete?: boolean;
};

/**
 * Internal wrapper component for each item that provides drag controls.
 */
function ArrayFieldItemWrapper<T extends object>({
  item,
  isSortable,
  onDelete,
  onEdit,
  ItemContent,
}: {
  item: WithInternalId<T>;
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

export function ArrayField<T extends object>({
  value = [],
  onChange,
  sortable = false,
  getId,
  itemComponent: ItemContent,
  editorComponent: EditorComponent,
  itemTemplate,
  addButtonLabel = 'Add Item',
  emptyStateMessage = 'No items added yet. Click "Add Item" to get started.',
  confirmDelete = true,
}: ArrayFieldProps<T>) {
  const { confirm } = useDialog();
  const [editingInternalId, setEditingInternalId] = useState<string | null>(
    null,
  );
  const [draftItem, setDraftItem] = useState<T | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const [items, setItems] = useInternalIds(value, onChange, { getId });

  const startAddingItem = useCallback(() => {
    setDraftItem(itemTemplate() as T);
    setShowEditor(true);
  }, [itemTemplate]);

  const confirmDraft = useCallback(
    (confirmedItem: T) => {
      setItems([
        ...items,
        {
          ...confirmedItem,
          _internalId: crypto.randomUUID(),
        } as WithInternalId<T>,
      ]);
      setDraftItem(null);
      setShowEditor(false);
    },
    [items, setItems],
  );

  const updateItem = useCallback(
    (internalId: string, updatedItem: T) => {
      setItems(
        items.map((item) =>
          item._internalId === internalId
            ? ({ ...updatedItem, _internalId: internalId } as WithInternalId<T>)
            : item,
        ),
      );
      setEditingInternalId(null);
      setShowEditor(false);
    },
    [items, setItems],
  );

  const removeItem = useCallback(
    (internalId: string) => {
      setEditingInternalId(null);
      setItems(items.filter((item) => item._internalId !== internalId));
    },
    [items, setItems],
  );

  const requestDelete = useCallback(
    async (internalId: string) => {
      if (confirmDelete) {
        await confirm({
          confirmLabel: 'Delete',
          onConfirm: () => removeItem(internalId),
        });
      } else {
        removeItem(internalId);
      }
    },
    [confirmDelete, confirm, removeItem],
  );

  const findByInternalId = useCallback(
    (internalId: string): T | undefined => {
      const found = items.find((item) => item._internalId === internalId);
      if (!found) return undefined;
      // Strip _internalId for the editor - omit using destructuring
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _internalId: _, ...rest } = found;
      return rest as T;
    },
    [items],
  );

  const isAddingNew = draftItem !== null;
  const isEditing = editingInternalId !== null || isAddingNew;

  return (
    <div className="flex flex-col items-start gap-4">
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={setItems}
        className={arrayFieldVariants({
          isEmpty: items.length === 0 && !isAddingNew,
        })}
      >
        <LayoutGroup id="array-field-items">
          <AnimatePresence initial={false}>
            {items.length === 0 && (
              <motion.li
                key="no-items"
                className="text-sm text-current/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.3 } }}
                exit={{ opacity: 0 }}
              >
                {emptyStateMessage}
              </motion.li>
            )}
            {items.map((item) => (
              <ArrayFieldItemWrapper
                key={item._internalId}
                item={item}
                isSortable={sortable}
                onDelete={() => requestDelete(item._internalId)}
                onEdit={() => {
                  setEditingInternalId(item._internalId);
                  setShowEditor(true);
                }}
                ItemContent={ItemContent}
              />
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </Reorder.Group>
      <MotionButton
        key="add-button"
        size="sm"
        onClick={startAddingItem}
        icon={<PlusIcon />}
        disabled={isEditing}
      >
        {addButtonLabel}
      </MotionButton>
      <EditorComponent
        item={draftItem ?? findByInternalId(editingInternalId ?? '')}
        isEditing={showEditor}
        isNewItem={isAddingNew}
        onChange={(updatedItem: T) => {
          if (isAddingNew) {
            confirmDraft(updatedItem);
          } else {
            updateItem(editingInternalId!, updatedItem);
          }
        }}
        onCancel={() => {
          setShowEditor(false);
          setEditingInternalId(null);
          setDraftItem(null);
        }}
      />
    </div>
  );
}

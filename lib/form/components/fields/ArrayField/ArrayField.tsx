import { PlusIcon } from 'lucide-react';
import {
  AnimatePresence,
  type DragControls,
  LayoutGroup,
  motion,
  Reorder,
  useDragControls,
  type Variants,
} from 'motion/react';
import {
  type ComponentType,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MotionButton } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';
import { controlGroupVariants } from '~/styles/shared/controlVariants';
import { compose, cva, cx } from '~/utils/cva';

function ArrayItem<T extends Item>({
  internalItem,
  isEditing,
  EditorComponent,
  ItemComponent,
  isSortable,
  onChange,
  onDelete,
  onEdit,
  onCancelEdit,
  disabled,
}: {
  internalItem: InternalItem<T>;
  isEditing: boolean;
  EditorComponent: EditorComponent<ArrayFieldEditorProps<T>>;
  ItemComponent: ComponentType<ArrayFieldItemProps<T>>;
  isSortable: boolean;
  onChange: (updatedItem: T) => void;
  onDelete: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  disabled: boolean;
}) {
  const dragControls = useDragControls();
  const { _internalId, data } = internalItem;

  const getState = () => {
    // if (disabled) return 'disabled';
    if (isEditing) return 'editing';
    return 'show';
  };

  return (
    <Reorder.Item
      key={_internalId}
      layoutId={_internalId}
      value={internalItem}
      variants={itemVariants}
      custom={getState()}
      animate="show"
      exit="exit"
      dragControls={dragControls}
      dragListener={false}
      className={cx(
        'flex w-full',
        disabled &&
          'pointer-events-none cursor-not-allowed opacity-50! transition-opacity delay-300 duration-300',
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.25 } }}
            exit={{ opacity: 0 }}
            key="editor-wrapper"
            className="w-full"
          >
            <EditorComponent
              item={data}
              isEditing={isEditing}
              isNewItem={false}
              onChange={onChange}
              onCancel={onCancelEdit}
              disabled={disabled}
            />
          </motion.div>
        ) : (
          <motion.div
            key="item-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.25 } }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <ItemComponent
              item={data}
              isSortable={isSortable}
              onChange={onChange}
              onEdit={onEdit}
              onDelete={onDelete}
              dragControls={dragControls}
              disabled={disabled}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

const itemVariants: Variants = {
  initial: {
    scale: 0.8,
    borderRadius: 14,
    backgroundColor: 'var(--color-surface-1)',
    opacity: 0,
  },
  show: (mode: 'show' | 'editing') =>
    mode === 'show'
      ? {
          scale: 1,
          backgroundColor: 'var(--color-surface-1)',
          borderRadius: 14,
          opacity: 1,
        }
      : {
          scale: 1,
          backgroundColor: 'var(--color-surface-2)',
          borderRadius: 14,
          opacity: 1,
          transition: { type: 'spring' },
        },
  exit: {
    opacity: 0,
    borderRadius: 14,
    scale: 0.6,
  },
};

const arrayFieldVariants = compose(
  controlGroupVariants,
  cva({
    base: 'w-full flex-col text-wrap',
  }),
);

// The base type for items in the array field. ID is optional - internal IDs are generated for items without one.
export type Item = {
  id?: string;
} & Record<string, unknown>;

// Internal wrapper that always has an ID for tracking
type InternalItem<T extends Item> = {
  _internalId: string;
  data: T;
};

/**
 * Props passed to the item content renderer component.
 * The component renders the CONTENT inside a Reorder.Item (not the Reorder.Item itself).
 */
export type ArrayFieldItemProps<T extends Item = Item> = {
  item: T;
  onChange: (updatedItem: T) => void;
  onDelete: () => void;
  onEdit: () => void;
  isSortable: boolean;
  dragControls: DragControls;
  disabled: boolean;
};

export type ArrayFieldEditorProps<T extends Item = Item> = {
  item: Partial<T>;
  isEditing: boolean;
  isNewItem: boolean;
  onChange: (value: T) => void;
  onCancel: () => void;
  disabled: boolean;
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
  editorComponent?: EditorComponent<ArrayFieldEditorProps<T>>;

  /**
   * Function that returns a new item template when adding a new item.
   */
  itemTemplate: () => T;
  addButtonLabel?: string;
  emptyStateMessage?: string;
  confirmDelete?: boolean;

  /**
   * When true, the editor is rendered inline within the list, replacing the item being edited.
   * Uses AnimatePresence mode="wait" for smooth transitions between item and editor.
   *
   * When false (default), the editor is rendered outside the list, suitable for
   * modal/dialog editors that use layoutId for morph animations.
   */
  inlineEditor?: boolean;
};

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
  inlineEditor = true,
}: ArrayFieldProps<T>) {
  const { confirm } = useDialog();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Track internal IDs for items without their own id
  const idMapRef = useRef<WeakMap<object, string>>(new WeakMap());

  // Get or generate an internal ID for an item
  const getInternalId = useCallback((item: T): string => {
    // If item has its own id, use it
    if (item.id !== undefined) {
      return item.id;
    }
    // Otherwise, get or generate an internal id
    let internalId = idMapRef.current.get(item);
    if (!internalId) {
      internalId = crypto.randomUUID();
      idMapRef.current.set(item, internalId);
    }
    return internalId;
  }, []);

  // Convert value array to internal items with guaranteed IDs
  const internalItems = useMemo((): InternalItem<T>[] => {
    return value.map((item) => ({
      _internalId: getInternalId(item),
      data: item,
    }));
  }, [value, getInternalId]);

  const startAddingItem = useCallback(() => {
    const newItem = itemTemplate();
    onChange([...value, { ...newItem }]);
  }, [itemTemplate, onChange, value]);

  const updateItem = useCallback(
    (internalId: string, updatedItem: T) => {
      onChange(
        internalItems.map((internal) =>
          internal._internalId === internalId ? updatedItem : internal.data,
        ),
      );
      setEditingId(null);
    },
    [internalItems, onChange],
  );

  const removeItem = useCallback(
    (internalId: string) => {
      setEditingId(null);
      onChange(
        internalItems
          .filter((internal) => internal._internalId !== internalId)
          .map((internal) => internal.data),
      );
    },
    [internalItems, onChange],
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

  const handleReorder = useCallback(
    (newOrder: InternalItem<T>[]) => {
      onChange(newOrder.map((internal) => internal.data));
    },
    [onChange],
  );

  const cancelEditing = useCallback(() => {
    setEditingId(null);
  }, []);

  const isEditing = editingId !== null;

  return (
    <motion.div className={cx(arrayFieldVariants())}>
      <Reorder.Group
        axis="y"
        values={internalItems}
        onReorder={handleReorder}
        className="flex w-full flex-col gap-2"
      >
        <LayoutGroup id="array-field-items">
          {value.length === 0 && (
            <motion.li
              key="no-items"
              className="p-6 text-sm text-current/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {emptyStateMessage}
            </motion.li>
          )}
          {internalItems.map((internalItem) => {
            return (
              <ArrayItem<T>
                key={internalItem._internalId}
                internalItem={internalItem}
                isEditing={editingId === internalItem._internalId}
                EditorComponent={EditorComponent}
                ItemComponent={ItemContent}
                isSortable={sortable}
                onChange={(updatedItem) =>
                  updateItem(internalItem._internalId, updatedItem)
                }
                onDelete={() => requestDelete(internalItem._internalId)}
                onEdit={() => {
                  setEditingId(internalItem._internalId);
                }}
                onCancelEdit={cancelEditing}
                disabled={
                  editingId !== null && editingId !== internalItem._internalId
                }
              />
            );
          })}

          {}
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
    </motion.div>
  );
}

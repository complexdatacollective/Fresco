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
  forwardRef,
  type Ref,
  useCallback,
  useId,
  useMemo,
} from 'react';
import { surfaceVariants } from '~/components/layout/Surface';
import { MotionButton } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';
import { getInputState } from '~/lib/form/utils/getInputState';
import {
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx } from '~/utils/cva';
import { type CreateFieldProps } from '../../Field/Field';
import {
  useArrayFieldItems,
  type WithItemProperties,
} from './useArrayFieldItems';

// Stable empty array to prevent infinite re-renders when value is undefined
const EMPTY_ARRAY: never[] = [];

const arrayFieldVariants = compose(
  controlVariants,
  inputControlVariants,
  groupSpacingVariants,
  stateVariants,
  cva({
    base: 'relative w-full flex-col overflow-hidden text-wrap',
  }),
);

const itemVariants = cva({
  base: 'w-full select-none',
});

export const itemAnimationProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, scale: 0.6 },
};

/**
 * Props passed to the item content renderer component.
 * The component renders the CONTENT inside a Reorder.Item (not the Reorder.Item itself).
 */
export type ArrayFieldItemProps<T extends object> = {
  item: Partial<WithItemProperties<T>>;
  isNewItem: boolean;
  /** Save and exit editing mode. Use for inline editing pattern. */
  onChange: (value: T) => void;
  /** Update item data without affecting editing state. Use for always-editing pattern. */
  onUpdate: (value: Partial<T>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isSortable: boolean;
  isBeingEdited: boolean;
  dragControls: DragControls;
};

export type ArrayFieldEditorProps<T extends object> = {
  item: WithItemProperties<T> | undefined; // Undefined when no item is being edited
  isNewItem: boolean;
  // Editors get onSave to reflect the fact that this should be called once
  // the user is done editing, rather than onChange which implies continuous updates.
  onSave: (value: T) => void;
  onCancel: () => void;
};

export type ArrayFieldProps<T extends object> = CreateFieldProps & {
  value: T[];
  onChange: (value: T[]) => void;
  sortable?: boolean;
  itemClasses?:
    | string
    | ((item: WithItemProperties<T>, isBeingEdited: boolean) => string);

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
   * Can also render edit UI for inline editing.
   *
   * Note: ArrayField handles the Reorder.Item wrapper automatically.
   * This component only needs to render the item's visual content and styling.
   */
  itemComponent: ComponentType<ArrayFieldItemProps<T>>;

  /**
   * Provided a dedicated component used to edit an item in the array.Useful
   * for complex editors such as modals or side panels.
   *
   * Accepts ArrayFieldEditorProps<T>.
   *
   */
  editorComponent?: ComponentType<ArrayFieldEditorProps<T>>;

  /**
   * Function that returns a new item template when adding a new item.
   * Note: You don't need to include an 'id' property - ArrayField handles ID generation internally.
   */
  itemTemplate: () => Partial<T>;
  addButtonLabel?: string;
  emptyStateMessage?: string;
  confirmDelete?: boolean;

  /**
   * When true, clicking "Add" immediately adds a confirmed item without entering
   * editing mode. Use this for the "always editing" pattern where items show
   * editable UI at all times.
   *
   * @default false
   */
  immediateAdd?: boolean;
};

type ArrayFieldItemWrapperProps<T extends object> = {
  item: WithItemProperties<T>;
  isSortable: boolean;
  isBeingEdited: boolean;
  isNewItem: boolean;
  onCancel: () => void;
  onChange: (value: T) => void;
  onUpdateItem: (internalId: string, value: Partial<T>) => void;
  onDeleteItem: (internalId: string) => void;
  onEditItem: (internalId: string) => void;
  ItemComponent: ComponentType<ArrayFieldItemProps<T>>;
  itemClasses?:
    | string
    | ((item: WithItemProperties<T>, isBeingEdited: boolean) => string);
};

/**
 * Internal wrapper component for each item that provides drag controls.
 * Uses forwardRef to support AnimatePresence popLayout mode.
 */
const ArrayFieldItemWrapper = forwardRef(function ArrayFieldItemWrapper<
  T extends object,
>(
  {
    item,
    isSortable,
    isBeingEdited,
    isNewItem,
    onDeleteItem,
    onEditItem,
    onCancel,
    onChange,
    onUpdateItem,
    ItemComponent,
    itemClasses,
  }: ArrayFieldItemWrapperProps<T>,
  ref: Ref<HTMLLIElement>,
) {
  const dragControls = useDragControls();
  const resolvedItemClasses =
    typeof itemClasses === 'function'
      ? itemClasses(item, isBeingEdited)
      : itemClasses;

  // Memoize item-specific callbacks to prevent re-renders
  const onUpdate = useCallback(
    (data: Partial<T>) => onUpdateItem(item._internalId, data),
    [onUpdateItem, item._internalId],
  );

  const onDelete = useCallback(
    () => onDeleteItem(item._internalId),
    [onDeleteItem, item._internalId],
  );

  const onEdit = useCallback(
    () => onEditItem(item._internalId),
    [onEditItem, item._internalId],
  );

  return (
    <Reorder.Item
      ref={ref}
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className={cx(
        itemVariants(),
        surfaceVariants({ level: 1, spacing: 'sm' }),
        resolvedItemClasses,
      )}
      inherit={false}
      {...itemAnimationProps}
    >
      <ItemComponent
        item={item}
        isSortable={isSortable}
        isBeingEdited={isBeingEdited}
        onCancel={onCancel}
        onChange={onChange}
        onUpdate={onUpdate}
        isNewItem={isNewItem}
        onDelete={onDelete}
        onEdit={onEdit}
        dragControls={dragControls}
      />
    </Reorder.Item>
  );
}) as <T extends object>(
  props: ArrayFieldItemWrapperProps<T> & { ref?: Ref<HTMLLIElement> },
) => JSX.Element;

export default function ArrayField<T extends object>(
  propsIn: ArrayFieldProps<T>,
) {
  const {
    value = EMPTY_ARRAY as T[],
    onChange,
    sortable = false,
    getId,
    itemComponent: ItemComponent,
    editorComponent: EditorComponent,
    itemTemplate,
    addButtonLabel = 'Add Item',
    emptyStateMessage = 'No items added yet. Click "Add Item" to get started.',
    confirmDelete = true,
    immediateAdd = false,
    itemClasses,
    disabled,
    readOnly,
    ...props
  } = propsIn;

  const { confirm } = useDialog();

  const {
    items,
    setItems,
    editingItem,
    isAddingNew,
    startAdding,
    addItem,
    startEditing,
    cancelEditing,
    saveEditing,
    removeItem,
    updateItem,
    isDraft,
  } = useArrayFieldItems(value, onChange, { getId });

  // Handle delete with optional confirmation for non-draft items
  const requestDelete = useCallback(
    async (internalId: string) => {
      // Always delete drafts immediately without confirmation
      if (isDraft(internalId)) {
        removeItem(internalId);
        return;
      }

      if (confirmDelete) {
        await confirm({
          confirmLabel: 'Delete',
          onConfirm: () => removeItem(internalId),
        });
      } else {
        removeItem(internalId);
      }
    },
    [confirmDelete, confirm, removeItem, isDraft],
  );

  // When using an external editor, filter out draft items from the list
  // (they're rendered in the editor instead). For inline editing, keep drafts in the list.
  const renderableItems = useMemo(
    () => (EditorComponent ? items.filter((item) => !item._draft) : items),
    [EditorComponent, items],
  );

  const id = useId();

  return (
    <LayoutGroup id={id}>
      <motion.div
        layout
        className="flex w-full min-w-sm flex-col items-start gap-4"
      >
        <Reorder.Group
          {...props}
          axis="y"
          values={items}
          onReorder={setItems}
          className={arrayFieldVariants({ state: getInputState(props) })}
          style={{ borderRadius: 28 }}
          inherit={false}
          layout={false}
        >
          <AnimatePresence mode="popLayout">
            {renderableItems.length === 0 && (
              <motion.li
                key="no-items"
                className="m-10 text-sm text-current/70"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: 0.5 } }}
                exit={{ opacity: 0, scale: 0.6 }}
              >
                {emptyStateMessage}
              </motion.li>
            )}
            {renderableItems.map((item) => (
              <ArrayFieldItemWrapper
                key={item._internalId}
                item={item}
                isSortable={sortable}
                onDeleteItem={requestDelete}
                onEditItem={startEditing}
                onChange={saveEditing}
                onUpdateItem={updateItem}
                isNewItem={!!item._draft}
                isBeingEdited={editingItem?._internalId === item._internalId}
                onCancel={cancelEditing}
                ItemComponent={ItemComponent}
                itemClasses={itemClasses}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
        <MotionButton
          layout
          key="add-button"
          onClick={() =>
            immediateAdd
              ? addItem(itemTemplate() as T)
              : startAdding(itemTemplate() as T)
          }
          icon={<PlusIcon />}
          disabled={
            (disabled ?? false) ||
            (readOnly ?? false) ||
            (!immediateAdd && !!editingItem)
          }
        >
          {addButtonLabel}
        </MotionButton>
        {EditorComponent && (
          <EditorComponent
            item={editingItem}
            isNewItem={isAddingNew}
            onSave={saveEditing}
            onCancel={cancelEditing}
          />
        )}
      </motion.div>
    </LayoutGroup>
  );
}

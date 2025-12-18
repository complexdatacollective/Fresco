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
} from 'react';
import { MotionButton } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';
import {
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva } from '~/utils/cva';
import {
  useArrayFieldItems,
  type WithItemProperties,
} from './useArrayFieldItems';

// Stable empty array to prevent infinite re-renders when value is undefined
const EMPTY_ARRAY: never[] = [];

const arrayFieldVariants = compose(
  controlVariants,
  groupSpacingVariants,
  inputControlVariants,
  stateVariants,
  cva({
    base: 'w-full flex-col text-wrap',
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
  onChange?: (value: T) => void;
  onCancel?: () => void;
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

export type ArrayFieldProps<T extends object> = {
  id?: string;
  name?: string;
  value?: T[];
  onChange: (value: T[]) => void;
  sortable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

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
};

type ArrayFieldItemWrapperProps<T extends object> = {
  item: WithItemProperties<T>;
  isSortable: boolean;
  isBeingEdited: boolean;
  isNewItem: boolean;
  onCancel: () => void;
  onChange?: (value: T) => void;
  onDelete: () => void;
  onEdit: () => void;
  ItemComponent: ComponentType<ArrayFieldItemProps<T>>;
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
    onDelete,
    onEdit,
    onCancel,
    onChange,
    ItemComponent,
  }: ArrayFieldItemWrapperProps<T>,
  ref: Ref<HTMLLIElement>,
) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      ref={ref}
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className={itemVariants()}
      {...itemAnimationProps}
    >
      <ItemComponent
        item={item}
        isSortable={isSortable}
        isBeingEdited={isBeingEdited}
        onCancel={onCancel}
        onChange={onChange}
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

export function ArrayField<T extends object>({
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
  disabled,
  readOnly,
  ...props
}: ArrayFieldProps<T>) {
  const { confirm } = useDialog();

  const {
    items,
    setItems,
    editingItem,
    isAddingNew,
    startAdding,
    startEditing,
    cancelEditing,
    saveEditing,
    removeItem,
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

  const id = useId();

  const getState = () => {
    if (disabled) return 'disabled';
    if (readOnly) return 'readOnly';
    if (props['aria-invalid']) return 'invalid';
    return 'normal';
  };

  return (
    <LayoutGroup id={id}>
      <div className="flex flex-col items-start gap-4">
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={setItems}
          className={arrayFieldVariants()}
        >
          <AnimatePresence mode="popLayout">
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
                onEdit={() => startEditing(item._internalId)}
                onChange={saveEditing}
                isNewItem={!!item._draft}
                isBeingEdited={editingItem?._internalId === item._internalId}
                onCancel={cancelEditing}
                ItemComponent={ItemComponent}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
        <MotionButton
          key="add-button"
          size="sm"
          onClick={() => startAdding(itemTemplate() as T)}
          icon={<PlusIcon />}
          disabled={!!editingItem}
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
      </div>
    </LayoutGroup>
  );
}

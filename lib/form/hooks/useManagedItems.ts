import { useCallback, useMemo, useRef, useState } from 'react';
import { useInternalIds, type WithInternalId } from './useInternalIds';

/**
 * Managed properties added to array items for internal tracking.
 */
type ManagedProperties = {
  _internalId: string;
  _draft?: boolean;
};

/**
 * Item with managed properties (internal ID and optional draft flag) merged in.
 */
export type WithManagedProperties<T> = T & ManagedProperties;

/**
 * Configuration for the useManagedItems hook.
 */
type UseManagedItemsConfig<T> = {
  /** Optional function to extract an existing ID from an item. */
  getId?: (item: T) => string | undefined;
};

/**
 * Return type for the useManagedItems hook.
 */
type UseManagedItemsReturn<T extends object> = {
  // ─── Items ───────────────────────────────────────────────────────────────
  /** All items (both confirmed and draft) with managed properties. */
  items: WithManagedProperties<T>[];
  /** Update items - only triggers onChange for non-draft changes. */
  setItems: (items: WithManagedProperties<T>[]) => void;

  // ─── Editing State ───────────────────────────────────────────────────────
  /** The internal ID of the item currently being edited, or null if none. */
  editingId: string | null;
  /** The item currently being edited, or undefined if none. */
  editingItem: WithManagedProperties<T> | undefined;
  /** Whether any item is currently being edited. */
  isEditing: boolean;
  /** Whether the currently edited item is a new draft (vs editing existing). */
  isAddingNew: boolean;

  // ─── Editing Actions ─────────────────────────────────────────────────────
  /** Start adding a new item. Creates a draft and enters editing mode. */
  startAdding: (template: T) => void;
  /** Start editing an existing item by its internal ID. */
  startEditing: (internalId: string) => void;
  /** Cancel the current edit. If adding a new item, removes the draft. */
  cancelEditing: () => void;
  /** Save the current edit. Confirms draft if adding, or updates if editing existing. */
  saveEditing: (data: T) => void;

  // ─── Item Operations ─────────────────────────────────────────────────────
  /** Remove an item by its internal ID. */
  removeItem: (internalId: string) => void;
  /** Check if an item is a draft by its internal ID. */
  isDraft: (internalId: string) => boolean;
};

/**
 * Hook for managing arrays with stable internal IDs, draft support, and editing state.
 *
 * This hook provides a complete solution for managing editable array fields:
 * - Stable internal IDs for React keys
 * - Draft items that don't trigger onChange until confirmed
 * - Built-in editing state management
 *
 * Key behaviors:
 * - Adding a draft: Creates an item with _draft: true, does NOT call onChange
 * - Modifying a draft: Updates local state only, does NOT call onChange
 * - Confirming a draft: Removes _draft flag and calls onChange with all non-draft items
 * - Modifying non-drafts: Calls onChange immediately
 * - Deleting a draft: Removes from local state without calling onChange
 *
 * @example
 * ```tsx
 * function ItemList({ value, onChange }: {
 *   value: Item[];
 *   onChange: (items: Item[]) => void;
 * }) {
 *   const {
 *     items,
 *     editingItem,
 *     isEditing,
 *     isAddingNew,
 *     startAdding,
 *     cancelEditing,
 *     saveEditing,
 *     removeItem,
 *   } = useManagedItems(value, onChange);
 *
 *   return (
 *     <>
 *       {items.map((item) => (
 *         <Item
 *           key={item._internalId}
 *           item={item}
 *           onDelete={() => removeItem(item._internalId)}
 *         />
 *       ))}
 *       <button onClick={() => startAdding({ name: '' })}>Add</button>
 *       {isEditing && (
 *         <Editor
 *           item={editingItem}
 *           isNew={isAddingNew}
 *           onSave={saveEditing}
 *           onCancel={cancelEditing}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useManagedItems<T extends object>(
  value: T[],
  onChange: (items: T[]) => void,
  config?: UseManagedItemsConfig<T>,
): UseManagedItemsReturn<T> {
  // Use useInternalIds to manage the confirmed (non-draft) items
  const [confirmedItems, setConfirmedItems] = useInternalIds(value, onChange, {
    getId: config?.getId,
  });

  // Track draft items separately in local state
  const [draftItems, setDraftItems] = useState<WithManagedProperties<T>[]>([]);

  // Track insertion points for drafts (which confirmed item they follow)
  const draftInsertionRef = useRef<Map<string, string | null>>(new Map());

  // Track editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Combine confirmed and draft items, maintaining insertion order
  const items = useMemo((): WithManagedProperties<T>[] => {
    const result: WithManagedProperties<T>[] = [];
    const draftsToInsertAtEnd: WithManagedProperties<T>[] = [];

    // First, collect drafts that should be inserted at the end
    for (const draft of draftItems) {
      const insertAfter = draftInsertionRef.current.get(draft._internalId);
      if (insertAfter === null) {
        draftsToInsertAtEnd.push(draft);
      }
    }

    // Add confirmed items with their associated drafts
    for (const item of confirmedItems) {
      result.push(item as WithManagedProperties<T>);

      // Add any drafts that should be inserted after this item
      for (const draft of draftItems) {
        const insertAfter = draftInsertionRef.current.get(draft._internalId);
        if (insertAfter === item._internalId) {
          result.push(draft);
        }
      }
    }

    // Add drafts that go at the end
    result.push(...draftsToInsertAtEnd);

    return result;
  }, [confirmedItems, draftItems]);

  // Get the currently editing item
  const editingItem = useMemo(() => {
    if (!editingId) return undefined;
    return items.find((item) => item._internalId === editingId);
  }, [items, editingId]);

  // Derived editing state
  const isEditing = editingId !== null;
  const isAddingNew = editingItem?._draft ?? false;

  // Check if an item is a draft
  const isDraft = useCallback(
    (internalId: string): boolean => {
      return draftItems.some((d) => d._internalId === internalId);
    },
    [draftItems],
  );

  // Start adding a new item (creates draft and enters editing mode)
  const startAdding = useCallback(
    (template: T): void => {
      const internalId = crypto.randomUUID();
      const draftItem: WithManagedProperties<T> = {
        ...template,
        _internalId: internalId,
        _draft: true,
      };

      // Insert after the last item (or at beginning if empty)
      const lastItemId =
        confirmedItems.length > 0
          ? confirmedItems[confirmedItems.length - 1]!._internalId
          : null;
      draftInsertionRef.current.set(internalId, lastItemId);

      setDraftItems((prev) => [...prev, draftItem]);
      setEditingId(internalId);
    },
    [confirmedItems],
  );

  // Start editing an existing item
  const startEditing = useCallback((internalId: string): void => {
    setEditingId(internalId);
  }, []);

  // Cancel the current edit
  const cancelEditing = useCallback((): void => {
    if (editingId && isDraft(editingId)) {
      // Remove the draft item
      setDraftItems((prev) => prev.filter((d) => d._internalId !== editingId));
      draftInsertionRef.current.delete(editingId);
    }
    setEditingId(null);
  }, [editingId, isDraft]);

  // Save the current edit
  const saveEditing = useCallback(
    (data: T): void => {
      if (!editingId) return;

      if (isDraft(editingId)) {
        // Confirm the draft - add to confirmed items
        setDraftItems((prev) =>
          prev.filter((d) => d._internalId !== editingId),
        );

        const confirmedItem: WithInternalId<T> = {
          ...data,
          _internalId: editingId,
        };

        // Find insertion position
        const insertAfter = draftInsertionRef.current.get(editingId);
        draftInsertionRef.current.delete(editingId);

        let insertIndex = confirmedItems.length;
        if (insertAfter !== null && insertAfter !== undefined) {
          const afterIndex = confirmedItems.findIndex(
            (item) => item._internalId === insertAfter,
          );
          if (afterIndex !== -1) {
            insertIndex = afterIndex + 1;
          }
        }

        const newConfirmed = [...confirmedItems];
        newConfirmed.splice(insertIndex, 0, confirmedItem);
        setConfirmedItems(newConfirmed);
      } else {
        // Update existing confirmed item
        setConfirmedItems(
          confirmedItems.map((item) =>
            item._internalId === editingId
              ? { ...data, _internalId: editingId }
              : item,
          ),
        );
      }

      setEditingId(null);
    },
    [editingId, isDraft, confirmedItems, setConfirmedItems],
  );

  // Remove an item
  const removeItem = useCallback(
    (internalId: string): void => {
      // Clear editing if removing the edited item
      if (editingId === internalId) {
        setEditingId(null);
      }

      if (isDraft(internalId)) {
        // Remove draft locally
        setDraftItems((prev) =>
          prev.filter((d) => d._internalId !== internalId),
        );
        draftInsertionRef.current.delete(internalId);
      } else {
        // Remove confirmed item (triggers onChange)
        setConfirmedItems(
          confirmedItems.filter((item) => item._internalId !== internalId),
        );
      }
    },
    [editingId, isDraft, confirmedItems, setConfirmedItems],
  );

  // Set items - handles both draft and non-draft updates
  const setItems = useCallback(
    (newItems: WithManagedProperties<T>[]): void => {
      const newDrafts: WithManagedProperties<T>[] = [];
      const newConfirmed: WithInternalId<T>[] = [];

      for (const item of newItems) {
        if (item._draft) {
          newDrafts.push(item);
        } else {
          const { _draft: _, ...rest } = item;
          newConfirmed.push(rest as WithInternalId<T>);
        }
      }

      // Update drafts locally (no onChange)
      setDraftItems(newDrafts);

      // Update confirmed items (triggers onChange)
      const confirmedChanged =
        newConfirmed.length !== confirmedItems.length ||
        newConfirmed.some((item, i) => {
          const existing = confirmedItems[i];
          return !existing || existing._internalId !== item._internalId;
        });

      if (confirmedChanged) {
        setConfirmedItems(newConfirmed);
      }
    },
    [confirmedItems, setConfirmedItems],
  );

  return {
    // Items
    items,
    setItems,

    // Editing state
    editingId,
    editingItem,
    isEditing,
    isAddingNew,

    // Editing actions
    startAdding,
    startEditing,
    cancelEditing,
    saveEditing,

    // Item operations
    removeItem,
    isDraft,
  };
}

import { useCallback, useMemo, useRef, useState } from 'react';

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
  /** The item currently being edited, or undefined if none. */
  editingItem: WithManagedProperties<T> | undefined;
  /** True if editingItem is a newly added draft item (vs editing an existing one). */
  isAddingNew: boolean;

  // ─── Editing Actions ─────────────────────────────────────────────────────
  /** Start adding a new item. Creates a draft and starts editing it. */
  startAdding: (template: T) => void;
  /** Start editing an existing item by its internal ID. */
  startEditing: (internalId: string) => void;
  /** Cancel the current edit. Removes draft items, clears editing state. */
  cancelEditing: () => void;
  /** Save the current edit. Confirms drafts and calls onChange. */
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
 * - Draft items for newly added items that don't trigger onChange until confirmed
 * - Separate editing state tracked by ID (not draft flag)
 *
 * Key behaviors:
 * - `_draft` flag is only set on newly added items (via startAdding)
 * - `editingItem` is tracked by internal ID, separate from draft status
 * - startAdding: Creates an item with _draft: true and starts editing it
 * - startEditing: Sets the editing ID to an existing item (no draft flag)
 * - saveEditing: For drafts, removes _draft flag; for all items, calls onChange
 * - cancelEditing: Removes draft items, clears editing state
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
 *     startAdding,
 *     startEditing,
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
 *           onEdit={() => startEditing(item._internalId)}
 *           onDelete={() => removeItem(item._internalId)}
 *         />
 *       ))}
 *       <button onClick={() => startAdding({ name: '' })}>Add</button>
 *       {editingItem && (
 *         <Editor
 *           item={editingItem}
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
  // WeakMap ties internal ID lifespan to the original object for GC
  const idMapRef = useRef<WeakMap<T, string>>(new WeakMap());

  // Helper to get or create an internal ID for an item
  const getInternalId = useCallback(
    (item: T): string => {
      // If getId is provided and returns a value, use it directly
      if (config?.getId) {
        const existingId = config.getId(item);
        if (existingId !== undefined) {
          return existingId;
        }
      }
      // Otherwise, get or generate an internal id from the WeakMap
      let internalId = idMapRef.current.get(item);
      if (!internalId) {
        internalId = crypto.randomUUID();
        idMapRef.current.set(item, internalId);
      }
      return internalId;
    },
    [config],
  );

  // Combined state for atomic updates (prevents animation flickering)
  const [state, setState] = useState<{
    items: WithManagedProperties<T>[];
    editingId: string | null;
  }>(() => ({
    items: value.map((item) => ({
      ...item,
      _internalId: getInternalId(item),
    })),
    editingId: null,
  }));

  const { items, editingId } = state;

  // Sync with external value changes
  const prevValueRef = useRef(value);
  if (value !== prevValueRef.current) {
    prevValueRef.current = value;

    // Get current draft to preserve it
    const currentDraft = items.find((item) => item._draft === true);

    // Map incoming items with internal IDs
    const newConfirmed: WithManagedProperties<T>[] = value.map((item) => ({
      ...item,
      _internalId: getInternalId(item),
    }));

    // Merge: confirmed items from value + draft (if any)
    setState((prev) => ({
      ...prev,
      items: currentDraft ? [...newConfirmed, currentDraft] : newConfirmed,
    }));
  }

  // Derive editing state from editingId
  const editingItem = useMemo(
    () => items.find((item) => item._internalId === editingId),
    [items, editingId],
  );
  const isAddingNew = editingItem?._draft ?? false;

  // Check if an item is a draft
  const isDraft = useCallback(
    (internalId: string): boolean => {
      const item = items.find((i) => i._internalId === internalId);
      return item?._draft ?? false;
    },
    [items],
  );

  // Notify parent of non-draft items (strips managed properties, preserves ID mapping)
  const notifyChange = useCallback(
    (allItems: WithManagedProperties<T>[]) => {
      const confirmedItems = allItems
        .filter((item) => !item._draft)
        .map(({ _internalId, _draft, ...rest }) => {
          const stripped = rest as T;
          // Preserve the ID mapping for the stripped object so it's found on next render
          idMapRef.current.set(stripped, _internalId);
          return stripped;
        });
      onChange(confirmedItems);
    },
    [onChange],
  );

  // Start adding a new item (creates draft and sets editing state)
  const startAdding = useCallback((template: T): void => {
    const internalId = crypto.randomUUID();
    const draftItem: WithManagedProperties<T> = {
      ...template,
      _internalId: internalId,
      _draft: true,
    };

    // Remove any existing draft, add the new one, and set editing ID atomically
    setState((prev) => ({
      items: [...prev.items.filter((item) => !item._draft), draftItem],
      editingId: internalId,
    }));
  }, []);

  // Start editing an existing item (sets editing ID, no draft flag)
  const startEditing = useCallback((internalId: string): void => {
    setState((prev) => {
      // Skip if already editing this item
      if (prev.editingId === internalId) return prev;

      const targetItem = prev.items.find(
        (item) => item._internalId === internalId,
      );
      // Skip if target doesn't exist
      if (!targetItem) return prev;

      // Check if there's a draft to remove
      const hasDraft = prev.items.some((item) => item._draft);

      return {
        // Only filter if there's actually a draft to remove
        items: hasDraft
          ? prev.items.filter((item) => !item._draft)
          : prev.items,
        editingId: internalId,
      };
    });
  }, []);

  // Cancel the current edit (removes draft items if any, clears editing state)
  const cancelEditing = useCallback((): void => {
    setState((prev) => {
      // Skip if not currently editing
      if (prev.editingId === null) return prev;

      // Check if there's a draft to remove
      const hasDraft = prev.items.some((item) => item._draft);

      return {
        // Only filter if there's actually a draft to remove
        items: hasDraft
          ? prev.items.filter((item) => !item._draft)
          : prev.items,
        editingId: null,
      };
    });
  }, []);

  // Save the current edit (confirms drafts, updates existing items)
  const saveEditing = useCallback(
    (data: T): void => {
      if (!editingId) return;

      setState((prev) => {
        const editingIdx = prev.items.findIndex(
          (item) => item._internalId === editingId,
        );
        if (editingIdx === -1) return prev;

        const editingItemRef = prev.items[editingIdx]!;

        const newItems = prev.items.map((item, idx) => {
          if (idx !== editingIdx) return item;

          // Update the item with new data, removing _draft flag if present
          return {
            ...data,
            _internalId: editingItemRef._internalId,
          } as WithManagedProperties<T>;
        });

        // Notify parent with all non-draft items
        notifyChange(newItems);

        return { items: newItems, editingId: null };
      });
    },
    [editingId, notifyChange],
  );

  // Remove an item
  const removeItem = useCallback(
    (internalId: string): void => {
      const item = items.find((i) => i._internalId === internalId);
      const itemIsDraft = item?._draft ?? false;

      setState((prev) => {
        const newItems = prev.items.filter((i) => i._internalId !== internalId);

        // Only notify if removing a non-draft item
        if (!itemIsDraft) {
          notifyChange(newItems);
        }

        return { ...prev, items: newItems };
      });
    },
    [items, notifyChange],
  );

  // Set items - handles both draft and non-draft updates
  const setItems = useCallback(
    (newItems: WithManagedProperties<T>[]): void => {
      const hasNonDraftChanges = newItems.some((item) => !item._draft);

      setState((prev) => ({ ...prev, items: newItems }));

      if (hasNonDraftChanges) {
        notifyChange(newItems);
      }
    },
    [notifyChange],
  );

  return {
    // Items
    items,
    setItems,

    // Editing state (derived)
    editingItem,
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

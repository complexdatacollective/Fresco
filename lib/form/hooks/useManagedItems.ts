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

  // ─── Editing State (derived from items) ─────────────────────────────────
  /** The item currently being edited (_draft: true), or undefined if none. */
  editingItem: WithManagedProperties<T> | undefined;
  /** True if editingItem is a newly added item (vs editing an existing one). */
  isAddingNew: boolean;

  // ─── Editing Actions ─────────────────────────────────────────────────────
  /** Start adding a new item. Creates a draft (cancels any existing edit). */
  startAdding: (template: T) => void;
  /** Start editing an existing item. Marks it as draft (cancels any existing edit). */
  startEditing: (internalId: string) => void;
  /** Cancel the current edit. Reverts/removes the draft item. */
  cancelEditing: () => void;
  /** Save the current edit. Confirms the draft and calls onChange. */
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
 * - Single draft item that represents the item being edited
 * - Draft items don't trigger onChange until confirmed
 *
 * Key behaviors:
 * - Only one draft can exist at a time; if a draft exists, it's being edited
 * - `editingItem` is derived by finding the item with `_draft: true`
 * - Adding a draft: Creates an item with _draft: true (removes existing draft)
 * - Confirming a draft: Removes _draft flag and calls onChange
 * - Canceling: Removes the draft from local state without calling onChange
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

  // All items stored together - draft identified by _draft property
  const [items, setItemsInternal] = useState<WithManagedProperties<T>[]>(() =>
    value.map((item) => ({
      ...item,
      _internalId: getInternalId(item),
    })),
  );

  // Track whether current draft is a new item (vs editing existing)
  const isNewDraftRef = useRef<boolean>(false);
  // Store original item data when editing existing (for cancel/revert)
  const originalItemRef = useRef<WithManagedProperties<T> | null>(null);

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
    setItemsInternal(
      currentDraft ? [...newConfirmed, currentDraft] : newConfirmed,
    );
  }

  // Derive editing state: the draft item is the one being edited
  const editingItem = useMemo(() => items.find((item) => item._draft), [items]);
  const isAddingNew = editingItem ? isNewDraftRef.current : false;

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

  // Start adding a new item (creates draft, cancels any existing edit)
  const startAdding = useCallback((template: T): void => {
    const internalId = crypto.randomUUID();
    const draftItem: WithManagedProperties<T> = {
      ...template,
      _internalId: internalId,
      _draft: true,
    };

    isNewDraftRef.current = true;
    originalItemRef.current = null;

    // Cancel any existing edit and add new draft
    setItemsInternal((prev) => {
      // If editing an existing item, revert it first
      const reverted = prev.map((item) => {
        if (item._draft && originalItemRef.current) {
          return originalItemRef.current;
        }
        return item;
      });
      // Remove any new drafts and add the new one
      return [...reverted.filter((item) => !item._draft), draftItem];
    });
  }, []);

  // Start editing an existing item (marks it as draft)
  const startEditing = useCallback((internalId: string): void => {
    setItemsInternal((prev) => {
      const targetItem = prev.find((item) => item._internalId === internalId);
      if (!targetItem || targetItem._draft) return prev;

      // Store original for potential cancel
      originalItemRef.current = { ...targetItem };
      isNewDraftRef.current = false;

      // Cancel any existing edit first, then mark target as draft
      return prev.map((item) => {
        // Revert any existing editing item
        if (item._draft && originalItemRef.current) {
          return originalItemRef.current;
        }
        // Mark target as draft
        if (item._internalId === internalId) {
          return { ...item, _draft: true };
        }
        return item;
      });
    });
  }, []);

  // Cancel the current edit (removes new draft or reverts existing item)
  const cancelEditing = useCallback((): void => {
    setItemsInternal((prev) => {
      if (isNewDraftRef.current) {
        // New item: just remove the draft
        return prev.filter((item) => !item._draft);
      } else if (originalItemRef.current) {
        // Existing item: revert to original
        return prev.map((item) =>
          item._draft ? originalItemRef.current! : item,
        );
      }
      return prev;
    });
    isNewDraftRef.current = false;
    originalItemRef.current = null;
  }, []);

  // Save the current edit (confirms the draft)
  const saveEditing = useCallback(
    (data: T): void => {
      setItemsInternal((prev) => {
        const draftIdx = prev.findIndex((item) => item._draft);
        if (draftIdx === -1) return prev;

        const draft = prev[draftIdx]!;

        const newItems = prev.map((item, idx) => {
          if (idx !== draftIdx) return item;

          // Remove _draft flag when saving
          return {
            ...data,
            _internalId: draft._internalId,
          } as WithManagedProperties<T>;
        });

        // Notify parent with all non-draft items
        notifyChange(newItems);

        return newItems;
      });
      isNewDraftRef.current = false;
      originalItemRef.current = null;
    },
    [notifyChange],
  );

  // Remove an item
  const removeItem = useCallback(
    (internalId: string): void => {
      const item = items.find((i) => i._internalId === internalId);
      const itemIsDraft = item?._draft ?? false;

      setItemsInternal((prev) => {
        const newItems = prev.filter((i) => i._internalId !== internalId);

        // Only notify if removing a non-draft item
        if (!itemIsDraft) {
          notifyChange(newItems);
        }

        return newItems;
      });
    },
    [items, notifyChange],
  );

  // Set items - handles both draft and non-draft updates
  const setItems = useCallback(
    (newItems: WithManagedProperties<T>[]): void => {
      const hasNonDraftChanges = newItems.some((item) => !item._draft);

      setItemsInternal(newItems);

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

import { useCallback, useMemo, useRef } from 'react';

/**
 * Item with internal ID merged in.
 */
export type WithInternalId<T> = T & { _internalId: string };

/**
 * Configuration for the useInternalIds hook.
 */
type UseInternalIdsConfig<T> = {
  /** Optional function to extract an existing ID from an item. If not provided, all items use generated internal IDs. */
  getId?: (item: T) => string | undefined;
};

/**
 * Hook for managing arrays with stable internal IDs, similar to useState.
 *
 * Returns a tuple of [items with IDs, setter function] that mirrors the useState API.
 * The items have `_internalId` merged in for use as React keys. When the setter is called,
 * the `_internalId` is stripped before calling the onChange callback.
 *
 * Internal IDs are preserved across updates using a WeakMap, ensuring stable React keys
 * even when object references change.
 *
 * @example
 * ```tsx
 * type Attribute = { variable: string; value: boolean };
 *
 * function AttributeList({ value, onChange }: {
 *   value: Attribute[];
 *   onChange: (items: Attribute[]) => void;
 * }) {
 *   const [items, setItems] = useInternalIds(value, onChange);
 *
 *   // Render with stable keys
 *   return items.map((item) => (
 *     <Item key={item._internalId} item={item} />
 *   ));
 *
 *   // Add item
 *   const handleAdd = () => {
 *     setItems([...items, { variable: 'new', value: false, _internalId: crypto.randomUUID() }]);
 *   };
 *
 *   // Remove item
 *   const handleRemove = (id: string) => {
 *     setItems(items.filter(i => i._internalId !== id));
 *   };
 *
 *   // Update item
 *   const handleUpdate = (id: string, updates: Partial<Attribute>) => {
 *     setItems(items.map(i => i._internalId === id ? { ...i, ...updates } : i));
 *   };
 * }
 * ```
 */
export function useInternalIds<T extends object>(
  value: T[],
  onChange: (items: T[]) => void,
  config?: UseInternalIdsConfig<T>,
): [WithInternalId<T>[], (items: WithInternalId<T>[]) => void] {
  const { getId } = config ?? {};
  const idMapRef = useRef<WeakMap<T, string>>(new WeakMap());

  // Get or generate an internal ID for an item
  const getInternalId = useCallback(
    (item: T): string => {
      // If getId is provided and returns a value, use it
      if (getId) {
        const existingId = getId(item);
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
    [getId],
  );

  // Convert value array to items with internal IDs merged in
  const internalItems = useMemo((): WithInternalId<T>[] => {
    return value.map((item) => ({
      ...item,
      _internalId: getInternalId(item),
    }));
  }, [value, getInternalId]);

  // Setter that strips internal IDs and preserves mappings
  const setInternalItems = useCallback(
    (newItems: WithInternalId<T>[]): void => {
      const strippedItems = newItems.map((item) => {
        const { _internalId, ...rest } = item;
        const stripped = rest as T;
        // Preserve the ID mapping for the stripped object so it's found on next render
        idMapRef.current.set(stripped, _internalId);
        return stripped;
      });
      onChange(strippedItems);
    },
    [onChange],
  );

  return [internalItems, setInternalItems];
}

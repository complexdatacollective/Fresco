import { useCallback, useId, useMemo, useRef, useState } from 'react';

/**
 * Internal wrapper type that associates each item with a stable key.
 * This ensures consistent identity across reorders for React and Motion.
 */
export type FieldArrayItemWrapper<T> = {
  _key: string;
  data: T;
};

export type FieldArrayFields<T = Record<string, unknown>> = {
  /**
   * The array of items wrapped with stable keys.
   * Use this with Motion's Reorder.Group: `values={fields.items}`
   */
  items: FieldArrayItemWrapper<T>[];

  /**
   * Callback for Motion's Reorder.Group onReorder.
   * Updates the internal order when items are drag-reordered.
   */
  handleReorder: (newItems: FieldArrayItemWrapper<T>[]) => void;

  /**
   * Iterates over the array and calls the callback for each item.
   * Returns an array of rendered elements with proper keys.
   *
   * The callback receives:
   * - item: The wrapped item with `_key` and `data` properties
   * - index: The current index in the array
   * - fields: The fields object for array operations
   *
   * Use `item._key` as the React key and for field names to ensure
   * stable field registrations across reorders.
   */
  map: (
    callback: (
      item: FieldArrayItemWrapper<T>,
      index: number,
      fields: FieldArrayFields<T>,
    ) => React.ReactNode,
  ) => React.ReactNode[];

  /**
   * Iterates over the array, calling the callback for each item.
   */
  forEach: (
    callback: (
      item: FieldArrayItemWrapper<T>,
      index: number,
      fields: FieldArrayFields<T>,
    ) => void,
  ) => void;

  /**
   * Adds a value to the end of the array.
   */
  push: (value: T) => void;

  /**
   * Removes the last item from the array.
   */
  pop: () => void;

  /**
   * Adds a value to the beginning of the array.
   */
  unshift: (value: T) => void;

  /**
   * Removes the first item from the array.
   */
  shift: () => void;

  /**
   * Inserts a value at the given index.
   */
  insert: (index: number, value: T) => void;

  /**
   * Removes the item at the given index.
   */
  remove: (index: number) => void;

  /**
   * Removes the item by its stable key.
   */
  removeByKey: (key: string) => void;

  /**
   * Swaps the items at the two given indices.
   */
  swap: (indexA: number, indexB: number) => void;

  /**
   * Moves an item from one index to another.
   */
  move: (from: number, to: number) => void;

  /**
   * Replaces all items in the array.
   */
  replace: (newValue: T[]) => void;

  /**
   * Updates the item at the given index.
   */
  update: (index: number, value: T) => void;

  /**
   * The number of items in the array.
   */
  length: number;

  /**
   * The name of the field array (for constructing nested field names).
   */
  name: string;

  /**
   * Gets the data at a specific index.
   */
  get: (index: number) => T | undefined;

  /**
   * Gets the data by its stable key.
   */
  getByKey: (key: string) => T | undefined;
};

export type UseFieldArrayMeta = {
  isDirty: boolean;
  isTouched: boolean;
};

export type UseFieldArrayConfig<T = Record<string, unknown>> = {
  name: string;
  initialValue?: T[];
};

export type UseFieldArrayReturn<T = Record<string, unknown>> = {
  id: string;
  fields: FieldArrayFields<T>;
  meta: UseFieldArrayMeta;
};

/**
 * Hook for managing arrays of fields in forms.
 * Inspired by redux-form's FieldArray but adapted for our zustand-based form system.
 *
 * This hook manages the array structure locally. The nested Field components
 * register themselves with the form store using stable key-based paths.
 *
 * IMPORTANT: Use `item._key` in field names instead of index to ensure
 * field values are preserved during reordering.
 *
 * @example
 * ```tsx
 * const { fields, meta } = useFieldArray<Person>({
 *   name: 'people',
 *   initialValue: [{ firstName: 'John', lastName: 'Doe' }]
 * });
 *
 * return (
 *   <Reorder.Group values={fields.items} onReorder={fields.handleReorder}>
 *     {fields.map((item, index) => (
 *       <Reorder.Item key={item._key} value={item}>
 *         <Field
 *           name={`people.${item._key}.firstName`}
 *           component={Input}
 *           label="First Name"
 *           initialValue={item.data.firstName}
 *         />
 *         <button onClick={() => fields.removeByKey(item._key)}>Remove</button>
 *       </Reorder.Item>
 *     ))}
 *   </Reorder.Group>
 * );
 * ```
 */
export function useFieldArray<T = Record<string, unknown>>(
  config: UseFieldArrayConfig<T>,
): UseFieldArrayReturn<T> {
  const id = useId();
  const keyCounterRef = useRef(0);

  // Generate a unique key for a new item
  const generateKey = useCallback((): string => {
    return `${config.name}_${keyCounterRef.current++}`;
  }, [config.name]);

  // Wrap an item with a stable key
  const wrapItem = useCallback(
    (data: T): FieldArrayItemWrapper<T> => ({
      _key: generateKey(),
      data,
    }),
    [generateKey],
  );

  // Initialize items with stable keys
  const [items, setItems] = useState<FieldArrayItemWrapper<T>[]>(() =>
    (config.initialValue ?? []).map((data) => ({
      _key: `${config.name}_${keyCounterRef.current++}`,
      data,
    })),
  );

  const [isDirty, setIsDirty] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  // Memoize items for stable reference in callbacks
  const currentItems = useMemo(() => items, [items]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    setIsTouched(true);
  }, []);

  // Handler for Motion's Reorder.Group onReorder
  const handleReorder = useCallback(
    (newItems: FieldArrayItemWrapper<T>[]) => {
      setItems(newItems);
      markDirty();
    },
    [markDirty],
  );

  const push = useCallback(
    (value: T) => {
      setItems((prev) => [...prev, wrapItem(value)]);
      markDirty();
    },
    [markDirty, wrapItem],
  );

  const pop = useCallback(() => {
    setItems((prev) => prev.slice(0, -1));
    markDirty();
  }, [markDirty]);

  const unshift = useCallback(
    (value: T) => {
      setItems((prev) => [wrapItem(value), ...prev]);
      markDirty();
    },
    [markDirty, wrapItem],
  );

  const shift = useCallback(() => {
    setItems((prev) => prev.slice(1));
    markDirty();
  }, [markDirty]);

  const insert = useCallback(
    (index: number, value: T) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems.splice(index, 0, wrapItem(value));
        return newItems;
      });
      markDirty();
    },
    [markDirty, wrapItem],
  );

  const remove = useCallback(
    (index: number) => {
      setItems((prev) => prev.filter((_, i) => i !== index));
      markDirty();
    },
    [markDirty],
  );

  const removeByKey = useCallback(
    (key: string) => {
      setItems((prev) => prev.filter((item) => item._key !== key));
      markDirty();
    },
    [markDirty],
  );

  const swap = useCallback(
    (indexA: number, indexB: number) => {
      setItems((prev) => {
        if (
          indexA < 0 ||
          indexA >= prev.length ||
          indexB < 0 ||
          indexB >= prev.length
        ) {
          return prev;
        }
        const newItems = [...prev];
        const temp = newItems[indexA]!;
        newItems[indexA] = newItems[indexB]!;
        newItems[indexB] = temp;
        return newItems;
      });
      markDirty();
    },
    [markDirty],
  );

  const move = useCallback(
    (from: number, to: number) => {
      setItems((prev) => {
        if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) {
          return prev;
        }
        const newItems = [...prev];
        const [removed] = newItems.splice(from, 1);
        newItems.splice(to, 0, removed!);
        return newItems;
      });
      markDirty();
    },
    [markDirty],
  );

  const replace = useCallback(
    (newValue: T[]) => {
      setItems(newValue.map((data) => wrapItem(data)));
      markDirty();
    },
    [markDirty, wrapItem],
  );

  const update = useCallback(
    (index: number, value: T) => {
      setItems((prev) => {
        if (index < 0 || index >= prev.length) {
          return prev;
        }
        const newItems = [...prev];
        // Preserve the key when updating
        newItems[index] = { ...newItems[index]!, data: value };
        return newItems;
      });
      markDirty();
    },
    [markDirty],
  );

  const get = useCallback(
    (index: number): T | undefined => {
      return currentItems[index]?.data;
    },
    [currentItems],
  );

  const getByKey = useCallback(
    (key: string): T | undefined => {
      return currentItems.find((item) => item._key === key)?.data;
    },
    [currentItems],
  );

  const map = useCallback(
    (
      callback: (
        item: FieldArrayItemWrapper<T>,
        index: number,
        fields: FieldArrayFields<T>,
      ) => React.ReactNode,
    ): React.ReactNode[] => {
      const fieldsForCallback: FieldArrayFields<T> = {
        items: currentItems,
        handleReorder,
        map,
        forEach: (cb) => {
          currentItems.forEach((item, index) => {
            cb(item, index, fieldsForCallback);
          });
        },
        push,
        pop,
        unshift,
        shift,
        insert,
        remove,
        removeByKey,
        swap,
        move,
        replace,
        update,
        get,
        getByKey,
        length: currentItems.length,
        name: config.name,
      };

      return currentItems.map((item, index) =>
        callback(item, index, fieldsForCallback),
      );
    },
    [
      currentItems,
      handleReorder,
      config.name,
      push,
      pop,
      unshift,
      shift,
      insert,
      remove,
      removeByKey,
      swap,
      move,
      replace,
      update,
      get,
      getByKey,
    ],
  );

  const forEach = useCallback(
    (
      callback: (
        item: FieldArrayItemWrapper<T>,
        index: number,
        fields: FieldArrayFields<T>,
      ) => void,
    ): void => {
      const fieldsForCallback: FieldArrayFields<T> = {
        items: currentItems,
        handleReorder,
        map,
        forEach,
        push,
        pop,
        unshift,
        shift,
        insert,
        remove,
        removeByKey,
        swap,
        move,
        replace,
        update,
        get,
        getByKey,
        length: currentItems.length,
        name: config.name,
      };

      currentItems.forEach((item, index) => {
        callback(item, index, fieldsForCallback);
      });
    },
    [
      currentItems,
      handleReorder,
      config.name,
      map,
      push,
      pop,
      unshift,
      shift,
      insert,
      remove,
      removeByKey,
      swap,
      move,
      replace,
      update,
      get,
      getByKey,
    ],
  );

  const fields: FieldArrayFields<T> = {
    items: currentItems,
    handleReorder,
    map,
    forEach,
    push,
    pop,
    unshift,
    shift,
    insert,
    remove,
    removeByKey,
    swap,
    move,
    replace,
    update,
    get,
    getByKey,
    length: currentItems.length,
    name: config.name,
  };

  const meta: UseFieldArrayMeta = {
    isDirty,
    isTouched,
  };

  return {
    id,
    fields,
    meta,
  };
}

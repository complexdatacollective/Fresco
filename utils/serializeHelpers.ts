// Convert string | boolean | Date to string
export const getStringValue = (value: string | boolean | Date) => {
  if (typeof value === 'boolean') return value.toString();
  if (value instanceof Date) return value.toISOString();
  return value;
};

/**
 * Type helper that converts object types to their serialized form,
 * making them compatible with Redux (which requires serializable values).
 *
 * Converts:
 * - Date → string
 * - Nested objects are recursively serialized
 */
export type Serialize<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialize<U>[]
    : T extends object
      ? { [K in keyof T]: Serialize<T[K]> }
      : T;

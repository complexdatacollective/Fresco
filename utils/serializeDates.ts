type SerializableObject = Record<string, unknown>;

/**
 * Recursively converts all Date objects in an object to ISO strings
 * @param obj The object to process
 * @returns A new object with all Dates converted to strings
 */
export function serializeDates<T extends SerializableObject>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeDates(item)) as unknown as T;
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    // Skip null and undefined values
    if (value === null || value === undefined) {
      acc[key] = value;
      return acc;
    }

    // Handle Date objects
    if (value instanceof Date) {
      acc[key] = value.toISOString();
      return acc;
    }

    // Recursively process nested objects
    if (typeof value === 'object') {
      acc[key] = serializeDates(value);
      return acc;
    }

    // Keep non-object values as is
    acc[key] = value;
    return acc;
  }, {} as T);
}

/**
 * Parses a path string into segments, handling both dot notation and bracket notation.
 * e.g., "people[0].firstName" -> ["people", "0", "firstName"]
 */
function parsePath(path: string): string[] {
  const segments: string[] = [];
  let current = '';

  for (const char of path) {
    if (char === '.') {
      if (current) {
        segments.push(current);
        current = '';
      }
    } else if (char === '[') {
      if (current) {
        segments.push(current);
        current = '';
      }
    } else if (char === ']') {
      if (current) {
        segments.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

/**
 * Checks if a string represents an array index (non-negative integer).
 */
function isArrayIndex(key: string): boolean {
  return /^\d+$/.test(key);
}

/**
 * Gets a value from an object at a given path.
 * Supports both dot notation (obj.key) and bracket notation (arr[0]).
 * If the path does not exist, it returns undefined.
 * If the path is empty, it returns the entire object.
 */
export function getValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path) return obj;

  const segments = parsePath(path);

  return segments.reduce((current: unknown, key) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current) && isArrayIndex(key)) {
      return current[parseInt(key, 10)];
    }

    if (typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }

    return undefined;
  }, obj);
}

/**
 * Sets a value at a given path in an object, creating nested objects/arrays as needed.
 * Supports both dot notation (obj.key) and bracket notation (arr[0]).
 */
export function setValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const segments = parsePath(path);

  if (segments.length === 0) return;

  const lastKey = segments.pop()!;

  // Navigate to the parent, creating containers as needed
  let current: unknown = obj;

  for (let i = 0; i < segments.length; i++) {
    const key = segments[i]!;
    const nextKey = segments[i + 1] ?? lastKey;
    const needsArray = isArrayIndex(nextKey);

    if (Array.isArray(current)) {
      const index = parseInt(key, 10);
      current[index] ??= needsArray ? [] : {};
      current = current[index];
    } else if (typeof current === 'object' && current !== null) {
      const record = current as Record<string, unknown>;
      record[key] ??= needsArray ? [] : {};
      current = record[key];
    }
  }

  // Set the value at the final key
  if (Array.isArray(current) && isArrayIndex(lastKey)) {
    current[parseInt(lastKey, 10)] = value;
  } else if (typeof current === 'object' && current !== null) {
    (current as Record<string, unknown>)[lastKey] = value;
  }
}

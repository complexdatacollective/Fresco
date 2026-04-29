type PathSegment = { key: string; index?: number };

/**
 * Parses a path string into segments, supporting both dot notation and bracket notation.
 * Examples:
 *   "steps[0].egg-parent.name" -> [{ key: "steps", index: 0 }, { key: "egg-parent" }, { key: "name" }]
 *   "simple.path" -> [{ key: "simple" }, { key: "path" }]
 *   "data[0].items[1].value" -> [{ key: "data", index: 0 }, { key: "items", index: 1 }, { key: "value" }]
 */
function parsePath(path: string): PathSegment[] {
  if (!path) return [];

  return path.split('.').map((part) => {
    const bracketMatch = /^([^[]*)\[(\d+)\]$/.exec(part);
    if (bracketMatch) {
      return { key: bracketMatch[1]!, index: Number(bracketMatch[2]) };
    }
    return { key: part };
  });
}

/**
 * Gets a value from an object at a given path.
 * Supports both dot notation ("a.b.c") and bracket notation ("a[0].b").
 * If the path does not exist, it returns undefined.
 * If the path is empty, it returns the entire object.
 */
export function getValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path) return obj;

  const segments = parsePath(path);
  let current: unknown = obj;

  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return undefined;

    current = (current as Record<string, unknown>)[segment.key];

    if (segment.index !== undefined) {
      if (!Array.isArray(current)) return undefined;
      current = current[segment.index];
    }
  }

  return current;
}

/**
 * Sets a value at a given path in an object, creating nested objects/arrays as needed.
 * Supports both dot notation ("a.b.c") and bracket notation ("a[0].b").
 * Bracket notation creates real arrays; dot notation creates objects.
 */
export function setValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const segments = parsePath(path);
  if (segments.length === 0) {
    obj[path] = value;
    return;
  }

  let current: Record<string, unknown> = obj;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const isLast = i === segments.length - 1;

    if (segment.index !== undefined) {
      if (!Array.isArray(current[segment.key])) {
        current[segment.key] = [];
      }
      const arr = current[segment.key] as unknown[];

      if (isLast) {
        arr[segment.index] = value;
      } else {
        if (
          arr[segment.index] == null ||
          typeof arr[segment.index] !== 'object'
        ) {
          arr[segment.index] = {};
        }
        current = arr[segment.index] as Record<string, unknown>;
      }
    } else {
      if (isLast) {
        current[segment.key] = value;
      } else {
        if (
          current[segment.key] == null ||
          typeof current[segment.key] !== 'object'
        ) {
          current[segment.key] = {};
        }
        current = current[segment.key] as Record<string, unknown>;
      }
    }
  }
}

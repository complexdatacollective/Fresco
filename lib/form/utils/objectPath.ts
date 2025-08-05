/**
 * Gets a value from an object at a given path.
 * If the path does not exist, it returns undefined.
 * If the path is empty, it returns the entire object.
 */
export function getValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path) return obj;
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Sets a value at a given path in an object, creating nested objects as needed.
 */
export function setValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current: Record<string, unknown>, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key] as Record<string, unknown>;
  }, obj);
  target[lastKey] = value;
}

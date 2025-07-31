export function getValue(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function setValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

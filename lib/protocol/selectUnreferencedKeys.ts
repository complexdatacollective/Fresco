/**
 * From a set of storage keys uploaded during an import, returns those that are
 * safe to delete after a failure: de-duplicated, non-empty, and not present in
 * `referencedKeys`. `referencedKeys` are the keys still in use by existing
 * assets or protocols, so blobs belonging to other protocols are never removed.
 */
export function selectUnreferencedKeys(
  uploadedKeys: string[],
  referencedKeys: Iterable<string>,
): string[] {
  const referenced = new Set(referencedKeys);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const key of uploadedKeys) {
    if (key.length === 0 || seen.has(key) || referenced.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(key);
  }

  return result;
}

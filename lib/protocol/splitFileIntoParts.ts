/**
 * Splits a file into ordered pieces of at most `partBytes` each. Pieces are
 * named `part-000`, `part-001`, … so each upload has a unique, stable name that
 * maps back to its position. Concatenating the returned pieces in array order
 * reproduces the original file byte-for-byte.
 */
export function splitFileIntoParts(file: File, partBytes: number): File[] {
  if (!Number.isFinite(partBytes) || partBytes <= 0) {
    throw new Error('partBytes must be a positive, finite number');
  }

  const partCount = Math.ceil(file.size / partBytes);
  const parts: File[] = [];

  for (let index = 0; index < partCount; index++) {
    const start = index * partBytes;
    const end = Math.min(start + partBytes, file.size);
    const name = `part-${String(index).padStart(3, '0')}`;
    parts.push(
      new File([file.slice(start, end)], name, {
        type: 'application/octet-stream',
      }),
    );
  }

  return parts;
}

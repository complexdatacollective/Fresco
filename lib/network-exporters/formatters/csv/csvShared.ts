import { Readable } from 'node:stream';

export const csvEOL = '\r\n';

const DIFFICULT_CHARACTERS = ['"', ',', '\r', '\n'];

const containsDifficultCharacters = (value: string) =>
  DIFFICULT_CHARACTERS.some((c) => value.includes(c));

const quoteValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

export function sanitizeCellValue(
  value: unknown,
): string | number | boolean | null | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value === 'object') {
    let serialized: string;
    try {
      serialized = JSON.stringify(value) ?? '';
    } catch {
      serialized = '';
    }
    return quoteValue(serialized);
  }
  if (typeof value === 'string') {
    return containsDifficultCharacters(value) ? quoteValue(value) : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  // bigint, symbol, function — convert safely
  return `${value as bigint}`;
}

export function toReadable(rows: Iterable<string>): Readable {
  return Readable.from(rows);
}

import { describe, expect, it } from 'vitest';
import { splitFileIntoParts } from '~/lib/protocol/splitFileIntoParts';

function makeFile(bytes: number): File {
  return new File([new Uint8Array(bytes)], 'protocol.netcanvas');
}

describe('splitFileIntoParts', () => {
  it('splits into ceil(size / partBytes) parts with a remainder last part', () => {
    const parts = splitFileIntoParts(makeFile(2500), 1000);
    expect(parts).toHaveLength(3);
    expect(parts.map((p) => p.size)).toEqual([1000, 1000, 500]);
  });

  it('returns a single part for a file at or below the part size', () => {
    const parts = splitFileIntoParts(makeFile(800), 1000);
    expect(parts).toHaveLength(1);
    expect(parts[0]?.size).toBe(800);
  });

  it('names parts in zero-padded order', () => {
    const parts = splitFileIntoParts(makeFile(2500), 1000);
    expect(parts.map((p) => p.name)).toEqual([
      'part-000',
      'part-001',
      'part-002',
    ]);
  });

  it('reproduces the original bytes exactly when parts are concatenated', async () => {
    const original = new Uint8Array(2500).map((_, i) => i % 256);
    const file = new File([original], 'protocol.netcanvas');
    const parts = splitFileIntoParts(file, 1000);
    const recombined = new Uint8Array(await new Blob(parts).arrayBuffer());
    expect(recombined).toEqual(original);
  });
});

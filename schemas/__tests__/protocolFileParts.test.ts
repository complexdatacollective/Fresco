import { describe, expect, it } from 'vitest';
import { protocolFilePartsSchema } from '~/schemas/protocolFileParts';

describe('protocolFilePartsSchema', () => {
  it('parses a valid ordered parts array', () => {
    const value = [
      { key: 'k0', url: 'https://ut/0', size: 10 },
      { key: 'k1', url: 'https://ut/1', size: 5 },
    ];
    expect(protocolFilePartsSchema.parse(value)).toEqual(value);
  });

  it('rejects a malformed parts value', () => {
    expect(() => protocolFilePartsSchema.parse({ not: 'an array' })).toThrow();
    expect(() =>
      protocolFilePartsSchema.parse([{ key: 'k', url: 'u' }]),
    ).toThrow();
  });
});

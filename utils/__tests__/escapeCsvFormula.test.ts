import { describe, expect, it } from 'vitest';
import { escapeCsvFormula } from '../escapeCsvFormula';

describe('escapeCsvFormula', () => {
  it.each(['=1+1', '+1', '-1', '@SUM(A1)', '\tcmd', '\rx'])(
    'prefixes a single quote for formula-leading value %j',
    (input) => {
      expect(escapeCsvFormula(input)).toBe(`'${input}`);
    },
  );

  it('leaves ordinary strings unchanged', () => {
    expect(escapeCsvFormula('hello')).toBe('hello');
    expect(escapeCsvFormula('a=b+c')).toBe('a=b+c');
    expect(escapeCsvFormula('')).toBe('');
  });

  it('passes non-string values through untouched', () => {
    expect(escapeCsvFormula(42)).toBe(42);
    expect(escapeCsvFormula(null)).toBe(null);
    expect(escapeCsvFormula(undefined)).toBe(undefined);
    expect(escapeCsvFormula(true)).toBe(true);
  });
});

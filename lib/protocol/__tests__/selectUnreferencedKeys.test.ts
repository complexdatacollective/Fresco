import { describe, expect, it } from 'vitest';
import { selectUnreferencedKeys } from '~/lib/protocol/selectUnreferencedKeys';

describe('selectUnreferencedKeys', () => {
  it('returns all keys when none are referenced', () => {
    expect(selectUnreferencedKeys(['a', 'b'], [])).toEqual(['a', 'b']);
  });

  it('excludes keys referenced by existing assets or protocols', () => {
    expect(selectUnreferencedKeys(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
  });

  it('de-duplicates repeated keys', () => {
    expect(selectUnreferencedKeys(['a', 'a', 'b'], [])).toEqual(['a', 'b']);
  });

  it('drops empty keys', () => {
    expect(selectUnreferencedKeys(['', 'a', ''], [])).toEqual(['a']);
  });

  it('returns an empty array when every key is referenced', () => {
    expect(selectUnreferencedKeys(['a', 'b'], ['a', 'b'])).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { isUncategorised } from '~/lib/interviewer/Interfaces/CategoricalBin/useCategoricalBins';

describe('isUncategorised', () => {
  it('treats a node with stored 0 on the active variable as categorised', () => {
    expect(isUncategorised({ v: 0 }, 'v', undefined)).toBe(false);
  });

  it('treats null on the active variable as uncategorised', () => {
    expect(isUncategorised({ v: null }, 'v', undefined)).toBe(true);
  });

  it('treats a missing active variable as uncategorised', () => {
    expect(isUncategorised({}, 'v', undefined)).toBe(true);
  });

  it('treats a node with only the other variable set as categorised', () => {
    expect(isUncategorised({ o: 'custom' }, 'v', 'o')).toBe(false);
  });

  it('treats a falsy other variable value as categorised', () => {
    expect(isUncategorised({ o: 0 }, 'v', 'o')).toBe(false);
  });

  it('treats both variables unset as uncategorised', () => {
    expect(isUncategorised({}, 'v', 'o')).toBe(true);
    expect(isUncategorised({ v: null, o: null }, 'v', 'o')).toBe(true);
  });

  it('treats an empty array on the active variable as uncategorised', () => {
    expect(isUncategorised({ v: [] }, 'v', undefined)).toBe(true);
  });

  it('treats a non-empty array on the active variable as categorised', () => {
    expect(isUncategorised({ v: ['a'] }, 'v', undefined)).toBe(false);
  });

  it('treats an empty array on the other variable as uncategorised', () => {
    expect(isUncategorised({ o: [] }, 'v', 'o')).toBe(true);
  });
});

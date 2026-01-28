import { describe, expect, it } from 'vitest';
import {
  ancestor,
  chaseup,
  createMatrix,
  isSpouseMarker,
  matchIndex,
  pmax,
  pmin,
  rank,
  tableCounts,
  which,
} from '~/lib/pedigree-layout/utils';

describe('createMatrix', () => {
  it('creates a 2D array of correct dimensions', () => {
    const m = createMatrix(3, 4, 0);
    expect(m.length).toBe(3);
    expect(m[0]!.length).toBe(4);
    expect(m[2]![3]).toBe(0);
  });
});

describe('matchIndex', () => {
  it('returns the index of the value', () => {
    expect(matchIndex(5, [1, 3, 5, 7])).toBe(2);
  });

  it('returns -1 when not found', () => {
    expect(matchIndex(9, [1, 3, 5, 7])).toBe(-1);
  });
});

describe('which', () => {
  it('returns indices where condition is true', () => {
    expect(which([false, true, false, true])).toEqual([1, 3]);
  });

  it('returns empty for all false', () => {
    expect(which([false, false])).toEqual([]);
  });
});

describe('pmin / pmax', () => {
  it('computes parallel min', () => {
    expect(pmin([3, 1, 5], [2, 4, 0])).toEqual([2, 1, 0]);
  });

  it('computes parallel max', () => {
    expect(pmax([3, 1, 5], [2, 4, 0])).toEqual([3, 4, 5]);
  });
});

describe('rank', () => {
  it('assigns ranks to sorted values', () => {
    expect(rank([10, 30, 20])).toEqual([1, 3, 2]);
  });

  it('handles ties with average rank', () => {
    expect(rank([1, 2, 2, 3])).toEqual([1, 2.5, 2.5, 4]);
  });
});

describe('tableCounts', () => {
  it('counts occurrences', () => {
    const counts = tableCounts([1, 2, 2, 3, 1, 1]);
    expect(counts.get(1)).toBe(3);
    expect(counts.get(2)).toBe(2);
    expect(counts.get(3)).toBe(1);
  });
});

describe('ancestor', () => {
  it('returns all ancestors of a person', () => {
    // 0=grandpa, 1=grandma, 2=father, 3=mother, 4=child
    const mom = [-1, -1, 1, -1, 3];
    const dad = [-1, -1, 0, -1, 2];
    const anc = ancestor(4, mom, dad);
    expect(anc).toContain(2); // father
    expect(anc).toContain(3); // mother
    expect(anc).toContain(0); // grandpa
    expect(anc).toContain(1); // grandma
    expect(anc).not.toContain(4); // not self
  });

  it('returns empty for a founder', () => {
    const anc = ancestor(0, [-1, -1], [-1, -1]);
    expect(anc).toEqual([]);
  });
});

describe('chaseup', () => {
  it('returns all ancestors', () => {
    const mom = [-1, -1, 1, -1, 3];
    const dad = [-1, -1, 0, -1, 2];
    const result = chaseup([4], mom, dad);
    expect(result).toContain(4);
    expect(result).toContain(2);
    expect(result).toContain(3);
    expect(result).toContain(0);
    expect(result).toContain(1);
  });
});

describe('isSpouseMarker', () => {
  it('detects .5 values', () => {
    expect(isSpouseMarker(3.5)).toBe(true);
    expect(isSpouseMarker(3)).toBe(false);
    expect(isSpouseMarker(0)).toBe(false);
  });
});

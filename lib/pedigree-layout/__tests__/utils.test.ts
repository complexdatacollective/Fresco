import { describe, expect, it } from 'vitest';
import { type ParentConnection } from '~/lib/pedigree-layout/types';
import {
  ancestor,
  chaseup,
  createMatrix,
  isGroupMarker,
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
  it('finds all ancestors of a person via parents array', () => {
    // grandpa=0, grandma=1, father=2, mother=3, child=4
    const parents: ParentConnection[][] = [
      [],
      [], // grandpa, grandma: founders
      [
        { parentIndex: 0, edgeType: 'parent' },
        { parentIndex: 1, edgeType: 'parent' },
      ],
      [], // mother: founder
      [
        { parentIndex: 2, edgeType: 'parent' },
        { parentIndex: 3, edgeType: 'parent' },
      ],
    ];
    const result = ancestor(4, parents);
    expect(result).toContain(2); // father
    expect(result).toContain(3); // mother
    expect(result).toContain(0); // grandpa
    expect(result).toContain(1); // grandma
    expect(result).not.toContain(4); // not self
  });

  it('returns empty for a founder', () => {
    const parents: ParentConnection[][] = [[]];
    expect(ancestor(0, parents)).toEqual([]);
  });

  it('handles single parent', () => {
    const parents: ParentConnection[][] = [
      [],
      [{ parentIndex: 0, edgeType: 'parent' }],
    ];
    expect(ancestor(1, parents)).toEqual([0]);
  });

  it('handles 3 parents', () => {
    const parents: ParentConnection[][] = [
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'parent' },
        { parentIndex: 1, edgeType: 'parent' },
        { parentIndex: 2, edgeType: 'parent' },
      ],
    ];
    const result = ancestor(3, parents);
    expect(result.sort()).toEqual([0, 1, 2]);
  });
});

describe('chaseup', () => {
  it('finds all ancestors reachable from a set', () => {
    const parents: ParentConnection[][] = [
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'parent' },
        { parentIndex: 1, edgeType: 'parent' },
      ],
    ];
    const result = chaseup([2], parents);
    expect(result).toContain(0);
    expect(result).toContain(1);
    expect(result).toContain(2);
  });
});

describe('isGroupMarker', () => {
  it('detects .5 values', () => {
    expect(isGroupMarker(3.5)).toBe(true);
    expect(isGroupMarker(3)).toBe(false);
    expect(isGroupMarker(0)).toBe(false);
  });
});

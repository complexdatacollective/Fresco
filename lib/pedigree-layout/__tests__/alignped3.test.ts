import { describe, expect, it } from 'vitest';
import { alignped3 } from '~/lib/pedigree-layout/alignped3';
import { type AlignmentArrays } from '~/lib/pedigree-layout/types';

describe('alignped3', () => {
  it('merges two single-level trees side by side', () => {
    const x1: AlignmentArrays = {
      n: [1],
      nid: [[1]],
      pos: [[0]],
      fam: [[0]],
      spouselist: [],
    };
    const x2: AlignmentArrays = {
      n: [1],
      nid: [[2]],
      pos: [[0]],
      fam: [[0]],
      spouselist: [],
    };

    const result = alignped3(x1, x2, true);
    expect(result.n).toEqual([2]);
    expect(result.nid[0]).toEqual([1, 2]);
    // In packed mode, second is placed at pos[0] + space
    expect(result.pos[0]![1]).toBe(1); // pos 0 + space 1
  });

  it('handles overlap when same person appears in both trees', () => {
    const x1: AlignmentArrays = {
      n: [2],
      nid: [[1, 3]],
      pos: [[0, 1]],
      fam: [[0, 0]],
      spouselist: [],
    };
    const x2: AlignmentArrays = {
      n: [2],
      nid: [[3, 4]],
      pos: [[0, 1]],
      fam: [[0, 0]],
      spouselist: [],
    };

    const result = alignped3(x1, x2, true);
    // person 3 overlaps, so n should be 3 not 4
    expect(result.n).toEqual([3]);
  });

  it('adjusts family pointers when merging', () => {
    const x1: AlignmentArrays = {
      n: [1, 1],
      nid: [
        [1, 0],
        [2, 0],
      ],
      pos: [
        [0, 0],
        [0, 0],
      ],
      fam: [
        [0, 0],
        [1, 0],
      ],
      spouselist: [],
    };
    const x2: AlignmentArrays = {
      n: [1, 1],
      nid: [
        [3, 0],
        [4, 0],
      ],
      pos: [
        [0, 0],
        [0, 0],
      ],
      fam: [
        [0, 0],
        [1, 0],
      ],
      spouselist: [],
    };

    const result = alignped3(x1, x2, true);
    // x2's family pointer 1 should be shifted by n1=1 to become 2
    expect(result.fam[1]![1]).toBe(2);
  });
});

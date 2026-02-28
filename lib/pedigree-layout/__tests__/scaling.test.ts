import { describe, expect, it } from 'vitest';
import { computeScaling } from '~/lib/pedigree-layout/scaling';
import { type PedigreeLayout } from '~/lib/pedigree-layout/types';

describe('computeScaling', () => {
  const mockLayout: PedigreeLayout = {
    n: [2, 3],
    nid: [
      [1, 2, 0],
      [3, 4, 5],
    ],
    pos: [
      [0, 2, 0],
      [0, 1, 2],
    ],
    fam: [
      [0, 0, 0],
      [1, 1, 1],
    ],
    spouse: [
      [1, 0, 0],
      [0, 0, 0],
    ],
    twins: null,
  };

  it('returns positive scaling parameters', () => {
    const scaling = computeScaling(mockLayout, 800, 600);
    expect(scaling.boxWidth).toBeGreaterThan(0);
    expect(scaling.boxHeight).toBeGreaterThan(0);
    expect(scaling.legHeight).toBeGreaterThan(0);
    expect(scaling.hScale).toBeGreaterThan(0);
    expect(scaling.vScale).toBeGreaterThan(0);
  });

  it('legHeight is at most 0.25', () => {
    const scaling = computeScaling(mockLayout, 800, 600);
    expect(scaling.legHeight).toBeLessThanOrEqual(0.25);
  });

  it('adjusts with symbol size', () => {
    const s1 = computeScaling(mockLayout, 800, 600, 1);
    const s2 = computeScaling(mockLayout, 800, 600, 0.5);
    expect(s2.boxWidth).toBeLessThan(s1.boxWidth);
  });
});

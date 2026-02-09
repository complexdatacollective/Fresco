import { describe, expect, it } from 'vitest';
import { kindepth } from '~/lib/pedigree-layout/kindepth';

describe('kindepth', () => {
  it('returns [0] for a single person', () => {
    expect(kindepth([-1], [-1])).toEqual([0]);
  });

  it('assigns depth 0 to founders, 1 to their children', () => {
    // father=0, mother=1, child=2
    const midx = [-1, -1, 1];
    const didx = [-1, -1, 0];
    expect(kindepth(midx, didx)).toEqual([0, 0, 1]);
  });

  it('assigns increasing depth across generations', () => {
    // grandpa=0, grandma=1, father=2, mother=3, child=4
    const midx = [-1, -1, 1, -1, 3];
    const didx = [-1, -1, 0, -1, 2];
    expect(kindepth(midx, didx)).toEqual([0, 0, 1, 0, 2]);
  });

  it('aligns spouse depths when align=true', () => {
    // grandpa=0, grandma=1, father=2, mother=3 (marry-in), child=4
    const midx = [-1, -1, 1, -1, 3];
    const didx = [-1, -1, 0, -1, 2];
    const depth = kindepth(midx, didx, true);
    // father and mother should be at same depth
    expect(depth[2]).toBe(depth[3]);
    // child should be below parents
    expect(depth[4]!).toBeGreaterThan(depth[2]!);
  });

  it('handles a nuclear family', () => {
    // father=0, mother=1, c1=2, c2=3, c3=4
    const midx = [-1, -1, 1, 1, 1];
    const didx = [-1, -1, 0, 0, 0];
    expect(kindepth(midx, didx)).toEqual([0, 0, 1, 1, 1]);
  });

  it('throws on cyclic pedigree', () => {
    // person 0's parents are (1,2), person 1's parents are (0,2)
    // This creates a cycle: 0 -> 1 -> 0
    const midx = [2, 2, -1];
    const didx = [1, 0, -1];
    expect(() => kindepth(midx, didx)).toThrow(
      'Impossible pedigree: someone is their own ancestor',
    );
  });
});

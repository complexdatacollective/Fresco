import { describe, expect, it } from 'vitest';
import { type ParentConnection } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/types';
import { kindepth } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/kindepth';

describe('kindepth', () => {
  it('returns [0] for a single person', () => {
    expect(kindepth([[]])).toEqual([0]);
  });

  it('assigns depth 0 to founders, 1 to their children', () => {
    const parents: ParentConnection[][] = [
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
      ],
    ];
    expect(kindepth(parents)).toEqual([0, 0, 1]);
  });

  it('assigns increasing depth across generations', () => {
    const parents: ParentConnection[][] = [
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
      ],
      [],
      [
        { parentIndex: 2, edgeType: 'biological' },
        { parentIndex: 3, edgeType: 'biological' },
      ],
    ];
    expect(kindepth(parents)).toEqual([0, 0, 1, 0, 2]);
  });

  it('handles single parent', () => {
    const parents: ParentConnection[][] = [
      [],
      [{ parentIndex: 0, edgeType: 'biological' }],
    ];
    expect(kindepth(parents)).toEqual([0, 1]);
  });

  it('handles 3 parents at same generation', () => {
    const parents: ParentConnection[][] = [
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
        { parentIndex: 2, edgeType: 'biological' },
      ],
    ];
    expect(kindepth(parents)).toEqual([0, 0, 0, 1]);
  });

  it('aligns parent group members to same depth when align=true', () => {
    // grandpa=0, grandma=1, parent1=2, parent2=3 (marry-in), child=4
    const parents: ParentConnection[][] = [
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
      ],
      [],
      [
        { parentIndex: 2, edgeType: 'biological' },
        { parentIndex: 3, edgeType: 'biological' },
      ],
    ];
    const depth = kindepth(parents, true);
    expect(depth[2]).toBe(depth[3]);
    expect(depth[4]!).toBeGreaterThan(depth[2]!);
  });

  it('throws on cyclic pedigree', () => {
    const parents: ParentConnection[][] = [
      [{ parentIndex: 1, edgeType: 'biological' }],
      [{ parentIndex: 0, edgeType: 'biological' }],
    ];
    expect(() => kindepth(parents)).toThrow('Impossible pedigree');
  });

  it('treats auxiliary parents (donor/surrogate) the same for depth', () => {
    const parents: ParentConnection[][] = [
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'donor' },
      ],
    ];
    expect(kindepth(parents)).toEqual([0, 0, 1]);
  });

  it('handles a nuclear family', () => {
    const parents: ParentConnection[][] = [
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
      ],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
      ],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
      ],
    ];
    expect(kindepth(parents)).toEqual([0, 0, 1, 1, 1]);
  });
});

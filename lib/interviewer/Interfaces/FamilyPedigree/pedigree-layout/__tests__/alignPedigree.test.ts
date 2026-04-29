import { describe, expect, it } from 'vitest';
import { alignPedigree } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/alignPedigree';
import { computeConnectors } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/connectors';
import {
  type ParentConnection,
  type PedigreeInput,
  type ScalingParams,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/types';
import {
  blendedFamily,
  crossFamily,
  multipleMarriages,
  nuclearFamily,
  sameSeParents,
  singleParent,
  surrogacyFamily,
  threeCoParents,
  threeGeneration,
  twinFamily,
  wideFamily,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/__tests__/fixtures';

describe('alignPedigree', () => {
  it('lays out a nuclear family', () => {
    const result = alignPedigree(nuclearFamily, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    // Should have 2 levels
    expect(result.n.filter((v) => v > 0).length).toBe(2);

    // All 5 people should appear in the layout
    const allIds = result.nid.flatMap((row, i) =>
      row.slice(0, result.n[i]).filter((v) => v >= 0),
    );
    for (let i = 0; i < 5; i++) {
      expect(allIds).toContain(i);
    }
  });

  it('lays out a three-generation pedigree', () => {
    const result = alignPedigree(threeGeneration, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    // Should have 3 levels
    expect(result.n.filter((v) => v > 0).length).toBe(3);
  });

  it('produces non-overlapping positions on each level', () => {
    const result = alignPedigree(wideFamily, {
      hints: { order: [1, 2, 3, 4, 5, 6, 7] },
    });
    for (let lev = 0; lev < result.n.length; lev++) {
      const nn = result.n[lev]!;
      if (nn <= 1) continue;
      const positions = result.pos[lev]!.slice(0, nn);
      for (let j = 0; j < positions.length - 1; j++) {
        expect(positions[j + 1]!).toBeGreaterThan(positions[j]!);
      }
    }
  });

  it('marks parent groups', () => {
    const result = alignPedigree(nuclearFamily, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    const hasGroup = result.group.some((row) => row.some((v) => v > 0));
    expect(hasGroup).toBe(true);
  });

  it('all positions are non-negative', () => {
    const result = alignPedigree(nuclearFamily, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    for (let lev = 0; lev < result.n.length; lev++) {
      for (let j = 0; j < result.n[lev]!; j++) {
        // Allow tiny floating point errors from QP solver
        expect(result.pos[lev]![j]!).toBeGreaterThanOrEqual(-1e-10);
      }
    }
  });

  it('handles multiple marriages', () => {
    const result = alignPedigree(multipleMarriages, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
    const allIds = result.nid.flatMap((row, i) =>
      row.slice(0, result.n[i]).filter((v) => v >= 0),
    );
    expect(allIds.length).toBeGreaterThanOrEqual(5);
  });

  it('handles twin families', () => {
    const result = alignPedigree(twinFamily, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
    expect(result.twins).not.toBeNull();
  });

  it('lays out same-sex parents', () => {
    const result = alignPedigree(sameSeParents, {
      hints: { order: [1, 2, 3] },
    });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
    const allIds = result.nid.flatMap((row, i) =>
      row.slice(0, result.n[i]).filter((v) => v >= 0),
    );
    expect(allIds).toContain(0);
    expect(allIds).toContain(1);
    expect(allIds).toContain(2);
  });

  it('lays out single parent', () => {
    const result = alignPedigree(singleParent, {
      hints: { order: [1, 2] },
    });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
  });

  it('does NOT throw when a person has only one parent', () => {
    expect(() =>
      alignPedigree(singleParent, { hints: { order: [1, 2] } }),
    ).not.toThrow();
  });

  it('lays out three co-parents', () => {
    const result = alignPedigree(threeCoParents, {
      hints: { order: [1, 2, 3, 4] },
    });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
  });

  it('three co-parents have minimum spacing of 1', () => {
    const result = alignPedigree(threeCoParents, {
      hints: { order: [1, 2, 3, 4] },
    });
    const parentLevel = result.n.findIndex((v) => v >= 3);
    expect(parentLevel).toBeGreaterThanOrEqual(0);
    const positions = result.pos[parentLevel]!.slice(0, result.n[parentLevel]);
    for (let j = 0; j < positions.length - 1; j++) {
      expect(positions[j + 1]! - positions[j]!).toBeGreaterThanOrEqual(
        1 - 1e-10,
      );
    }
  });

  it('lays out surrogacy family', () => {
    const result = alignPedigree(surrogacyFamily, {
      hints: { order: [1, 2, 3, 4] },
    });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
    const allIds = result.nid.flatMap((row, i) =>
      row.slice(0, result.n[i]).filter((v) => v >= 0),
    );
    for (let i = 0; i < 4; i++) {
      expect(allIds).toContain(i);
    }
  });

  it('places donor on the same row as social parents', () => {
    const result = alignPedigree(surrogacyFamily, {
      hints: { order: [1, 2, 3, 4] },
    });
    // Find which row each person is on
    const rowOf = new Map<number, number>();
    for (let lev = 0; lev < result.n.length; lev++) {
      for (let col = 0; col < (result.n[lev] ?? 0); col++) {
        const pid = result.nid[lev]![col]!;
        if (pid >= 0) rowOf.set(pid, lev);
      }
    }
    // Social parents (0, 1) and surrogate (2) should be on the same row
    expect(rowOf.get(2)).toBe(rowOf.get(0));
    expect(rowOf.get(2)).toBe(rowOf.get(1));
    // Child (3) should be on a different (lower) row
    expect(rowOf.get(3)).toBeGreaterThan(rowOf.get(0)!);
  });

  it('places donor on same row as social parents in multi-gen pedigree', () => {
    // 3-gen: gp1(0) + gp2(1) -> parent(2); parent(2) + partner(3) -> child(4); donor(5) for child(4)
    const ped: PedigreeInput = {
      id: ['gp1', 'gp2', 'parent', 'partner', 'child', 'donor'],
      parents: [
        [],
        [],
        [sp(0), sp(1)],
        [],
        [
          { parentIndex: 2, edgeType: 'biological' },
          { parentIndex: 3, edgeType: 'biological' },
          { parentIndex: 5, edgeType: 'donor' },
        ],
        [],
      ],
    };
    const result = alignPedigree(ped, {
      hints: { order: [1, 2, 3, 4, 5, 6] },
    });

    const rowOf = new Map<number, number>();
    for (let lev = 0; lev < result.n.length; lev++) {
      for (let col = 0; col < (result.n[lev] ?? 0); col++) {
        const pid = result.nid[lev]![col]!;
        if (pid >= 0) rowOf.set(pid, lev);
      }
    }
    // Donor (5) should be on the same row as social parents (2, 3)
    expect(rowOf.get(5)).toBe(rowOf.get(2));
    // All three should be on the middle level (not the grandparent level)
    expect(rowOf.get(5)).toBeGreaterThan(rowOf.get(0)!);
  });

  it('places donor on same row in Sperm Donor story scenario', () => {
    // Mimics the exact structure of the Sperm Donor storybook example:
    // gfA(0), gmA(1) -> momA(2); momA(2) + momB(3) -> ego(5), sibling(6); donor(4) for ego+sibling
    // ego(5) + egoPartner(7) -> grandchild(8)
    const ped: PedigreeInput = {
      id: [
        'gfA',
        'gmA',
        'momA',
        'momB',
        'donor',
        'ego',
        'sibling',
        'egoPartner',
        'grandchild',
      ],
      parents: [
        [], // gfA
        [], // gmA
        [sp(0), sp(1)], // momA
        [], // momB
        [], // donor
        [
          { parentIndex: 2, edgeType: 'biological' },
          { parentIndex: 3, edgeType: 'biological' },
          { parentIndex: 4, edgeType: 'donor' },
        ], // ego
        [
          { parentIndex: 2, edgeType: 'biological' },
          { parentIndex: 3, edgeType: 'biological' },
          { parentIndex: 4, edgeType: 'donor' },
        ], // sibling
        [], // egoPartner
        [sp(5), sp(7)], // grandchild
      ],
    };
    const result = alignPedigree(ped, {
      hints: { order: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    });

    const rowOf = new Map<number, number>();
    for (let lev = 0; lev < result.n.length; lev++) {
      for (let col = 0; col < (result.n[lev] ?? 0); col++) {
        const pid = result.nid[lev]![col]!;
        if (pid >= 0) rowOf.set(pid, lev);
      }
    }

    // Donor (4) should be on same row as momA (2) and momB (3)
    expect(rowOf.get(4)).toBe(rowOf.get(2));
    // grandparents should be on a higher (earlier) row
    expect(rowOf.get(0)).toBeLessThan(rowOf.get(2)!);
    // grandchild should be on a lower row than ego
    expect(rowOf.get(8)).toBeGreaterThan(rowOf.get(5)!);
  });

  it('places both donor AND surrogate in layout (Donor + Surrogate story)', () => {
    // Exact structure of the Donor + Surrogate storybook example:
    // mgf(0), mgm(1) -> parentA(2), aunt(8)
    // parentA(2) + parentB(3) -> ego(6), sibling(7)
    // donor(4) for ego+sibling, surrogate(5) for ego+sibling
    // aunt(8) + auntPartner(9) -> cousin(10)
    // ego(6) + egoPartner(11) -> grandchild(12)
    const ped: PedigreeInput = {
      id: [
        'mgf',
        'mgm',
        'parentA',
        'parentB',
        'donor',
        'surrogate',
        'ego',
        'sibling',
        'aunt',
        'auntPartner',
        'cousin',
        'egoPartner',
        'grandchild',
      ],
      parents: [
        [], // mgf (0)
        [], // mgm (1)
        [sp(0), sp(1)], // parentA (2)
        [], // parentB (3)
        [], // donor (4)
        [], // surrogate (5)
        [
          { parentIndex: 2, edgeType: 'biological' },
          { parentIndex: 3, edgeType: 'biological' },
          { parentIndex: 4, edgeType: 'donor' },
          { parentIndex: 5, edgeType: 'surrogate' },
        ], // ego (6)
        [
          { parentIndex: 2, edgeType: 'biological' },
          { parentIndex: 3, edgeType: 'biological' },
          { parentIndex: 4, edgeType: 'donor' },
          { parentIndex: 5, edgeType: 'surrogate' },
        ], // sibling (7)
        [sp(0), sp(1)], // aunt (8)
        [], // auntPartner (9)
        [
          { parentIndex: 8, edgeType: 'biological' },
          { parentIndex: 9, edgeType: 'biological' },
        ], // cousin (10)
        [], // egoPartner (11)
        [
          { parentIndex: 6, edgeType: 'biological' },
          { parentIndex: 11, edgeType: 'biological' },
        ], // grandchild (12)
      ],
      relation: [
        { id1: 0, id2: 1, code: 4 },
        { id1: 2, id2: 3, code: 4 },
        { id1: 8, id2: 9, code: 4 },
        { id1: 6, id2: 11, code: 4 },
      ],
      partners: [
        { partnerIndex1: 0, partnerIndex2: 1, isActive: true },
        { partnerIndex1: 2, partnerIndex2: 3, isActive: true },
        { partnerIndex1: 8, partnerIndex2: 9, isActive: true },
        { partnerIndex1: 6, partnerIndex2: 11, isActive: true },
      ],
    };
    const result = alignPedigree(ped, {
      hints: { order: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
    });

    const rowOf = new Map<number, number>();
    for (let lev = 0; lev < result.n.length; lev++) {
      for (let col = 0; col < (result.n[lev] ?? 0); col++) {
        const pid = result.nid[lev]![col]!;
        if (pid >= 0) rowOf.set(pid, lev);
      }
    }

    // Both donor (4) and surrogate (5) should be placed in the layout
    expect(rowOf.has(4)).toBe(true);
    expect(rowOf.has(5)).toBe(true);
    // Both should be on the same row as the social parents
    expect(rowOf.get(4)).toBe(rowOf.get(2));
    expect(rowOf.get(5)).toBe(rowOf.get(2));

    // Donor and surrogate should have distinct column positions
    const colOf = new Map<number, number>();
    for (let lev = 0; lev < result.n.length; lev++) {
      for (let col = 0; col < (result.n[lev] ?? 0); col++) {
        const pid = result.nid[lev]![col]!;
        if (pid >= 0 && !colOf.has(pid)) colOf.set(pid, result.pos[lev]![col]!);
      }
    }

    expect(colOf.get(4)).not.toBe(colOf.get(5));
    // Neither should overlap with the social parents
    expect(colOf.get(4)).not.toBe(colOf.get(2));
    expect(colOf.get(4)).not.toBe(colOf.get(3));
    expect(colOf.get(5)).not.toBe(colOf.get(2));
    expect(colOf.get(5)).not.toBe(colOf.get(3));
  });

  it('places bio-parent on same row as social parents', () => {
    const result = alignPedigree(blendedFamily, {
      hints: { order: [1, 2, 3, 4] },
    });
    const rowOf = new Map<number, number>();
    for (let lev = 0; lev < result.n.length; lev++) {
      for (let col = 0; col < (result.n[lev] ?? 0); col++) {
        const pid = result.nid[lev]![col]!;
        if (pid >= 0) rowOf.set(pid, lev);
      }
    }
    // Bio-parent (2) should be on same row as social parents (0, 1)
    expect(rowOf.get(2)).toBe(rowOf.get(0));
  });

  it('auxiliary parent insertion does not split group pairs', () => {
    // partnerA(0) is donor, partnerB(1) is biological, they are a couple
    // donor edge from partnerA, bio edge from partnerB → child(2)
    const ped: PedigreeInput = {
      id: ['partnerA', 'partnerB', 'child'],
      parents: [
        [],
        [],
        [
          { parentIndex: 0, edgeType: 'donor' },
          { parentIndex: 1, edgeType: 'biological' },
        ],
      ],
      relation: [{ id1: 0, id2: 1, code: 4 }],
      partners: [{ partnerIndex1: 0, partnerIndex2: 1, isActive: true }],
    };
    const result = alignPedigree(ped, { hints: { order: [1, 2, 3] } });

    // Find row/col positions for partnerA and partnerB
    const colOf = new Map<number, number>();
    for (let lev = 0; lev < result.n.length; lev++) {
      for (let col = 0; col < (result.n[lev] ?? 0); col++) {
        const pid = result.nid[lev]![col]!;
        if (pid >= 0 && !colOf.has(pid)) colOf.set(pid, col);
      }
    }

    // The group matrix should connect partnerA(0) and partnerB(1).
    // Find the parent level and check that the group marker connects them.
    const parentLev = result.n.findIndex((v) => v > 0);
    const col0 = colOf.get(0)!;
    const col1 = colOf.get(1)!;
    const leftCol = Math.min(col0, col1);

    // group[parentLev][leftCol] should be > 0 indicating a group connection
    expect(result.group[parentLev]![leftCol]).toBeGreaterThan(0);
  });

  it('subset donors have equal spacing from the family', () => {
    // mom(0) + 2 donors (1,2) + 2 children (3,4)
    // donor1→child3 only, donor2→child4 only
    const ped: PedigreeInput = {
      id: ['mom', 'donor1', 'donor2', 'child1', 'child2'],
      parents: [
        [],
        [],
        [],
        [
          { parentIndex: 0, edgeType: 'biological' },
          { parentIndex: 1, edgeType: 'donor' },
        ],
        [
          { parentIndex: 0, edgeType: 'biological' },
          { parentIndex: 2, edgeType: 'donor' },
        ],
      ],
    };
    const result = alignPedigree(ped, { hints: { order: [1, 2, 3, 4, 5] } });

    const posOf = new Map<number, number>();
    for (let lev = 0; lev < result.n.length; lev++) {
      for (let col = 0; col < (result.n[lev] ?? 0); col++) {
        const pid = result.nid[lev]![col]!;
        if (pid >= 0 && !posOf.has(pid)) {
          posOf.set(pid, result.pos[lev]![col]!);
        }
      }
    }

    const momPos = posOf.get(0)!;
    const donor1Pos = posOf.get(1)!;
    const donor2Pos = posOf.get(2)!;

    const dist1 = Math.abs(donor1Pos - momPos);
    const dist2 = Math.abs(donor2Pos - momPos);

    // Both donors should be equidistant from mom (within tolerance)
    expect(dist1).toBeCloseTo(dist2, 0);

    // Children should be centered under mom, not under donors
    const child1Pos = posOf.get(3)!;
    const child2Pos = posOf.get(4)!;
    const childCenter = (child1Pos + child2Pos) / 2;
    expect(childCenter).toBeCloseTo(momPos, 0);

    // Each donor should NOT be directly above its child (should be diagonal)
    expect(donor1Pos).not.toBeCloseTo(child1Pos, 0);
    expect(donor2Pos).not.toBeCloseTo(child2Pos, 0);
  });

  it('places child directly under sole primary parent in reciprocal IVF', () => {
    // partnerA(0) + partnerB(1) couple; partnerA→pregnancy(3) is donor,
    // partnerB→pregnancy is biological; spermDonor(2)→pregnancy is donor
    const ped: PedigreeInput = {
      id: ['partnerA', 'partnerB', 'spermDonor', 'pregnancy'],
      parents: [
        [],
        [],
        [],
        [
          { parentIndex: 0, edgeType: 'donor' },
          { parentIndex: 1, edgeType: 'biological' },
          { parentIndex: 2, edgeType: 'donor' },
        ],
      ],
      relation: [{ id1: 0, id2: 1, code: 4 }],
      partners: [{ partnerIndex1: 0, partnerIndex2: 1, isActive: true }],
    };
    const result = alignPedigree(ped, {
      hints: { order: [1, 2, 3, 4] },
    });

    const posOf = new Map<number, number>();
    const rowOf = new Map<number, number>();
    for (let lev = 0; lev < result.n.length; lev++) {
      for (let col = 0; col < (result.n[lev] ?? 0); col++) {
        const pid = result.nid[lev]![col]!;
        if (pid >= 0 && !posOf.has(pid)) {
          posOf.set(pid, result.pos[lev]![col]!);
          rowOf.set(pid, lev);
        }
      }
    }

    // All 4 nodes should be placed
    expect(posOf.has(0)).toBe(true);
    expect(posOf.has(1)).toBe(true);
    expect(posOf.has(2)).toBe(true);
    expect(posOf.has(3)).toBe(true);

    // Pregnancy (3) should be directly under partnerB (1)
    expect(posOf.get(3)).toBe(posOf.get(1));
  });
});

// --- Regression tests: traditional families still produce correct layouts ---

const sp = (parentIndex: number): ParentConnection => ({
  parentIndex,
  edgeType: 'biological',
});

const defaultScaling: ScalingParams = {
  boxWidth: 1,
  boxHeight: 0.5,
  legHeight: 0.25,
  hScale: 1,
  vScale: 1,
};

describe('traditional family regression', () => {
  it('nuclear family: parents and children on separate levels', () => {
    const result = alignPedigree(nuclearFamily, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    // 2 active levels
    const activeLevels = result.n.filter((v) => v > 0);
    expect(activeLevels.length).toBe(2);

    // Find which levels have people
    const parentLevIdx = result.n.findIndex((v) => v > 0);
    const childLevIdx = result.n.findIndex((v, i) => v > 0 && i > parentLevIdx);

    // Parent level: 2 people (indices 0 and 1)
    expect(result.n[parentLevIdx]).toBe(2);
    const parentLevel = result.nid[parentLevIdx]!.slice(
      0,
      result.n[parentLevIdx],
    );
    expect(parentLevel).toContain(0);
    expect(parentLevel).toContain(1);

    // Child level: 3 people (indices 2, 3, 4)
    expect(result.n[childLevIdx]).toBe(3);
    const childLevel = result.nid[childLevIdx]!.slice(0, result.n[childLevIdx]);
    expect(childLevel).toContain(2);
    expect(childLevel).toContain(3);
    expect(childLevel).toContain(4);
  });

  it('nuclear family: parent group marker between parents', () => {
    const result = alignPedigree(nuclearFamily, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    // Group matrix should mark a connection on the parent level
    const hasGroupMark = result.group.some((row) => row.some((v) => v > 0));
    expect(hasGroupMark).toBe(true);
  });

  it('nuclear family: children linked to correct family', () => {
    const result = alignPedigree(nuclearFamily, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    // Find the child level (second active level)
    const parentLevIdx = result.n.findIndex((v) => v > 0);
    const childLevIdx = result.n.findIndex((v, i) => v > 0 && i > parentLevIdx);
    // All children should share the same fam value > 0
    const childFams = result.fam[childLevIdx]!.slice(0, result.n[childLevIdx]);
    const uniqueFams = [...new Set(childFams)];
    expect(uniqueFams.length).toBe(1);
    expect(uniqueFams[0]).toBeGreaterThan(0);
  });

  it('nuclear family: connectors include parent group line and parent-child links', () => {
    const result = alignPedigree(nuclearFamily, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    const conn = computeConnectors(
      result,
      defaultScaling,
      nuclearFamily.parents,
    );
    expect(conn.groupLines.length).toBeGreaterThanOrEqual(1);
    expect(conn.parentChildLines.length).toBeGreaterThanOrEqual(1);
    expect(conn.auxiliaryLines.length).toBe(0);
    expect(conn.duplicateArcs.length).toBe(0);
  });

  it('three-generation: grandparents, parents, grandchild on separate levels', () => {
    const result = alignPedigree(threeGeneration, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    expect(result.n.filter((v) => v > 0).length).toBe(3);

    // All people present in layout
    const allIds = result.nid.flatMap((row, i) =>
      row.slice(0, result.n[i]).filter((v) => v >= 0),
    );
    for (let i = 0; i < 5; i++) {
      expect(allIds).toContain(i);
    }

    // Grandchild (4) on the deepest active level
    const activeLevels = result.n
      .map((v, i) => ({ v, i }))
      .filter((x) => x.v > 0);
    const deepest = activeLevels[activeLevels.length - 1]!.i;
    const deepestIds = result.nid[deepest]!.slice(0, result.n[deepest]);
    expect(deepestIds).toContain(4);
  });

  it('multiple marriages: shared parent appears in both family groups', () => {
    const result = alignPedigree(multipleMarriages, {
      hints: { order: [1, 2, 3, 4, 5] },
    });
    // Parent 0 should appear in the layout (possibly duplicated)
    const allIds = result.nid.flatMap((row, i) =>
      row.slice(0, result.n[i]).filter((v) => v >= 0),
    );
    expect(allIds.filter((id) => id === 0).length).toBeGreaterThanOrEqual(1);

    // Both children should be present
    expect(allIds).toContain(3);
    expect(allIds).toContain(4);

    // At least 2 group lines (one per partnership)
    const conn = computeConnectors(
      result,
      defaultScaling,
      multipleMarriages.parents,
    );
    expect(conn.groupLines.length).toBeGreaterThanOrEqual(2);
  });

  it('wide family: all 5 children get distinct positions', () => {
    const result = alignPedigree(wideFamily, {
      hints: { order: [1, 2, 3, 4, 5, 6, 7] },
    });
    // Find the child level (has 5 people)
    const childLevIdx = result.n.findIndex((v) => v === 5);
    expect(childLevIdx).toBeGreaterThanOrEqual(0);
    const childPositions = result.pos[childLevIdx]!.slice(
      0,
      result.n[childLevIdx],
    );
    // All positions should be distinct and increasing
    for (let j = 0; j < childPositions.length - 1; j++) {
      expect(childPositions[j + 1]!).toBeGreaterThan(childPositions[j]!);
    }
    expect(childPositions.length).toBe(5);
  });

  it('complex traditional pedigree: 2 couples, shared grandchild', () => {
    // Couple A (0,1) -> child A (4)
    // Couple B (2,3) -> child B (5)
    // child A + child B -> grandchild (6)
    const ped: PedigreeInput = {
      id: ['gpA1', 'gpA2', 'gpB1', 'gpB2', 'parentA', 'parentB', 'grandchild'],
      parents: [[], [], [], [], [sp(0), sp(1)], [sp(2), sp(3)], [sp(4), sp(5)]],
    };
    const result = alignPedigree(ped, {
      hints: { order: [1, 2, 3, 4, 5, 6, 7] },
    });

    // 3 active levels
    expect(result.n.filter((v) => v > 0).length).toBe(3);

    // All people present
    const allIds = result.nid.flatMap((row, i) =>
      row.slice(0, result.n[i]).filter((v) => v >= 0),
    );
    for (let i = 0; i < 7; i++) {
      expect(allIds).toContain(i);
    }

    // Grandchild on the deepest active level
    const activeLevels = result.n
      .map((v, i) => ({ v, i }))
      .filter((x) => x.v > 0);
    const deepest = activeLevels[activeLevels.length - 1]!.i;
    const deepestIds = result.nid[deepest]!.slice(0, result.n[deepest]);
    expect(deepestIds).toContain(6);

    // Connectors: at least 3 group lines, at least 3 parent-child links.
    // parentB is a .5 group member (marry-in) and gets an individual
    // parent-child connector to avoid overlapping sibling bars.
    const conn = computeConnectors(result, defaultScaling, ped.parents);
    expect(conn.groupLines.length).toBeGreaterThanOrEqual(3);
    expect(conn.parentChildLines.length).toBeGreaterThanOrEqual(3);
    expect(conn.auxiliaryLines.length).toBe(0);
  });

  it('multiple marriages: children from different couples get separate parent-child connectors', () => {
    const result = alignPedigree(multipleMarriages, {
      hints: { order: [1, 2, 3, 4, 5] },
    });

    const conn = computeConnectors(
      result,
      defaultScaling,
      multipleMarriages.parents,
    );

    // Should produce 2 separate parent-child connectors (one per couple)
    expect(conn.parentChildLines.length).toBe(2);

    // Parent links should target different x positions
    const x1 = conn.parentChildLines[0]!.parentLink[0]!.x1;
    const x2 = conn.parentChildLines[1]!.parentLink[0]!.x1;
    expect(x1).not.toBeCloseTo(x2, 1);
  });
});

it('adoption by relative: no duplicate group lines', () => {
  const sp = (parentIndex: number): ParentConnection => ({
    parentIndex,
    edgeType: 'biological',
  });

  const ped: PedigreeInput = {
    id: ['grandpa', 'grandma', 'father', 'aunt', 'uncle', 'child'],
    parents: [
      [],
      [],
      [sp(0), sp(1)],
      [sp(0), sp(1)],
      [],
      [
        { parentIndex: 2, edgeType: 'biological' },
        { parentIndex: 3, edgeType: 'social' },
        { parentIndex: 4, edgeType: 'social' },
      ],
    ],
    relation: [{ id1: 3, id2: 4, code: 4 }],
    partners: [
      { partnerIndex1: 0, partnerIndex2: 1, isActive: true },
      { partnerIndex1: 3, partnerIndex2: 4, isActive: true },
    ],
  };
  const result = alignPedigree(ped, {
    hints: { order: [1, 2, 3, 4, 5, 6] },
  });

  const conn = computeConnectors(result, defaultScaling, ped.parents);

  // There should be exactly 2 group lines (grandpa+grandma, aunt+uncle)
  expect(conn.groupLines.length).toBe(2);
});

// --- Cross-family alignment tests ---

function positionOf(
  result: ReturnType<typeof alignPedigree>,
  nodeIndex: number,
): { layer: number; pos: number } | undefined {
  for (let lev = 0; lev < result.n.length; lev++) {
    for (let col = 0; col < (result.n[lev] ?? 0); col++) {
      if (result.nid[lev]![col] === nodeIndex) {
        return { layer: lev, pos: result.pos[lev]![col]! };
      }
    }
  }
  return undefined;
}

describe('cross-family alignment', () => {
  it('normalizes positions globally so parent-child alignment is preserved', () => {
    const result = alignPedigree(crossFamily);

    // gpA1(0)+gpA2(1) should be roughly centered over childA(4)
    // gpB1(2)+gpB2(3) should be roughly centered over childB(5)
    const gpA1 = positionOf(result, 0)!;
    const gpA2 = positionOf(result, 1)!;
    const gpB1 = positionOf(result, 2)!;
    const gpB2 = positionOf(result, 3)!;
    const childA = positionOf(result, 4)!;
    const childB = positionOf(result, 5)!;

    const gpACenterX = (gpA1.pos + gpA2.pos) / 2;
    const gpBCenterX = (gpB1.pos + gpB2.pos) / 2;

    // Parent couple center should be within 1 unit of the child they
    // connect to. Without global normalization, the per-layer shift
    // breaks this alignment and the distance can exceed 2+.
    expect(Math.abs(gpACenterX - childA.pos)).toBeLessThan(1.5);
    expect(Math.abs(gpBCenterX - childB.pos)).toBeLessThan(1.5);
  });

  it('partners in cross-family marriages are adjacent', () => {
    const result = alignPedigree(crossFamily);

    const childA = positionOf(result, 4)!;
    const childB = positionOf(result, 5)!;

    // childA and childB are partners — they should be on the same layer
    // and adjacent (within 2 units, allowing for sibling block spacing)
    expect(childA.layer).toBe(childB.layer);
    expect(Math.abs(childA.pos - childB.pos)).toBeLessThanOrEqual(2 + 1e-10);
  });
});

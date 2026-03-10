import { describe, expect, it } from 'vitest';
import { alignPedigree } from '~/lib/pedigree-layout/alignPedigree';
import { computeConnectors } from '~/lib/pedigree-layout/connectors';
import {
  type ParentConnection,
  type PedigreeInput,
  type ScalingParams,
} from '~/lib/pedigree-layout/types';
import {
  blendedFamily,
  multipleMarriages,
  nuclearFamily,
  sameSeParents,
  singleParent,
  surrogacyFamily,
  threeCoParents,
  threeGeneration,
  twinFamily,
  wideFamily,
} from '~/lib/pedigree-layout/__tests__/fixtures';

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
      sex: ['male', 'female', 'male', 'female', 'male', 'male'],
      gender: ['man', 'woman', 'man', 'woman', 'man', 'man'],
      parents: [
        [],
        [],
        [sp(0), sp(1)],
        [],
        [
          { parentIndex: 2, edgeType: 'social-parent' },
          { parentIndex: 3, edgeType: 'social-parent' },
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
      sex: [
        'male',
        'female',
        'female',
        'female',
        'male',
        'female',
        'male',
        'male',
        'female',
      ],
      gender: [
        'man',
        'woman',
        'woman',
        'woman',
        'man',
        'woman',
        'man',
        'man',
        'woman',
      ],
      parents: [
        [], // gfA
        [], // gmA
        [sp(0), sp(1)], // momA
        [], // momB
        [], // donor
        [
          { parentIndex: 2, edgeType: 'social-parent' },
          { parentIndex: 3, edgeType: 'social-parent' },
          { parentIndex: 4, edgeType: 'donor' },
        ], // ego
        [
          { parentIndex: 2, edgeType: 'social-parent' },
          { parentIndex: 3, edgeType: 'social-parent' },
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
});

// --- Regression tests: traditional families still produce correct layouts ---

const sp = (parentIndex: number): ParentConnection => ({
  parentIndex,
  edgeType: 'social-parent',
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
      sex: ['male', 'female', 'male', 'female', 'male', 'female', 'male'],
      gender: ['man', 'woman', 'man', 'woman', 'man', 'woman', 'man'],
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
      0.6,
      0.5,
      multipleMarriages.relation ?? [],
      multipleMarriages.partners ?? [],
    );

    // Should produce 2 separate parent-child connectors (one per couple)
    expect(conn.parentChildLines.length).toBe(2);

    // Parent links should target different x positions
    const x1 = conn.parentChildLines[0]!.parentLink[0]!.x1;
    const x2 = conn.parentChildLines[1]!.parentLink[0]!.x1;
    expect(x1).not.toBeCloseTo(x2, 1);

    // Group lines should have correct current flags
    const currentLine = conn.groupLines.find((g) => g.current);
    const pastLine = conn.groupLines.find((g) => !g.current);
    expect(currentLine).toBeDefined();
    expect(pastLine).toBeDefined();
  });
});

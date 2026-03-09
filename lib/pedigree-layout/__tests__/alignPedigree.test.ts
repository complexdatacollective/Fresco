import { describe, expect, it } from 'vitest';
import { alignPedigree } from '~/lib/pedigree-layout/alignPedigree';
import { computeConnectors } from '~/lib/pedigree-layout/connectors';
import {
  type ParentConnection,
  type PedigreeInput,
  type ScalingParams,
} from '~/lib/pedigree-layout/types';
import {
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

    // Connectors: at least 3 group lines, at least 3 parent-child links
    const conn = computeConnectors(result, defaultScaling, ped.parents);
    expect(conn.groupLines.length).toBeGreaterThanOrEqual(3);
    expect(conn.parentChildLines.length).toBeGreaterThanOrEqual(3);
    expect(conn.auxiliaryLines.length).toBe(0);
  });
});

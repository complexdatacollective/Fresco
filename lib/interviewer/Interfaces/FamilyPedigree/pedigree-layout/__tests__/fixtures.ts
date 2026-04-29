import {
  type ParentConnection,
  type PartnerConnection,
  type PedigreeInput,
  type Relation,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/types';

const sp = (parentIndex: number): ParentConnection => ({
  parentIndex,
  edgeType: 'biological',
});

/**
 * Nuclear family: 2 parents (parent1=0, parent2=1) + 3 children (2,3,4)
 */
export const nuclearFamily: PedigreeInput = {
  id: ['parent1', 'parent2', 'child1', 'child2', 'child3'],
  parents: [[], [], [sp(0), sp(1)], [sp(0), sp(1)], [sp(0), sp(1)]],
};

/**
 * 3-generation pedigree:
 * Gen 0: gp1(0), gp2(1)
 * Gen 1: parent1(2), parent2(3)
 * Gen 2: child(4)
 */
export const threeGeneration: PedigreeInput = {
  id: ['gp1', 'gp2', 'parent1', 'parent2', 'child'],
  parents: [[], [], [sp(0), sp(1)], [], [sp(2), sp(3)]],
};

/**
 * Multiple marriages: parent1(0) partners with partner1(1) and partner2(2)
 * child1(3) from first partnership, child2(4) from second
 */
export const multipleMarriages: PedigreeInput = {
  id: ['parent1', 'partner1', 'partner2', 'child1', 'child2'],
  parents: [[], [], [], [sp(0), sp(1)], [sp(0), sp(2)]],
  relation: [
    { id1: 0, id2: 1, code: 4 },
    { id1: 0, id2: 2, code: 4 },
  ] satisfies Relation[],
  partners: [
    { partnerIndex1: 0, partnerIndex2: 1, isActive: false },
    { partnerIndex1: 0, partnerIndex2: 2, isActive: true },
  ] satisfies PartnerConnection[],
};

/**
 * Twins: parents(0,1) with MZ twin pair (2,3) and a singleton (4)
 */
export const twinFamily: PedigreeInput = {
  id: ['parent1', 'parent2', 'twin1', 'twin2', 'singleton'],
  parents: [[], [], [sp(0), sp(1)], [sp(0), sp(1)], [sp(0), sp(1)]],
  relation: [{ id1: 2, id2: 3, code: 1 }],
};

/**
 * Wide pedigree: 2 parents + 5 children
 */
export const wideFamily: PedigreeInput = {
  id: ['p1', 'p2', 'c1', 'c2', 'c3', 'c4', 'c5'],
  parents: [
    [],
    [],
    [sp(0), sp(1)],
    [sp(0), sp(1)],
    [sp(0), sp(1)],
    [sp(0), sp(1)],
    [sp(0), sp(1)],
  ],
};

// --- Inclusive family fixtures ---

/**
 * Same-sex parents: two women with a child
 */
export const sameSeParents: PedigreeInput = {
  id: ['parent1', 'parent2', 'child'],
  parents: [[], [], [sp(0), sp(1)]],
};

/**
 * Three co-parents
 */
export const threeCoParents: PedigreeInput = {
  id: ['parent1', 'parent2', 'parent3', 'child'],
  parents: [
    [],
    [],
    [],
    [
      { parentIndex: 0, edgeType: 'biological' },
      { parentIndex: 1, edgeType: 'biological' },
      { parentIndex: 2, edgeType: 'biological' },
    ],
  ],
};

/**
 * Surrogacy family: two fathers + surrogate mother
 */
export const surrogacyFamily: PedigreeInput = {
  id: ['parent1', 'parent2', 'surrogate', 'child'],
  parents: [
    [],
    [],
    [],
    [
      { parentIndex: 0, edgeType: 'biological' },
      { parentIndex: 1, edgeType: 'biological' },
      { parentIndex: 2, edgeType: 'surrogate' },
    ],
  ],
};

/**
 * Single parent: one parent, one child
 */
export const singleParent: PedigreeInput = {
  id: ['parent', 'child'],
  parents: [[], [sp(0)]],
};

/**
 * Blended family with bio-parent: custodial parents + non-custodial bio-parent
 */
export const blendedFamily: PedigreeInput = {
  id: ['custodialMom', 'stepDad', 'bioDad', 'child'],
  parents: [
    [],
    [],
    [],
    [
      { parentIndex: 0, edgeType: 'biological' },
      { parentIndex: 1, edgeType: 'social' },
      { parentIndex: 2, edgeType: 'biological' },
    ],
  ],
};

/**
 * Cross-family pedigree: two grandparent couples whose children marry.
 *
 *   gpA1(0) + gpA2(1)      gpB1(2) + gpB2(3)
 *         |                       |
 *       childA(4) ---- childB(5)
 *              |
 *          grandchild(6)
 *
 * This structure triggers the per-layer normalization bug when the
 * downward centering creates negative positions on the child layer.
 */
export const crossFamily: PedigreeInput = {
  id: ['gpA1', 'gpA2', 'gpB1', 'gpB2', 'childA', 'childB', 'grandchild'],
  parents: [[], [], [], [], [sp(0), sp(1)], [sp(2), sp(3)], [sp(4), sp(5)]],
  relation: [
    { id1: 0, id2: 1, code: 4 },
    { id1: 2, id2: 3, code: 4 },
    { id1: 4, id2: 5, code: 4 },
  ],
  partners: [
    { partnerIndex1: 0, partnerIndex2: 1, isActive: true },
    { partnerIndex1: 2, partnerIndex2: 3, isActive: true },
    { partnerIndex1: 4, partnerIndex2: 5, isActive: true },
  ],
};

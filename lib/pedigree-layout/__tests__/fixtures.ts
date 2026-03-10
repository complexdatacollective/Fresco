import {
  type ParentConnection,
  type PartnerConnection,
  type PedigreeInput,
  type Relation,
} from '~/lib/pedigree-layout/types';

const sp = (parentIndex: number): ParentConnection => ({
  parentIndex,
  edgeType: 'social-parent',
});

/**
 * Nuclear family: 2 parents (parent1=0, parent2=1) + 3 children (2,3,4)
 */
export const nuclearFamily: PedigreeInput = {
  id: ['parent1', 'parent2', 'child1', 'child2', 'child3'],
  sex: ['male', 'female', 'male', 'female', 'male'],
  gender: ['man', 'woman', 'man', 'woman', 'man'],
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
  sex: ['male', 'female', 'male', 'female', 'male'],
  gender: ['man', 'woman', 'man', 'woman', 'man'],
  parents: [[], [], [sp(0), sp(1)], [], [sp(2), sp(3)]],
};

/**
 * Multiple marriages: parent1(0) partners with partner1(1) and partner2(2)
 * child1(3) from first partnership, child2(4) from second
 */
export const multipleMarriages: PedigreeInput = {
  id: ['parent1', 'partner1', 'partner2', 'child1', 'child2'],
  sex: ['male', 'female', 'female', 'male', 'female'],
  gender: ['man', 'woman', 'woman', 'man', 'woman'],
  parents: [[], [], [], [sp(0), sp(1)], [sp(0), sp(2)]],
  relation: [
    { id1: 0, id2: 1, code: 4 },
    { id1: 0, id2: 2, code: 4 },
  ] satisfies Relation[],
  partners: [
    { partnerIndex1: 0, partnerIndex2: 1, current: false },
    { partnerIndex1: 0, partnerIndex2: 2, current: true },
  ] satisfies PartnerConnection[],
};

/**
 * Twins: parents(0,1) with MZ twin pair (2,3) and a singleton (4)
 */
export const twinFamily: PedigreeInput = {
  id: ['parent1', 'parent2', 'twin1', 'twin2', 'singleton'],
  sex: ['male', 'female', 'male', 'male', 'female'],
  gender: ['man', 'woman', 'man', 'man', 'woman'],
  parents: [[], [], [sp(0), sp(1)], [sp(0), sp(1)], [sp(0), sp(1)]],
  relation: [{ id1: 2, id2: 3, code: 1 }],
};

/**
 * Wide pedigree: 2 parents + 5 children
 */
export const wideFamily: PedigreeInput = {
  id: ['p1', 'p2', 'c1', 'c2', 'c3', 'c4', 'c5'],
  sex: ['male', 'female', 'male', 'female', 'male', 'female', 'male'],
  gender: ['man', 'woman', 'man', 'woman', 'man', 'woman', 'man'],
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
  sex: ['female', 'female', 'male'],
  gender: ['woman', 'woman', 'man'],
  parents: [[], [], [sp(0), sp(1)]],
};

/**
 * Single parent with donor
 */
export const singleParentWithDonor: PedigreeInput = {
  id: ['parent', 'donor', 'child'],
  sex: ['female', 'male', 'female'],
  gender: ['woman', 'man', 'woman'],
  parents: [
    [],
    [],
    [
      { parentIndex: 0, edgeType: 'social-parent' },
      { parentIndex: 1, edgeType: 'donor' },
    ],
  ],
};

/**
 * Three co-parents
 */
export const threeCoParents: PedigreeInput = {
  id: ['parent1', 'parent2', 'parent3', 'child'],
  sex: ['female', 'female', 'male', 'male'],
  gender: ['woman', 'woman', 'man', 'man'],
  parents: [
    [],
    [],
    [],
    [
      { parentIndex: 0, edgeType: 'social-parent' },
      { parentIndex: 1, edgeType: 'social-parent' },
      { parentIndex: 2, edgeType: 'co-parent' },
    ],
  ],
};

/**
 * Surrogacy family: two fathers + surrogate mother
 */
export const surrogacyFamily: PedigreeInput = {
  id: ['parent1', 'parent2', 'surrogate', 'child'],
  sex: ['male', 'male', 'female', 'female'],
  gender: ['man', 'man', 'woman', 'woman'],
  parents: [
    [],
    [],
    [],
    [
      { parentIndex: 0, edgeType: 'social-parent' },
      { parentIndex: 1, edgeType: 'social-parent' },
      { parentIndex: 2, edgeType: 'surrogate' },
    ],
  ],
};

/**
 * Single parent: one parent, one child
 */
export const singleParent: PedigreeInput = {
  id: ['parent', 'child'],
  sex: ['female', 'male'],
  gender: ['woman', 'man'],
  parents: [[], [sp(0)]],
};

/**
 * Blended family with bio-parent: custodial parents + non-custodial bio-parent
 */
export const blendedFamily: PedigreeInput = {
  id: ['custodialMom', 'stepDad', 'bioDad', 'child'],
  sex: ['female', 'male', 'male', 'female'],
  gender: ['woman', 'man', 'man', 'woman'],
  parents: [
    [],
    [],
    [],
    [
      { parentIndex: 0, edgeType: 'social-parent' },
      { parentIndex: 1, edgeType: 'social-parent' },
      { parentIndex: 2, edgeType: 'bio-parent' },
    ],
  ],
};

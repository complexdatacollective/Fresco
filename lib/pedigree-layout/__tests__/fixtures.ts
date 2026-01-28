import { type PedigreeInput } from '~/lib/pedigree-layout/types';

/**
 * Nuclear family: 2 parents (father=0, mother=1) + 3 children (2,3,4)
 * Indices: father=0, mother=1, child1=2, child2=3, child3=4
 */
export const nuclearFamily: PedigreeInput = {
  id: ['father', 'mother', 'son1', 'daughter1', 'son2'],
  fatherIndex: [-1, -1, 0, 0, 0],
  motherIndex: [-1, -1, 1, 1, 1],
  sex: ['male', 'female', 'male', 'female', 'male'],
};

/**
 * 3-generation pedigree:
 * Gen 0: grandpa(0), grandma(1)
 * Gen 1: father(2), mother(3)
 * Gen 2: child(4)
 */
export const threeGeneration: PedigreeInput = {
  id: ['grandpa', 'grandma', 'father', 'mother', 'child'],
  fatherIndex: [-1, -1, 0, -1, 2],
  motherIndex: [-1, -1, 1, -1, 3],
  sex: ['male', 'female', 'male', 'female', 'male'],
};

/**
 * Multiple marriages: father(0) marries wife1(1) and wife2(2)
 * child1(3) from first marriage, child2(4) from second
 */
export const multipleMarriages: PedigreeInput = {
  id: ['father', 'wife1', 'wife2', 'child1', 'child2'],
  fatherIndex: [-1, -1, -1, 0, 0],
  motherIndex: [-1, -1, -1, 1, 2],
  sex: ['male', 'female', 'female', 'male', 'female'],
};

/**
 * Twins: parents(0,1) with MZ twin pair (2,3) and a singleton (4)
 */
export const twinFamily: PedigreeInput = {
  id: ['father', 'mother', 'twin1', 'twin2', 'singleton'],
  fatherIndex: [-1, -1, 0, 0, 0],
  motherIndex: [-1, -1, 1, 1, 1],
  sex: ['male', 'female', 'male', 'male', 'female'],
  relation: [{ id1: 2, id2: 3, code: 1 }], // MZ twins
};

/**
 * Wide pedigree: 2 parents + 5 children
 */
export const wideFamily: PedigreeInput = {
  id: ['dad', 'mom', 'c1', 'c2', 'c3', 'c4', 'c5'],
  fatherIndex: [-1, -1, 0, 0, 0, 0, 0],
  motherIndex: [-1, -1, 1, 1, 1, 1, 1],
  sex: ['male', 'female', 'male', 'female', 'male', 'female', 'male'],
};

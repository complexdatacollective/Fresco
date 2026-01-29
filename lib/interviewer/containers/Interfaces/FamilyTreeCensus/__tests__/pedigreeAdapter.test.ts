import { describe, expect, test } from 'vitest';
import { type FamilyTreeNodeType } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import { FAMILY_TREE_CONFIG } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/config';
import {
  buildConnectorData,
  pedigreeLayoutToPositions,
  storeToPedigreeInput,
} from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/pedigreeAdapter';
import { type Edge } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';
import { alignPedigree } from '~/lib/pedigree-layout/alignPedigree';
import { type PedigreeLayout } from '~/lib/pedigree-layout/types';

type NodeData = Omit<FamilyTreeNodeType, 'id'>;
type EdgeData = Omit<Edge, 'id'>;

function makeNodes(
  entries: { id: string; sex?: 'male' | 'female'; isEgo?: boolean }[],
) {
  const map = new Map<string, NodeData>();
  for (const { id, sex, isEgo } of entries) {
    map.set(id, { label: id, sex, isEgo, readOnly: false });
  }
  return map;
}

function makeEdges(
  entries: {
    source: string;
    target: string;
    relationship: Edge['relationship'];
  }[],
) {
  const map = new Map<string, EdgeData>();
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    map.set(`e${i}`, {
      source: e.source,
      target: e.target,
      relationship: e.relationship,
    });
  }
  return map;
}

describe('storeToPedigreeInput', () => {
  test('empty graph produces empty input', () => {
    const { input } = storeToPedigreeInput(new Map(), new Map());
    expect(input.id).toHaveLength(0);
    expect(input.fatherIndex).toHaveLength(0);
    expect(input.motherIndex).toHaveLength(0);
    expect(input.sex).toHaveLength(0);
  });

  test('single node produces correct single-element arrays', () => {
    const nodes = makeNodes([{ id: 'ego', sex: 'male', isEgo: true }]);
    const { input, indexToId, idToIndex } = storeToPedigreeInput(
      nodes,
      new Map(),
    );

    expect(input.id).toEqual(['ego']);
    expect(input.sex).toEqual(['male']);
    expect(input.fatherIndex).toEqual([-1]);
    expect(input.motherIndex).toEqual([-1]);
    expect(indexToId).toEqual(['ego']);
    expect(idToIndex.get('ego')).toBe(0);
  });

  test('nuclear family produces correct parent indices from edges + sex', () => {
    const nodes = makeNodes([
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'child', sex: 'male', isEgo: true },
    ]);
    const edges = makeEdges([
      { source: 'father', target: 'mother', relationship: 'partner' },
      { source: 'father', target: 'child', relationship: 'parent' },
      { source: 'mother', target: 'child', relationship: 'parent' },
    ]);

    const { input, idToIndex } = storeToPedigreeInput(nodes, edges);

    const childIdx = idToIndex.get('child')!;
    const fatherIdx = idToIndex.get('father')!;
    const motherIdx = idToIndex.get('mother')!;

    expect(input.fatherIndex[childIdx]).toBe(fatherIdx);
    expect(input.motherIndex[childIdx]).toBe(motherIdx);
    // Parents have no parents
    expect(input.fatherIndex[fatherIdx]).toBe(-1);
    expect(input.motherIndex[fatherIdx]).toBe(-1);
  });

  test('three-generation pedigree produces correct indexing', () => {
    const nodes = makeNodes([
      { id: 'gf', sex: 'male' },
      { id: 'gm', sex: 'female' },
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'child', sex: 'female', isEgo: true },
    ]);
    const edges = makeEdges([
      { source: 'gf', target: 'gm', relationship: 'partner' },
      { source: 'gf', target: 'father', relationship: 'parent' },
      { source: 'gm', target: 'father', relationship: 'parent' },
      { source: 'father', target: 'mother', relationship: 'partner' },
      { source: 'father', target: 'child', relationship: 'parent' },
      { source: 'mother', target: 'child', relationship: 'parent' },
    ]);

    const { input, idToIndex } = storeToPedigreeInput(nodes, edges);

    const fatherIdx = idToIndex.get('father')!;
    const gfIdx = idToIndex.get('gf')!;
    const gmIdx = idToIndex.get('gm')!;

    expect(input.fatherIndex[fatherIdx]).toBe(gfIdx);
    expect(input.motherIndex[fatherIdx]).toBe(gmIdx);

    const childIdx = idToIndex.get('child')!;
    expect(input.fatherIndex[childIdx]).toBe(fatherIdx);
    expect(input.motherIndex[childIdx]).toBe(idToIndex.get('mother')!);
  });

  test('partner edges produce Relation entries with code 4', () => {
    const nodes = makeNodes([
      { id: 'a', sex: 'male' },
      { id: 'b', sex: 'female' },
      { id: 'c', sex: 'female' },
    ]);
    const edges = makeEdges([
      { source: 'a', target: 'b', relationship: 'partner' },
      { source: 'a', target: 'c', relationship: 'partner' },
    ]);

    const { input } = storeToPedigreeInput(nodes, edges);

    expect(input.relation).toHaveLength(2);
    expect(input.relation![0]!.code).toBe(4);
    expect(input.relation![1]!.code).toBe(4);
  });

  test('node with only one parent edge is treated as founder', () => {
    const nodes = makeNodes([
      { id: 'parent', sex: 'male' },
      { id: 'child', sex: 'female' },
    ]);
    const edges = makeEdges([
      { source: 'parent', target: 'child', relationship: 'parent' },
    ]);

    const { input, idToIndex } = storeToPedigreeInput(nodes, edges);
    const childIdx = idToIndex.get('child')!;

    // Both should be -1 since only one parent was provided
    expect(input.fatherIndex[childIdx]).toBe(-1);
    expect(input.motherIndex[childIdx]).toBe(-1);
  });

  test('node with undefined sex is mapped to unknown', () => {
    const nodes = makeNodes([{ id: 'x' }]);
    const { input } = storeToPedigreeInput(nodes, new Map());
    expect(input.sex[0]).toBe('unknown');
  });
});

describe('pedigreeLayoutToPositions', () => {
  test('converts positions using siblingSpacing and rowHeight', () => {
    const layout: PedigreeLayout = {
      n: [2],
      nid: [[0, 1]],
      pos: [[0, 2.5]],
      fam: [[0, 0]],
      spouse: [[0, 0]],
      twins: null,
    };

    const positions = pedigreeLayoutToPositions(layout, ['a', 'b']);

    const posA = positions.get('a')!;
    const posB = positions.get('b')!;
    expect(posA.x).toBe(0);
    expect(posA.y).toBe(0);
    expect(posB.x).toBe(2.5 * FAMILY_TREE_CONFIG.siblingSpacing);
    expect(posB.y).toBe(0);
  });

  test('normalizes so min x = 0', () => {
    const layout: PedigreeLayout = {
      n: [2],
      nid: [[0, 1]],
      pos: [[3, 5]],
      fam: [[0, 0]],
      spouse: [[0, 0]],
      twins: null,
    };

    const positions = pedigreeLayoutToPositions(layout, ['a', 'b']);

    const posA = positions.get('a')!;
    expect(posA.x).toBe(0);
    const posB = positions.get('b')!;
    expect(posB.x).toBe(2 * FAMILY_TREE_CONFIG.siblingSpacing);
  });

  test('multi-generation layout uses rowHeight for y', () => {
    const layout: PedigreeLayout = {
      n: [1, 1],
      nid: [[0], [1]],
      pos: [[0], [0]],
      fam: [[0], [0]],
      spouse: [[0], [0]],
      twins: null,
    };

    const positions = pedigreeLayoutToPositions(layout, ['parent', 'child']);

    expect(positions.get('parent')!.y).toBe(0);
    expect(positions.get('child')!.y).toBe(FAMILY_TREE_CONFIG.rowHeight);
  });
});

describe('buildConnectorData', () => {
  test('produces connector data with pixel-space coordinates', () => {
    const nodes = makeNodes([
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'child', sex: 'male', isEgo: true },
    ]);
    const edges = makeEdges([
      { source: 'father', target: 'mother', relationship: 'partner' },
      { source: 'father', target: 'child', relationship: 'parent' },
      { source: 'mother', target: 'child', relationship: 'parent' },
    ]);

    const { input, indexToId } = storeToPedigreeInput(nodes, edges);
    const layout = alignPedigree(input);
    const { connectors } = buildConnectorData(layout, edges);

    // Should have at least one spouse line and one parent-child line
    expect(connectors.spouseLines.length).toBeGreaterThanOrEqual(1);
    expect(connectors.parentChildLines.length).toBeGreaterThanOrEqual(1);

    // All coordinates should be in pixel space (not abstract units)
    for (const sp of connectors.spouseLines) {
      expect(sp.segment.x1).toBeGreaterThanOrEqual(0);
    }
  });

  
});

describe('end-to-end: store → layout → positions', () => {
  test('parents are above children (smaller y)', () => {
    const nodes = makeNodes([
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'child', sex: 'male', isEgo: true },
    ]);
    const edges = makeEdges([
      { source: 'father', target: 'mother', relationship: 'partner' },
      { source: 'father', target: 'child', relationship: 'parent' },
      { source: 'mother', target: 'child', relationship: 'parent' },
    ]);

    const { input, indexToId } = storeToPedigreeInput(nodes, edges);
    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(layout, indexToId);

    expect(positions.get('father')!.y).toBeLessThan(positions.get('child')!.y);
    expect(positions.get('mother')!.y).toBeLessThan(positions.get('child')!.y);
  });

  test('partners are on same row (same y)', () => {
    const nodes = makeNodes([
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
    ]);
    const edges = makeEdges([
      { source: 'father', target: 'mother', relationship: 'partner' },
    ]);

    const { input, indexToId } = storeToPedigreeInput(nodes, edges);
    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(layout, indexToId);

    expect(positions.get('father')!.y).toBe(positions.get('mother')!.y);
  });

  test('siblings are on same row (same y)', () => {
    const nodes = makeNodes([
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'ego', sex: 'male', isEgo: true },
      { id: 'sibling', sex: 'female' },
    ]);
    const edges = makeEdges([
      { source: 'father', target: 'mother', relationship: 'partner' },
      { source: 'father', target: 'ego', relationship: 'parent' },
      { source: 'mother', target: 'ego', relationship: 'parent' },
      { source: 'father', target: 'sibling', relationship: 'parent' },
      { source: 'mother', target: 'sibling', relationship: 'parent' },
    ]);

    const { input, indexToId } = storeToPedigreeInput(nodes, edges);
    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(layout, indexToId);

    expect(positions.get('ego')!.y).toBe(positions.get('sibling')!.y);
  });

  test('all nodes receive positions', () => {
    const nodes = makeNodes([
      { id: 'gf', sex: 'male' },
      { id: 'gm', sex: 'female' },
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'ego', sex: 'female', isEgo: true },
    ]);
    const edges = makeEdges([
      { source: 'gf', target: 'gm', relationship: 'partner' },
      { source: 'gf', target: 'father', relationship: 'parent' },
      { source: 'gm', target: 'father', relationship: 'parent' },
      { source: 'father', target: 'mother', relationship: 'partner' },
      { source: 'father', target: 'ego', relationship: 'parent' },
      { source: 'mother', target: 'ego', relationship: 'parent' },
    ]);

    const { input, indexToId } = storeToPedigreeInput(nodes, edges);
    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(layout, indexToId);

    expect(positions.size).toBe(nodes.size);
    for (const nodeId of nodes.keys()) {
      expect(positions.has(nodeId)).toBe(true);
    }
  });
});

import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { describe, expect, test } from 'vitest';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { alignPedigree } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/alignPedigree';
import {
  computeLayoutMetrics,
  type LayoutDimensions,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/layoutDimensions';
import {
  buildConnectorData,
  pedigreeLayoutToPositions,
  storeToPedigreeInput,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/pedigreeAdapter';
import { type PedigreeLayout } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/types';

const variableConfig: VariableConfig = {
  nodeType: 'person',
  edgeType: 'family',
  nodeLabelVariable: 'name',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'rel',
  isActiveVariable: 'active',
  isGestationalCarrierVariable: 'gc',
};

const TEST_DIMENSIONS: LayoutDimensions = {
  nodeWidth: 100,
  nodeHeight: 100,
};

function makeNodes(
  entries: { id: string; isEgo?: boolean }[],
): Map<string, NcNode> {
  const map = new Map<string, NcNode>();
  for (const { id, isEgo } of entries) {
    map.set(id, {
      _uid: id,
      type: 'person',
      attributes: {
        [variableConfig.egoVariable]: isEgo ?? false,
      },
    });
  }
  return map;
}

function makeEdges(
  entries: {
    from: string;
    to: string;
    relationshipType: string;
    isActive?: boolean;
  }[],
): Map<string, NcEdge> {
  const map = new Map<string, NcEdge>();
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    map.set(`e${i}`, {
      _uid: `e${i}`,
      type: 'family',
      from: e.from,
      to: e.to,
      attributes: {
        [variableConfig.relationshipTypeVariable]: e.relationshipType,
        [variableConfig.isActiveVariable]: e.isActive ?? true,
      },
    });
  }
  return map;
}

describe('storeToPedigreeInput', () => {
  test('empty graph produces empty input', () => {
    const { input } = storeToPedigreeInput(
      new Map(),
      new Map(),
      variableConfig,
    );
    expect(input.id).toHaveLength(0);
    expect(input.parents).toHaveLength(0);
  });

  test('single node produces correct single-element arrays', () => {
    const nodes = makeNodes([{ id: 'ego', isEgo: true }]);
    const { input, indexToId, idToIndex } = storeToPedigreeInput(
      nodes,
      new Map(),
      variableConfig,
    );

    expect(input.id).toEqual(['ego']);
    expect(input.parents).toEqual([[]]);
    expect(indexToId).toEqual(['ego']);
    expect(idToIndex.get('ego')).toBe(0);
  });

  test('nuclear family produces correct parent connections from edges', () => {
    const nodes = makeNodes([
      { id: 'father' },
      { id: 'mother' },
      { id: 'child', isEgo: true },
    ]);
    const edges = makeEdges([
      { from: 'father', to: 'mother', relationshipType: 'partner' },
      { from: 'father', to: 'child', relationshipType: 'biological' },
      { from: 'mother', to: 'child', relationshipType: 'biological' },
    ]);

    const { input, idToIndex } = storeToPedigreeInput(
      nodes,
      edges,
      variableConfig,
    );

    const childIdx = idToIndex.get('child')!;
    const fatherIdx = idToIndex.get('father')!;
    const motherIdx = idToIndex.get('mother')!;

    expect(input.parents[childIdx]).toHaveLength(2);
    const parentIndices = input.parents[childIdx]!.map((p) => p.parentIndex);
    expect(parentIndices).toContain(fatherIdx);
    expect(parentIndices).toContain(motherIdx);

    expect(input.parents[fatherIdx]).toHaveLength(0);
    expect(input.parents[motherIdx]).toHaveLength(0);
  });

  test('three-generation pedigree produces correct indexing', () => {
    const nodes = makeNodes([
      { id: 'gf' },
      { id: 'gm' },
      { id: 'father' },
      { id: 'mother' },
      { id: 'child', isEgo: true },
    ]);
    const edges = makeEdges([
      { from: 'gf', to: 'gm', relationshipType: 'partner' },
      { from: 'gf', to: 'father', relationshipType: 'biological' },
      { from: 'gm', to: 'father', relationshipType: 'biological' },
      { from: 'father', to: 'mother', relationshipType: 'partner' },
      { from: 'father', to: 'child', relationshipType: 'biological' },
      { from: 'mother', to: 'child', relationshipType: 'biological' },
    ]);

    const { input, idToIndex } = storeToPedigreeInput(
      nodes,
      edges,
      variableConfig,
    );

    const fatherIdx = idToIndex.get('father')!;
    const gfIdx = idToIndex.get('gf')!;
    const gmIdx = idToIndex.get('gm')!;

    const fatherParentIndices = input.parents[fatherIdx]!.map(
      (p) => p.parentIndex,
    );
    expect(fatherParentIndices).toContain(gfIdx);
    expect(fatherParentIndices).toContain(gmIdx);

    const childIdx = idToIndex.get('child')!;
    const childParentIndices = input.parents[childIdx]!.map(
      (p) => p.parentIndex,
    );
    expect(childParentIndices).toContain(fatherIdx);
    expect(childParentIndices).toContain(idToIndex.get('mother')!);
  });

  test('partner edges produce Relation entries with code 4', () => {
    const nodes = makeNodes([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    const edges = makeEdges([
      { from: 'a', to: 'b', relationshipType: 'partner' },
      { from: 'a', to: 'c', relationshipType: 'partner' },
    ]);

    const { input } = storeToPedigreeInput(nodes, edges, variableConfig);

    expect(input.relation).toHaveLength(2);
    expect(input.relation![0]!.code).toBe(4);
    expect(input.relation![1]!.code).toBe(4);
  });

  test('single parent produces one parent connection', () => {
    const nodes = makeNodes([{ id: 'parent' }, { id: 'child' }]);
    const edges = makeEdges([
      { from: 'parent', to: 'child', relationshipType: 'biological' },
    ]);

    const { input, idToIndex } = storeToPedigreeInput(
      nodes,
      edges,
      variableConfig,
    );
    const childIdx = idToIndex.get('child')!;

    expect(input.parents[childIdx]).toHaveLength(1);
    expect(input.parents[childIdx]![0]!.parentIndex).toBe(
      idToIndex.get('parent')!,
    );
  });

  test('passes ParentEdgeType straight through without translation', () => {
    const nodes = makeNodes([
      { id: 'sp' },
      { id: 'donor' },
      { id: 'child', isEgo: true },
    ]);
    const edges = makeEdges([
      { from: 'sp', to: 'child', relationshipType: 'biological' },
      { from: 'donor', to: 'child', relationshipType: 'donor' },
    ]);

    const result = storeToPedigreeInput(nodes, edges, variableConfig);
    const childIdx = result.idToIndex.get('child')!;
    const edgeTypes = result.input.parents[childIdx]!.map((p) => p.edgeType);
    expect(edgeTypes).toContain('biological');
    expect(edgeTypes).toContain('donor');
  });
});

describe('pedigreeLayoutToPositions', () => {
  test('converts positions using siblingSpacing and rowHeight', () => {
    const layout: PedigreeLayout = {
      n: [2],
      nid: [[0, 1]],
      pos: [[0, 2.5]],
      fam: [[0, 0]],
      group: [[0, 0]],
      twins: null,
      groupMember: [[false, false]],
    };

    const positions = pedigreeLayoutToPositions(
      layout,
      ['a', 'b'],
      TEST_DIMENSIONS,
    );

    const posA = positions.get('a')!;
    const posB = positions.get('b')!;
    expect(posA.x).toBe(0);
    expect(posA.y).toBe(0);
    expect(posB.x).toBe(
      2.5 * computeLayoutMetrics(TEST_DIMENSIONS).siblingSpacing,
    );
    expect(posB.y).toBe(0);
  });

  test('normalizes so min x = 0', () => {
    const layout: PedigreeLayout = {
      n: [2],
      nid: [[0, 1]],
      pos: [[3, 5]],
      fam: [[0, 0]],
      group: [[0, 0]],
      twins: null,
      groupMember: [[false, false]],
    };

    const positions = pedigreeLayoutToPositions(
      layout,
      ['a', 'b'],
      TEST_DIMENSIONS,
    );

    const posA = positions.get('a')!;
    expect(posA.x).toBe(0);
    const posB = positions.get('b')!;
    expect(posB.x).toBe(
      2 * computeLayoutMetrics(TEST_DIMENSIONS).siblingSpacing,
    );
  });

  test('multi-generation layout uses rowHeight for y', () => {
    const layout: PedigreeLayout = {
      n: [1, 1],
      nid: [[0], [1]],
      pos: [[0], [0]],
      fam: [[0], [0]],
      group: [[0], [0]],
      twins: null,
      groupMember: [[false], [false]],
    };

    const positions = pedigreeLayoutToPositions(
      layout,
      ['parent', 'child'],
      TEST_DIMENSIONS,
    );

    expect(positions.get('parent')!.y).toBe(0);
    expect(positions.get('child')!.y).toBe(
      computeLayoutMetrics(TEST_DIMENSIONS).rowHeight,
    );
  });
});

describe('buildConnectorData', () => {
  test('produces connector data with pixel-space coordinates', () => {
    const nodes = makeNodes([
      { id: 'father' },
      { id: 'mother' },
      { id: 'child', isEgo: true },
    ]);
    const edges = makeEdges([
      { from: 'father', to: 'mother', relationshipType: 'partner' },
      { from: 'father', to: 'child', relationshipType: 'biological' },
      { from: 'mother', to: 'child', relationshipType: 'biological' },
    ]);

    const { input, idToIndex } = storeToPedigreeInput(
      nodes,
      edges,
      variableConfig,
    );
    const layout = alignPedigree(input);
    const { connectors } = buildConnectorData(
      layout,
      edges,
      TEST_DIMENSIONS,
      variableConfig,
      input.parents,
      idToIndex,
    );

    expect(connectors.groupLines.length).toBeGreaterThanOrEqual(1);
    expect(connectors.parentChildLines.length).toBeGreaterThanOrEqual(1);

    for (const gl of connectors.groupLines) {
      expect(gl.segment.x1).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('end-to-end: store → layout → positions', () => {
  test('parents are above children (smaller y)', () => {
    const nodes = makeNodes([
      { id: 'father' },
      { id: 'mother' },
      { id: 'child', isEgo: true },
    ]);
    const edges = makeEdges([
      { from: 'father', to: 'mother', relationshipType: 'partner' },
      { from: 'father', to: 'child', relationshipType: 'biological' },
      { from: 'mother', to: 'child', relationshipType: 'biological' },
    ]);

    const { input, indexToId } = storeToPedigreeInput(
      nodes,
      edges,
      variableConfig,
    );
    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(
      layout,
      indexToId,
      TEST_DIMENSIONS,
    );

    expect(positions.get('father')!.y).toBeLessThan(positions.get('child')!.y);
    expect(positions.get('mother')!.y).toBeLessThan(positions.get('child')!.y);
  });

  test('partners are on same row (same y)', () => {
    const nodes = makeNodes([{ id: 'father' }, { id: 'mother' }]);
    const edges = makeEdges([
      { from: 'father', to: 'mother', relationshipType: 'partner' },
    ]);

    const { input, indexToId } = storeToPedigreeInput(
      nodes,
      edges,
      variableConfig,
    );
    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(
      layout,
      indexToId,
      TEST_DIMENSIONS,
    );

    expect(positions.get('father')!.y).toBe(positions.get('mother')!.y);
  });

  test('siblings are on same row (same y)', () => {
    const nodes = makeNodes([
      { id: 'father' },
      { id: 'mother' },
      { id: 'ego', isEgo: true },
      { id: 'sibling' },
    ]);
    const edges = makeEdges([
      { from: 'father', to: 'mother', relationshipType: 'partner' },
      { from: 'father', to: 'ego', relationshipType: 'biological' },
      { from: 'mother', to: 'ego', relationshipType: 'biological' },
      { from: 'father', to: 'sibling', relationshipType: 'biological' },
      { from: 'mother', to: 'sibling', relationshipType: 'biological' },
    ]);

    const { input, indexToId } = storeToPedigreeInput(
      nodes,
      edges,
      variableConfig,
    );
    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(
      layout,
      indexToId,
      TEST_DIMENSIONS,
    );

    expect(positions.get('ego')!.y).toBe(positions.get('sibling')!.y);
  });

  test('all nodes receive positions', () => {
    const nodes = makeNodes([
      { id: 'gf' },
      { id: 'gm' },
      { id: 'father' },
      { id: 'mother' },
      { id: 'ego', isEgo: true },
    ]);
    const edges = makeEdges([
      { from: 'gf', to: 'gm', relationshipType: 'partner' },
      { from: 'gf', to: 'father', relationshipType: 'biological' },
      { from: 'gm', to: 'father', relationshipType: 'biological' },
      { from: 'father', to: 'mother', relationshipType: 'partner' },
      { from: 'father', to: 'ego', relationshipType: 'biological' },
      { from: 'mother', to: 'ego', relationshipType: 'biological' },
    ]);

    const { input, indexToId } = storeToPedigreeInput(
      nodes,
      edges,
      variableConfig,
    );
    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(
      layout,
      indexToId,
      TEST_DIMENSIONS,
    );

    expect(positions.size).toBe(nodes.size);
    for (const nodeId of nodes.keys()) {
      expect(positions.has(nodeId)).toBe(true);
    }
  });
});

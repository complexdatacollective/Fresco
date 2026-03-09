import { describe, expect, test } from 'vitest';
import {
  computeLayoutMetrics,
  type LayoutDimensions,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/layoutDimensions';
import {
  buildConnectorData,
  pedigreeLayoutToPositions,
  storeToPedigreeInput,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter';
import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { alignPedigree } from '~/lib/pedigree-layout/alignPedigree';
import { type PedigreeLayout } from '~/lib/pedigree-layout/types';

const TEST_DIMENSIONS: LayoutDimensions = {
  nodeWidth: 100,
  nodeHeight: 100,
};

function makeNodes(
  entries: { id: string; sex?: 'male' | 'female'; isEgo?: boolean }[],
) {
  const map = new Map<string, NodeData>();
  for (const { id, sex, isEgo } of entries) {
    map.set(id, { label: id, sex, isEgo: isEgo ?? false });
  }
  return map;
}

function makeEdges(
  entries: (
    | { source: string; target: string; type: 'partner'; current?: boolean }
    | {
        source: string;
        target: string;
        type: 'parent';
        edgeType: Extract<StoreEdge, { type: 'parent' }>['edgeType'];
      }
  )[],
) {
  const map = new Map<string, StoreEdge>();
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    if (e.type === 'partner') {
      map.set(`e${i}`, {
        source: e.source,
        target: e.target,
        type: 'partner',
        current: e.current ?? true,
      });
    } else {
      map.set(`e${i}`, {
        source: e.source,
        target: e.target,
        type: 'parent',
        edgeType: e.edgeType,
      });
    }
  }
  return map;
}

describe('storeToPedigreeInput', () => {
  test('empty graph produces empty input', () => {
    const { input } = storeToPedigreeInput(new Map(), new Map());
    expect(input.id).toHaveLength(0);
    expect(input.parents).toHaveLength(0);
    expect(input.sex).toHaveLength(0);
    expect(input.gender).toHaveLength(0);
  });

  test('single node produces correct single-element arrays', () => {
    const nodes = makeNodes([{ id: 'ego', sex: 'male', isEgo: true }]);
    const { input, indexToId, idToIndex } = storeToPedigreeInput(
      nodes,
      new Map(),
    );

    expect(input.id).toEqual(['ego']);
    expect(input.sex).toEqual(['male']);
    expect(input.gender).toEqual(['man']);
    expect(input.parents).toEqual([[]]);
    expect(indexToId).toEqual(['ego']);
    expect(idToIndex.get('ego')).toBe(0);
  });

  test('nuclear family produces correct parent connections from edges', () => {
    const nodes = makeNodes([
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'child', sex: 'male', isEgo: true },
    ]);
    const edges = makeEdges([
      { source: 'father', target: 'mother', type: 'partner' },
      {
        source: 'father',
        target: 'child',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'mother',
        target: 'child',
        type: 'parent',
        edgeType: 'social-parent',
      },
    ]);

    const { input, idToIndex } = storeToPedigreeInput(nodes, edges);

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
      { id: 'gf', sex: 'male' },
      { id: 'gm', sex: 'female' },
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'child', sex: 'female', isEgo: true },
    ]);
    const edges = makeEdges([
      { source: 'gf', target: 'gm', type: 'partner' },
      {
        source: 'gf',
        target: 'father',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'gm',
        target: 'father',
        type: 'parent',
        edgeType: 'social-parent',
      },
      { source: 'father', target: 'mother', type: 'partner' },
      {
        source: 'father',
        target: 'child',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'mother',
        target: 'child',
        type: 'parent',
        edgeType: 'social-parent',
      },
    ]);

    const { input, idToIndex } = storeToPedigreeInput(nodes, edges);

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
    const nodes = makeNodes([
      { id: 'a', sex: 'male' },
      { id: 'b', sex: 'female' },
      { id: 'c', sex: 'female' },
    ]);
    const edges = makeEdges([
      { source: 'a', target: 'b', type: 'partner' },
      { source: 'a', target: 'c', type: 'partner' },
    ]);

    const { input } = storeToPedigreeInput(nodes, edges);

    expect(input.relation).toHaveLength(2);
    expect(input.relation![0]!.code).toBe(4);
    expect(input.relation![1]!.code).toBe(4);
  });

  test('single parent produces one parent connection', () => {
    const nodes = makeNodes([
      { id: 'parent', sex: 'male' },
      { id: 'child', sex: 'female' },
    ]);
    const edges = makeEdges([
      {
        source: 'parent',
        target: 'child',
        type: 'parent',
        edgeType: 'social-parent',
      },
    ]);

    const { input, idToIndex } = storeToPedigreeInput(nodes, edges);
    const childIdx = idToIndex.get('child')!;

    expect(input.parents[childIdx]).toHaveLength(1);
    expect(input.parents[childIdx]![0]!.parentIndex).toBe(
      idToIndex.get('parent')!,
    );
  });

  test('node with undefined sex is mapped to unknown', () => {
    const nodes = makeNodes([{ id: 'x' }]);
    const { input } = storeToPedigreeInput(nodes, new Map());
    expect(input.sex[0]).toBe('unknown');
    expect(input.gender[0]).toBe('unknown');
  });

  test('passes ParentEdgeType straight through without translation', () => {
    const nodes = makeNodes([
      { id: 'sp' },
      { id: 'donor' },
      { id: 'child', isEgo: true },
    ]);
    const edges = makeEdges([
      {
        source: 'sp',
        target: 'child',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'donor',
        target: 'child',
        type: 'parent',
        edgeType: 'donor',
      },
    ]);

    const result = storeToPedigreeInput(nodes, edges);
    const childIdx = result.idToIndex.get('child')!;
    const edgeTypes = result.input.parents[childIdx]!.map((p) => p.edgeType);
    expect(edgeTypes).toContain('social-parent');
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
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'child', sex: 'male', isEgo: true },
    ]);
    const edges = makeEdges([
      { source: 'father', target: 'mother', type: 'partner' },
      {
        source: 'father',
        target: 'child',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'mother',
        target: 'child',
        type: 'parent',
        edgeType: 'social-parent',
      },
    ]);

    const { input } = storeToPedigreeInput(nodes, edges);
    const layout = alignPedigree(input);
    const { connectors } = buildConnectorData(
      layout,
      edges,
      TEST_DIMENSIONS,
      input.parents,
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
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'child', sex: 'male', isEgo: true },
    ]);
    const edges = makeEdges([
      { source: 'father', target: 'mother', type: 'partner' },
      {
        source: 'father',
        target: 'child',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'mother',
        target: 'child',
        type: 'parent',
        edgeType: 'social-parent',
      },
    ]);

    const { input, indexToId } = storeToPedigreeInput(nodes, edges);
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
    const nodes = makeNodes([
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
    ]);
    const edges = makeEdges([
      { source: 'father', target: 'mother', type: 'partner' },
    ]);

    const { input, indexToId } = storeToPedigreeInput(nodes, edges);
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
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'ego', sex: 'male', isEgo: true },
      { id: 'sibling', sex: 'female' },
    ]);
    const edges = makeEdges([
      { source: 'father', target: 'mother', type: 'partner' },
      {
        source: 'father',
        target: 'ego',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'mother',
        target: 'ego',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'father',
        target: 'sibling',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'mother',
        target: 'sibling',
        type: 'parent',
        edgeType: 'social-parent',
      },
    ]);

    const { input, indexToId } = storeToPedigreeInput(nodes, edges);
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
      { id: 'gf', sex: 'male' },
      { id: 'gm', sex: 'female' },
      { id: 'father', sex: 'male' },
      { id: 'mother', sex: 'female' },
      { id: 'ego', sex: 'female', isEgo: true },
    ]);
    const edges = makeEdges([
      { source: 'gf', target: 'gm', type: 'partner' },
      {
        source: 'gf',
        target: 'father',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'gm',
        target: 'father',
        type: 'parent',
        edgeType: 'social-parent',
      },
      { source: 'father', target: 'mother', type: 'partner' },
      {
        source: 'father',
        target: 'ego',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'mother',
        target: 'ego',
        type: 'parent',
        edgeType: 'social-parent',
      },
    ]);

    const { input, indexToId } = storeToPedigreeInput(nodes, edges);
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

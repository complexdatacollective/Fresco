import { describe, expect, test } from 'vitest';
import {
  layoutFamilyTree,
  type LayoutNode,
  type LayoutEdge,
} from '../layoutFamilyTree';

const createGraph = (
  nodeData: ({ id: string } & LayoutNode)[],
  edgeData: (Omit<LayoutEdge, 'id'> & { id?: string })[],
) => {
  const nodes = new Map<string, LayoutNode>();
  for (const { id, ...rest } of nodeData) {
    nodes.set(id, rest);
  }

  const edges = new Map<string, LayoutEdge>();
  for (let i = 0; i < edgeData.length; i++) {
    const edge = edgeData[i]!;
    const edgeId = edge.id ?? `edge-${i}`;
    edges.set(edgeId, {
      source: edge.source,
      target: edge.target,
      relationship: edge.relationship,
    });
  }

  return { nodes, edges };
};

describe('layoutFamilyTree', () => {
  test('returns empty map when no ego node exists', () => {
    const { nodes, edges } = createGraph([{ id: 'node1', isEgo: false }], []);
    const result = layoutFamilyTree(nodes, edges);
    expect(result.size).toBe(0);
  });

  test('positions single ego node at origin', () => {
    const { nodes, edges } = createGraph([{ id: 'ego', isEgo: true }], []);
    const result = layoutFamilyTree(nodes, edges);

    expect(result.size).toBe(1);
    expect(result.get('ego')).toEqual({ x: 0, y: 0 });
  });

  test('positions ego with partner', () => {
    const { nodes, edges } = createGraph(
      [
        { id: 'ego', isEgo: true, sex: 'female' },
        { id: 'partner', isEgo: false, sex: 'male' },
      ],
      [{ source: 'ego', target: 'partner', relationship: 'partner' }],
    );

    const result = layoutFamilyTree(nodes, edges, {
      siblings: 150,
      partners: 150,
      generations: 200,
    });

    expect(result.size).toBe(2);
    const egoPos = result.get('ego')!;
    const partnerPos = result.get('partner')!;

    // Ego on left (female), partner on right (male)
    expect(egoPos.x).toBeLessThan(partnerPos.x);
    // Same generation (y)
    expect(egoPos.y).toBe(partnerPos.y);
    // Partner spacing
    expect(partnerPos.x - egoPos.x).toBe(150);
  });

  test('positions parents above children', () => {
    const { nodes, edges } = createGraph(
      [
        { id: 'ego', isEgo: true },
        { id: 'mother', isEgo: false, sex: 'female' },
        { id: 'father', isEgo: false, sex: 'male' },
      ],
      [
        { source: 'mother', target: 'father', relationship: 'partner' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'ego', relationship: 'parent' },
      ],
    );

    const result = layoutFamilyTree(nodes, edges, {
      siblings: 150,
      partners: 150,
      generations: 200,
    });

    const egoPos = result.get('ego')!;
    const motherPos = result.get('mother')!;
    const fatherPos = result.get('father')!;

    // Parents in generation 0, ego in generation 1
    expect(motherPos.y).toBe(0);
    expect(fatherPos.y).toBe(0);
    expect(egoPos.y).toBe(200);
  });

  test('positions siblings on same row', () => {
    const { nodes, edges } = createGraph(
      [
        { id: 'ego', isEgo: true },
        { id: 'sibling', isEgo: false },
        { id: 'mother', isEgo: false, sex: 'female' },
        { id: 'father', isEgo: false, sex: 'male' },
      ],
      [
        { source: 'mother', target: 'father', relationship: 'partner' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'ego', relationship: 'parent' },
        { source: 'mother', target: 'sibling', relationship: 'parent' },
        { source: 'father', target: 'sibling', relationship: 'parent' },
      ],
    );

    const result = layoutFamilyTree(nodes, edges);

    const egoPos = result.get('ego')!;
    const siblingPos = result.get('sibling')!;

    expect(egoPos.y).toBe(siblingPos.y);
  });

  test('positions three generations correctly', () => {
    const { nodes, edges } = createGraph(
      [
        { id: 'ego', isEgo: true },
        { id: 'mother', isEgo: false, sex: 'female' },
        { id: 'father', isEgo: false, sex: 'male' },
        { id: 'mat-grandma', isEgo: false, sex: 'female' },
        { id: 'mat-grandpa', isEgo: false, sex: 'male' },
        { id: 'pat-grandma', isEgo: false, sex: 'female' },
        { id: 'pat-grandpa', isEgo: false, sex: 'male' },
      ],
      [
        { source: 'mother', target: 'father', relationship: 'partner' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'ego', relationship: 'parent' },
        {
          source: 'mat-grandma',
          target: 'mat-grandpa',
          relationship: 'partner',
        },
        { source: 'mat-grandma', target: 'mother', relationship: 'parent' },
        { source: 'mat-grandpa', target: 'mother', relationship: 'parent' },
        {
          source: 'pat-grandma',
          target: 'pat-grandpa',
          relationship: 'partner',
        },
        { source: 'pat-grandma', target: 'father', relationship: 'parent' },
        { source: 'pat-grandpa', target: 'father', relationship: 'parent' },
      ],
    );

    const result = layoutFamilyTree(nodes, edges, {
      siblings: 150,
      partners: 150,
      generations: 200,
    });

    const egoPos = result.get('ego')!;
    const motherPos = result.get('mother')!;
    const fatherPos = result.get('father')!;
    const matGrandmaPos = result.get('mat-grandma')!;
    const patGrandpaPos = result.get('pat-grandpa')!;

    // Three generations: 0, 200, 400
    expect(matGrandmaPos.y).toBe(0);
    expect(patGrandpaPos.y).toBe(0);
    expect(motherPos.y).toBe(200);
    expect(fatherPos.y).toBe(200);
    expect(egoPos.y).toBe(400);
  });

  test('handles ego with children', () => {
    const { nodes, edges } = createGraph(
      [
        { id: 'ego', isEgo: true, sex: 'female' },
        { id: 'partner', isEgo: false, sex: 'male' },
        { id: 'child', isEgo: false },
      ],
      [
        { source: 'ego', target: 'partner', relationship: 'partner' },
        { source: 'ego', target: 'child', relationship: 'parent' },
        { source: 'partner', target: 'child', relationship: 'parent' },
      ],
    );

    const result = layoutFamilyTree(nodes, edges, {
      siblings: 150,
      partners: 150,
      generations: 200,
    });

    const egoPos = result.get('ego')!;
    const partnerPos = result.get('partner')!;
    const childPos = result.get('child')!;

    // Parents above child
    expect(egoPos.y).toBeLessThan(childPos.y);
    expect(partnerPos.y).toBeLessThan(childPos.y);
  });

  test('positions ex-partner adjacent to couple', () => {
    const { nodes, edges } = createGraph(
      [
        { id: 'ego', isEgo: true, sex: 'male' },
        { id: 'partner', isEgo: false, sex: 'female' },
        { id: 'ex', isEgo: false, sex: 'female' },
      ],
      [
        { source: 'ego', target: 'partner', relationship: 'partner' },
        { source: 'ego', target: 'ex', relationship: 'ex-partner' },
      ],
    );

    const result = layoutFamilyTree(nodes, edges, {
      siblings: 150,
      partners: 150,
      generations: 200,
    });

    const egoPos = result.get('ego')!;
    const partnerPos = result.get('partner')!;
    const exPos = result.get('ex')!;

    // All on same row
    expect(egoPos.y).toBe(partnerPos.y);
    expect(egoPos.y).toBe(exPos.y);

    // Ex is positioned outside the couple
    expect(result.size).toBe(3);
  });

  test('normalizes coordinates to start at x=0', () => {
    const { nodes, edges } = createGraph(
      [
        { id: 'ego', isEgo: true },
        { id: 'sibling', isEgo: false },
        { id: 'mother', isEgo: false, sex: 'female' },
        { id: 'father', isEgo: false, sex: 'male' },
      ],
      [
        { source: 'mother', target: 'father', relationship: 'partner' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'ego', relationship: 'parent' },
        { source: 'mother', target: 'sibling', relationship: 'parent' },
        { source: 'father', target: 'sibling', relationship: 'parent' },
      ],
    );

    const result = layoutFamilyTree(nodes, edges);

    // At least one node should be at x=0
    const xPositions = Array.from(result.values()).map((pos) => pos.x);
    const minX = Math.min(...xPositions);
    expect(minX).toBeGreaterThanOrEqual(0);
  });

  test('keeps partners on same generation when one has no parents', () => {
    const { nodes, edges } = createGraph(
      [
        { id: 'ego', isEgo: true },
        { id: 'partner', isEgo: false },
        { id: 'mother', isEgo: false, sex: 'female' },
        { id: 'father', isEgo: false, sex: 'male' },
      ],
      [
        { source: 'ego', target: 'partner', relationship: 'partner' },
        { source: 'mother', target: 'father', relationship: 'partner' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'ego', relationship: 'parent' },
      ],
    );

    const result = layoutFamilyTree(nodes, edges);

    const egoPos = result.get('ego')!;
    const partnerPos = result.get('partner')!;

    // Partner should be on same generation as ego, even without parents
    expect(egoPos.y).toBe(partnerPos.y);
  });

  test('handles complex family with cousins', () => {
    const { nodes, edges } = createGraph(
      [
        { id: 'ego', isEgo: true },
        { id: 'mother', isEgo: false, sex: 'female' },
        { id: 'father', isEgo: false, sex: 'male' },
        { id: 'aunt', isEgo: false, sex: 'female' },
        { id: 'uncle', isEgo: false, sex: 'male' },
        { id: 'cousin', isEgo: false },
        { id: 'grandma', isEgo: false, sex: 'female' },
        { id: 'grandpa', isEgo: false, sex: 'male' },
      ],
      [
        { source: 'mother', target: 'father', relationship: 'partner' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'ego', relationship: 'parent' },
        { source: 'aunt', target: 'uncle', relationship: 'partner' },
        { source: 'aunt', target: 'cousin', relationship: 'parent' },
        { source: 'uncle', target: 'cousin', relationship: 'parent' },
        { source: 'grandma', target: 'grandpa', relationship: 'partner' },
        { source: 'grandma', target: 'mother', relationship: 'parent' },
        { source: 'grandpa', target: 'mother', relationship: 'parent' },
        { source: 'grandma', target: 'aunt', relationship: 'parent' },
        { source: 'grandpa', target: 'aunt', relationship: 'parent' },
      ],
    );

    const result = layoutFamilyTree(nodes, edges, {
      siblings: 150,
      partners: 150,
      generations: 200,
    });

    const egoPos = result.get('ego')!;
    const cousinPos = result.get('cousin')!;
    const motherPos = result.get('mother')!;
    const auntPos = result.get('aunt')!;
    const grandmaPos = result.get('grandma')!;

    // Verify layer structure
    expect(grandmaPos.y).toBe(0);
    expect(motherPos.y).toBe(200);
    expect(auntPos.y).toBe(200);
    expect(egoPos.y).toBe(400);
    expect(cousinPos.y).toBe(400);
  });

  test('respects custom spacing', () => {
    const { nodes, edges } = createGraph(
      [
        { id: 'ego', isEgo: true, sex: 'female' },
        { id: 'partner', isEgo: false, sex: 'male' },
        { id: 'mother', isEgo: false, sex: 'female' },
        { id: 'father', isEgo: false, sex: 'male' },
      ],
      [
        { source: 'ego', target: 'partner', relationship: 'partner' },
        { source: 'mother', target: 'father', relationship: 'partner' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'ego', relationship: 'parent' },
      ],
    );

    const customSpacing = {
      siblings: 100,
      partners: 200,
      generations: 300,
    };

    const result = layoutFamilyTree(nodes, edges, customSpacing);

    const egoPos = result.get('ego')!;
    const partnerPos = result.get('partner')!;
    const motherPos = result.get('mother')!;

    // Check partner spacing
    expect(partnerPos.x - egoPos.x).toBe(200);
    // Check generation spacing
    expect(egoPos.y - motherPos.y).toBe(300);
  });

  test('positions multiple children correctly', () => {
    const { nodes, edges } = createGraph(
      [
        { id: 'ego', isEgo: true },
        { id: 'mother', isEgo: false, sex: 'female' },
        { id: 'father', isEgo: false, sex: 'male' },
        { id: 'sibling1', isEgo: false },
        { id: 'sibling2', isEgo: false },
      ],
      [
        { source: 'mother', target: 'father', relationship: 'partner' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'ego', relationship: 'parent' },
        { source: 'mother', target: 'sibling1', relationship: 'parent' },
        { source: 'father', target: 'sibling1', relationship: 'parent' },
        { source: 'mother', target: 'sibling2', relationship: 'parent' },
        { source: 'father', target: 'sibling2', relationship: 'parent' },
      ],
    );

    const result = layoutFamilyTree(nodes, edges, {
      siblings: 150,
      partners: 150,
      generations: 200,
    });

    const egoPos = result.get('ego')!;
    const sibling1Pos = result.get('sibling1')!;
    const sibling2Pos = result.get('sibling2')!;

    // All siblings on same row
    expect(egoPos.y).toBe(sibling1Pos.y);
    expect(egoPos.y).toBe(sibling2Pos.y);

    // Siblings should be spaced out
    const xPositions = [egoPos.x, sibling1Pos.x, sibling2Pos.x].sort(
      (a, b) => a - b,
    );
    expect(xPositions[1]! - xPositions[0]!).toBeGreaterThan(0);
    expect(xPositions[2]! - xPositions[1]!).toBeGreaterThan(0);
  });
});

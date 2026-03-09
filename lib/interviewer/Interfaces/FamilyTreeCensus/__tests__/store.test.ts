import { describe, expect, it } from 'vitest';
import {
  createFamilyTreeStore,
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

describe('store creation', () => {
  it('creates an empty store', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const state = store.getState();

    expect(state.step).toBe('scaffolding');
    expect(state.network.nodes.size).toBe(0);
    expect(state.network.edges.size).toBe(0);
  });

  it('creates a store with initial data', () => {
    const nodes = new Map<string, NodeData>([
      ['n1', { label: 'ego', sex: 'male', isEgo: true }],
      ['n2', { label: 'mother', sex: 'female', isEgo: false }],
    ]);
    const edges = new Map<string, StoreEdge>([
      [
        'e1',
        { source: 'n2', target: 'n1', type: 'parent', edgeType: 'bio-parent' },
      ],
    ]);

    const store = createFamilyTreeStore(nodes, edges);
    const state = store.getState();

    expect(state.network.nodes.size).toBe(2);
    expect(state.network.edges.size).toBe(1);
    expect(state.network.nodes.get('n1')?.label).toBe('ego');
  });
});

describe('addNode', () => {
  it('creates a node with a generated id', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const id = store
      .getState()
      .addNode({ label: 'test', sex: 'male', isEgo: false });

    expect(id).toBeDefined();
    expect(store.getState().network.nodes.has(id)).toBe(true);
  });

  it('stores data correctly without the id field', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const id = store
      .getState()
      .addNode({ label: 'ego', sex: 'female', isEgo: true, readOnly: false });

    const node = store.getState().network.nodes.get(id);
    expect(node).toEqual({
      label: 'ego',
      sex: 'female',
      isEgo: true,
      readOnly: false,
    });
    expect(node).not.toHaveProperty('id');
  });

  it('uses a provided id', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const id = store
      .getState()
      .addNode({ id: 'custom-id', label: 'test', isEgo: false });

    expect(id).toBe('custom-id');
    expect(store.getState().network.nodes.has('custom-id')).toBe(true);
  });
});

describe('updateNode', () => {
  it('merges partial updates', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const id = store
      .getState()
      .addNode({ label: 'test', sex: 'male', isEgo: false, readOnly: false });

    store.getState().updateNode(id, { label: 'updated', readOnly: true });

    const node = store.getState().network.nodes.get(id);
    expect(node?.label).toBe('updated');
    expect(node?.readOnly).toBe(true);
    expect(node?.sex).toBe('male');
    expect(node?.isEgo).toBe(false);
  });
});

describe('removeNode', () => {
  it('deletes the node and cascading edges', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const parentId = store
      .getState()
      .addNode({ label: 'parent', sex: 'female', isEgo: false });
    const childId = store
      .getState()
      .addNode({ label: 'child', sex: 'male', isEgo: false });
    const unrelatedId = store
      .getState()
      .addNode({ label: 'other', sex: 'male', isEgo: false });

    store.getState().addEdge({
      source: parentId,
      target: childId,
      type: 'parent',
      edgeType: 'bio-parent',
    });
    const keptEdgeId = store.getState().addEdge({
      source: unrelatedId,
      target: parentId,
      type: 'partner',
      current: true,
    });

    store.getState().removeNode(childId);

    expect(store.getState().network.nodes.has(childId)).toBe(false);
    // The parent edge to child should be removed
    const remainingEdges = Array.from(
      store.getState().network.edges.values(),
    ).filter((e) => e.source === childId || e.target === childId);
    expect(remainingEdges).toHaveLength(0);
    // The unrelated edge should remain
    expect(store.getState().network.edges.has(keptEdgeId)).toBe(true);
  });
});

describe('addEdge', () => {
  it('creates a parent edge with edgeType', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const id = store.getState().addEdge({
      source: 'n1',
      target: 'n2',
      type: 'parent',
      edgeType: 'bio-parent',
    });

    const edge = store.getState().network.edges.get(id);
    expect(edge).toBeDefined();
    expect(edge?.type).toBe('parent');
    if (edge?.type === 'parent') {
      expect(edge.edgeType).toBe('bio-parent');
    }
  });

  it('creates a partner edge with current flag', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const id = store.getState().addEdge({
      source: 'n1',
      target: 'n2',
      type: 'partner',
      current: true,
    });

    const edge = store.getState().network.edges.get(id);
    expect(edge).toBeDefined();
    expect(edge?.type).toBe('partner');
    if (edge?.type === 'partner') {
      expect(edge.current).toBe(true);
    }
  });

  it('strips the id field from stored data', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const id = store.getState().addEdge({
      id: 'custom-edge',
      source: 'n1',
      target: 'n2',
      type: 'parent',
      edgeType: 'donor',
    });

    expect(id).toBe('custom-edge');
    const edge = store.getState().network.edges.get(id);
    expect(edge).not.toHaveProperty('id');
  });
});

describe('removeEdge', () => {
  it('deletes the edge', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const id = store.getState().addEdge({
      source: 'n1',
      target: 'n2',
      type: 'partner',
      current: false,
    });

    expect(store.getState().network.edges.has(id)).toBe(true);
    store.getState().removeEdge(id);
    expect(store.getState().network.edges.has(id)).toBe(false);
  });
});

describe('clearNetwork', () => {
  it('removes all nodes and edges', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    store.getState().addNode({ label: 'a', isEgo: true });
    store.getState().addNode({ label: 'b', isEgo: false });
    store.getState().addEdge({
      source: 'x',
      target: 'y',
      type: 'partner',
      current: true,
    });

    store.getState().clearNetwork();

    expect(store.getState().network.nodes.size).toBe(0);
    expect(store.getState().network.edges.size).toBe(0);
  });
});

describe('setStep', () => {
  it('changes step', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    expect(store.getState().step).toBe('scaffolding');

    store.getState().setStep('diseaseNomination');
    expect(store.getState().step).toBe('diseaseNomination');
  });
});

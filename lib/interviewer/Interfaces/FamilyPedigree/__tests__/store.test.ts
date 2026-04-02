/* eslint-disable */
// @ts-nocheck -- TODO: Update tests for NcNode/NcEdge migration (Task 10)
import { describe, expect, it } from 'vitest';
import {
  createFamilyPedigreeStore,
  type NodeData,
  type StoreEdge,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { type useAppDispatch } from '~/lib/interviewer/store';

const testConfig: VariableConfig = {
  nodeLabelVariable: 'label',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'relationshipType',
  isActiveVariable: 'isActive',
  isGestationalCarrierVariable: 'isGestationalCarrier',
};

describe('store creation', () => {
  it('creates an empty store', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const state = store.getState();

    expect(state.step).toBe('scaffolding');
    expect(state.network.nodes.size).toBe(0);
    expect(state.network.edges.size).toBe(0);
  });

  it('creates a store with initial data', () => {
    const nodes = new Map<string, NodeData>([
      [
        'n1',
        {
          isEgo: true,
          attributes: {
            [testConfig.nodeLabelVariable]: 'ego',
          },
        },
      ],
      [
        'n2',
        {
          isEgo: false,
          attributes: {
            [testConfig.nodeLabelVariable]: 'mother',
          },
        },
      ],
    ]);
    const edges = new Map<string, StoreEdge>([
      [
        'e1',
        {
          source: 'n2',
          target: 'n1',
          relationshipType: 'biological',
          isActive: true,
        },
      ],
    ]);

    const store = createFamilyPedigreeStore(nodes, edges, testConfig);
    const state = store.getState();

    expect(state.network.nodes.size).toBe(2);
    expect(state.network.edges.size).toBe(1);
    expect(
      state.network.nodes.get('n1')?.attributes[testConfig.nodeLabelVariable],
    ).toBe('ego');
  });
});

describe('addNode', () => {
  it('creates a node with a generated id', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store.getState().addNode({
      isEgo: false,
      attributes: {
        [testConfig.nodeLabelVariable]: 'test',
      },
    });

    expect(id).toBeDefined();
    expect(store.getState().network.nodes.has(id)).toBe(true);
  });

  it('stores data correctly without the id field', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store.getState().addNode({
      isEgo: true,
      readOnly: false,
      attributes: {
        [testConfig.nodeLabelVariable]: 'ego',
      },
    });

    const node = store.getState().network.nodes.get(id);
    expect(node).toEqual({
      isEgo: true,
      readOnly: false,
      attributes: {
        [testConfig.nodeLabelVariable]: 'ego',
      },
    });
    expect(node).not.toHaveProperty('id');
  });

  it('uses a provided id', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store.getState().addNode({
      id: 'custom-id',
      isEgo: false,
      attributes: { [testConfig.nodeLabelVariable]: 'test' },
    });

    expect(id).toBe('custom-id');
    expect(store.getState().network.nodes.has('custom-id')).toBe(true);
  });
});

describe('updateNode', () => {
  it('merges partial updates', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store.getState().addNode({
      isEgo: false,
      readOnly: false,
      attributes: {
        [testConfig.nodeLabelVariable]: 'test',
      },
    });

    store.getState().updateNode(id, {
      readOnly: true,
      attributes: {
        [testConfig.nodeLabelVariable]: 'updated',
      },
    });

    const node = store.getState().network.nodes.get(id);
    expect(node?.attributes[testConfig.nodeLabelVariable]).toBe('updated');
    expect(node?.readOnly).toBe(true);
    expect(node?.isEgo).toBe(false);
  });
});

describe('removeNode', () => {
  it('deletes the node and cascading edges', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const parentId = store.getState().addNode({
      isEgo: false,
      attributes: {
        [testConfig.nodeLabelVariable]: 'parent',
      },
    });
    const childId = store.getState().addNode({
      isEgo: false,
      attributes: {
        [testConfig.nodeLabelVariable]: 'child',
      },
    });
    const unrelatedId = store.getState().addNode({
      isEgo: false,
      attributes: {
        [testConfig.nodeLabelVariable]: 'other',
      },
    });

    store.getState().addEdge({
      source: parentId,
      target: childId,
      relationshipType: 'biological',
      isActive: true,
    });
    const keptEdgeId = store.getState().addEdge({
      source: unrelatedId,
      target: parentId,
      relationshipType: 'partner',
      isActive: true,
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
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store.getState().addEdge({
      source: 'n1',
      target: 'n2',
      relationshipType: 'biological',
      isActive: true,
    });

    const edge = store.getState().network.edges.get(id);
    expect(edge).toBeDefined();
    expect(edge?.relationshipType).not.toBe('partner');
    if (edge && edge.relationshipType !== 'partner') {
      expect(edge.relationshipType).toBe('biological');
    }
  });

  it('creates a partner edge with current flag', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store.getState().addEdge({
      source: 'n1',
      target: 'n2',
      relationshipType: 'partner',
      isActive: true,
    });

    const edge = store.getState().network.edges.get(id);
    expect(edge).toBeDefined();
    expect(edge?.relationshipType).toBe('partner');
    if (edge?.relationshipType === 'partner') {
      expect(edge.isActive).toBe(true);
    }
  });

  it('strips the id field from stored data', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store.getState().addEdge({
      id: 'custom-edge',
      source: 'n1',
      target: 'n2',
      relationshipType: 'donor',
      isActive: true,
    });

    expect(id).toBe('custom-edge');
    const edge = store.getState().network.edges.get(id);
    expect(edge).not.toHaveProperty('id');
  });
});

describe('removeEdge', () => {
  it('deletes the edge', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store.getState().addEdge({
      source: 'n1',
      target: 'n2',
      relationshipType: 'partner',
      isActive: false,
    });

    expect(store.getState().network.edges.has(id)).toBe(true);
    store.getState().removeEdge(id);
    expect(store.getState().network.edges.has(id)).toBe(false);
  });
});

describe('clearNetwork', () => {
  it('removes all nodes and edges', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().addNode({
      isEgo: true,
      attributes: { [testConfig.nodeLabelVariable]: 'a' },
    });
    store.getState().addNode({
      isEgo: false,
      attributes: { [testConfig.nodeLabelVariable]: 'b' },
    });
    store.getState().addEdge({
      source: 'x',
      target: 'y',
      relationshipType: 'partner',
      isActive: true,
    });

    store.getState().clearNetwork();

    expect(store.getState().network.nodes.size).toBe(0);
    expect(store.getState().network.edges.size).toBe(0);
  });
});

describe('setStep', () => {
  it('changes step', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    expect(store.getState().step).toBe('scaffolding');

    store.getState().setStep('diseaseNomination');
    expect(store.getState().step).toBe('diseaseNomination');
  });
});

// generateQuickStartNetwork tests removed — function replaced by cell-based wizards

describe('syncMetadata', () => {
  it('dispatches updateStageMetadata with serialized nodes and edges', () => {
    const dispatched: unknown[] = [];
    const mockDispatch = ((action: unknown) => {
      dispatched.push(action);
      return action;
    }) as ReturnType<typeof useAppDispatch>;

    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      testConfig,
      mockDispatch,
    );
    store.getState().addNode({
      isEgo: true,
      attributes: { [testConfig.nodeLabelVariable]: 'Ego' },
    });
    store.getState().syncMetadata();
    expect(dispatched.length).toBe(1);
  });
});

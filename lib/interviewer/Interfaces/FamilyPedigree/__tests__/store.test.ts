import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import {
  createFamilyPedigreeStore,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { type useAppDispatch } from '~/lib/interviewer/store';

const testConfig: VariableConfig = {
  nodeType: 'person',
  edgeType: 'family',
  nodeLabelVariable: 'label',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'relationshipType',
  isActiveVariable: 'isActive',
  isGestationalCarrierVariable: 'isGestationalCarrier',
};

describe('store creation', () => {
  it('creates an empty store', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
    const state = store.getState();

    expect(state.step).toBe('scaffolding');
    expect(state.network.nodes.size).toBe(0);
    expect(state.network.edges.size).toBe(0);
  });

  it('creates a store with initial data', () => {
    const nodes = new Map<string, NcNode>([
      [
        'n1',
        {
          _uid: 'n1',
          type: 'person',
          attributes: {
            [testConfig.nodeLabelVariable]: 'ego',
            [testConfig.egoVariable]: true,
          },
        },
      ],
      [
        'n2',
        {
          _uid: 'n2',
          type: 'person',
          attributes: {
            [testConfig.nodeLabelVariable]: 'mother',
            [testConfig.egoVariable]: false,
          },
        },
      ],
    ]);
    const edges = new Map<string, NcEdge>([
      [
        'e1',
        {
          _uid: 'e1',
          type: 'family',
          from: 'n2',
          to: 'n1',
          attributes: {
            [testConfig.relationshipTypeVariable]: 'biological',
            [testConfig.isActiveVariable]: true,
          },
        },
      ],
    ]);

    const store = createFamilyPedigreeStore(
      nodes,
      edges,
      new Map(),
      testConfig,
    );
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
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
    const id = store.getState().addNode({
      attributes: {
        [testConfig.egoVariable]: false,
        [testConfig.nodeLabelVariable]: 'test',
      },
    });

    expect(id).toBeDefined();
    expect(store.getState().network.nodes.has(id)).toBe(true);
  });

  it('stores data correctly without the id field', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
    const id = store.getState().addNode({
      attributes: {
        [testConfig.egoVariable]: true,
        [testConfig.nodeLabelVariable]: 'ego',
      },
    });

    const node = store.getState().network.nodes.get(id);
    expect(node?.attributes[testConfig.nodeLabelVariable]).toBe('ego');
    expect(node?.attributes[testConfig.egoVariable]).toBe(true);
    expect(node?.type).toBe('person');
    expect(node?._uid).toBe(id);
  });

  it('uses a provided id', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
    const id = store.getState().addNode({
      id: 'custom-id',
      attributes: {
        [testConfig.egoVariable]: false,
        [testConfig.nodeLabelVariable]: 'test',
      },
    });

    expect(id).toBe('custom-id');
    expect(store.getState().network.nodes.has('custom-id')).toBe(true);
  });
});

describe('updateNode', () => {
  it('merges partial updates', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
    const id = store.getState().addNode({
      attributes: {
        [testConfig.egoVariable]: false,
        [testConfig.nodeLabelVariable]: 'test',
      },
    });

    store.getState().updateNode(id, {
      [testConfig.nodeLabelVariable]: 'updated',
    });

    const node = store.getState().network.nodes.get(id);
    expect(node?.attributes[testConfig.nodeLabelVariable]).toBe('updated');
    expect(node?.attributes[testConfig.egoVariable]).toBe(false);
  });
});

describe('removeNode', () => {
  it('deletes the node and cascading edges', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
    const parentId = store.getState().addNode({
      attributes: {
        [testConfig.egoVariable]: false,
        [testConfig.nodeLabelVariable]: 'parent',
      },
    });
    const childId = store.getState().addNode({
      attributes: {
        [testConfig.egoVariable]: false,
        [testConfig.nodeLabelVariable]: 'child',
      },
    });
    const unrelatedId = store.getState().addNode({
      attributes: {
        [testConfig.egoVariable]: false,
        [testConfig.nodeLabelVariable]: 'other',
      },
    });

    store.getState().addEdge({
      from: parentId,
      to: childId,
      attributes: {
        [testConfig.relationshipTypeVariable]: 'biological',
        [testConfig.isActiveVariable]: true,
      },
    });
    const keptEdgeId = store.getState().addEdge({
      from: unrelatedId,
      to: parentId,
      attributes: {
        [testConfig.relationshipTypeVariable]: 'partner',
        [testConfig.isActiveVariable]: true,
      },
    });

    store.getState().removeNode(childId);

    expect(store.getState().network.nodes.has(childId)).toBe(false);
    const remainingEdges = Array.from(
      store.getState().network.edges.values(),
    ).filter((e) => e.from === childId || e.to === childId);
    expect(remainingEdges).toHaveLength(0);
    expect(store.getState().network.edges.has(keptEdgeId)).toBe(true);
  });
});

describe('addEdge', () => {
  it('creates a parent edge with edgeType', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
    const id = store.getState().addEdge({
      from: 'n1',
      to: 'n2',
      attributes: {
        [testConfig.relationshipTypeVariable]: 'biological',
        [testConfig.isActiveVariable]: true,
      },
    });

    const edge = store.getState().network.edges.get(id);
    expect(edge).toBeDefined();
    expect(edge?.attributes[testConfig.relationshipTypeVariable]).toBe(
      'biological',
    );
  });

  it('creates a partner edge with current flag', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
    const id = store.getState().addEdge({
      from: 'n1',
      to: 'n2',
      attributes: {
        [testConfig.relationshipTypeVariable]: 'partner',
        [testConfig.isActiveVariable]: true,
      },
    });

    const edge = store.getState().network.edges.get(id);
    expect(edge).toBeDefined();
    expect(edge?.attributes[testConfig.relationshipTypeVariable]).toBe(
      'partner',
    );
    expect(edge?.attributes[testConfig.isActiveVariable]).toBe(true);
  });

  it('strips the id field from stored data', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
    const id = store.getState().addEdge({
      id: 'custom-edge',
      from: 'n1',
      to: 'n2',
      attributes: {
        [testConfig.relationshipTypeVariable]: 'donor',
        [testConfig.isActiveVariable]: true,
      },
    });

    expect(id).toBe('custom-edge');
    const edge = store.getState().network.edges.get(id);
    expect(edge?._uid).toBe('custom-edge');
  });
});

describe('removeEdge', () => {
  it('deletes the edge', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
    const id = store.getState().addEdge({
      from: 'n1',
      to: 'n2',
      attributes: {
        [testConfig.relationshipTypeVariable]: 'partner',
        [testConfig.isActiveVariable]: false,
      },
    });

    expect(store.getState().network.edges.has(id)).toBe(true);
    store.getState().removeEdge(id);
    expect(store.getState().network.edges.has(id)).toBe(false);
  });
});

describe('clearNetwork', () => {
  it('removes all nodes and edges', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
    store.getState().addNode({
      attributes: {
        [testConfig.egoVariable]: true,
        [testConfig.nodeLabelVariable]: 'a',
      },
    });
    store.getState().addNode({
      attributes: {
        [testConfig.egoVariable]: false,
        [testConfig.nodeLabelVariable]: 'b',
      },
    });
    store.getState().addEdge({
      from: 'x',
      to: 'y',
      attributes: {
        [testConfig.relationshipTypeVariable]: 'partner',
        [testConfig.isActiveVariable]: true,
      },
    });

    store.getState().clearNetwork();

    expect(store.getState().network.nodes.size).toBe(0);
    expect(store.getState().network.edges.size).toBe(0);
  });
});

describe('setStep', () => {
  it('changes step', () => {
    const store = createFamilyPedigreeStore(
      new Map(),
      new Map(),
      new Map(),
      testConfig,
    );
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
      new Map(),
      testConfig,
      mockDispatch,
    );
    store.getState().addNode({
      attributes: {
        [testConfig.egoVariable]: true,
        [testConfig.nodeLabelVariable]: 'Ego',
      },
    });
    store.getState().syncMetadata();
    expect(dispatched.length).toBe(1);
  });
});

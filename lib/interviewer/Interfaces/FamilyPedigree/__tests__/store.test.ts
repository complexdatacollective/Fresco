import { describe, expect, it } from 'vitest';
import {
  createFamilyPedigreeStore,
  type NodeData,
  type QuickStartData,
  type StoreEdge,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { type useAppDispatch } from '~/lib/interviewer/store';

const testConfig: VariableConfig = {
  nodeLabelVariable: 'label',
  biologicalSexVariable: 'sex',
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
      ['n1', { label: 'ego', shape: 'square', isEgo: true }],
      ['n2', { label: 'mother', shape: 'circle', isEgo: false }],
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
    expect(state.network.nodes.get('n1')?.label).toBe('ego');
  });
});

describe('addNode', () => {
  it('creates a node with a generated id', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store
      .getState()
      .addNode({ label: 'test', shape: 'square', isEgo: false });

    expect(id).toBeDefined();
    expect(store.getState().network.nodes.has(id)).toBe(true);
  });

  it('stores data correctly without the id field', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store
      .getState()
      .addNode({ label: 'ego', shape: 'circle', isEgo: true, readOnly: false });

    const node = store.getState().network.nodes.get(id);
    expect(node).toEqual({
      label: 'ego',
      shape: 'circle',
      isEgo: true,
      readOnly: false,
    });
    expect(node).not.toHaveProperty('id');
  });

  it('uses a provided id', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store
      .getState()
      .addNode({ id: 'custom-id', label: 'test', isEgo: false });

    expect(id).toBe('custom-id');
    expect(store.getState().network.nodes.has('custom-id')).toBe(true);
  });
});

describe('updateNode', () => {
  it('merges partial updates', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const id = store.getState().addNode({
      label: 'test',
      shape: 'square',
      isEgo: false,
      readOnly: false,
    });

    store.getState().updateNode(id, { label: 'updated', readOnly: true });

    const node = store.getState().network.nodes.get(id);
    expect(node?.label).toBe('updated');
    expect(node?.readOnly).toBe(true);
    expect(node?.shape).toBe('square');
    expect(node?.isEgo).toBe(false);
  });
});

describe('removeNode', () => {
  it('deletes the node and cascading edges', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    const parentId = store
      .getState()
      .addNode({ label: 'parent', shape: 'circle', isEgo: false });
    const childId = store
      .getState()
      .addNode({ label: 'child', shape: 'square', isEgo: false });
    const unrelatedId = store
      .getState()
      .addNode({ label: 'other', shape: 'square', isEgo: false });

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
    store.getState().addNode({ label: 'a', isEgo: true });
    store.getState().addNode({ label: 'b', isEgo: false });
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

const quickStart = (
  overrides: Partial<QuickStartData> = {},
): QuickStartData => ({
  parents: [],
  parentPartnerships: [],
  bioParents: [],
  siblings: [],
  partner: { hasPartner: false },
  childrenWithPartner: [],
  otherChildren: [],
  ...overrides,
});

describe('generateQuickStartNetwork', () => {
  it('creates only ego when all counts are zero', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(quickStart());

    const { nodes, edges } = store.getState().network;
    expect(nodes.size).toBe(1);
    expect(edges.size).toBe(0);

    const ego = [...nodes.values()].find((n) => n.isEgo);
    expect(ego).toBeDefined();
    expect(ego?.label).toBe('');
  });

  it('creates parents with parent edges and partner group', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [
          { name: '', nameKnown: false, edgeType: 'biological' },
          { name: '', nameKnown: false, edgeType: 'biological' },
        ],
        parentPartnerships: [{ parentIndices: [0, 1], isActive: true }],
      }),
    );

    const { nodes, edges } = store.getState().network;
    expect(nodes.size).toBe(3);

    const edgeArray = [...edges.values()];
    const parentEdges = edgeArray.filter(
      (e) => e.relationshipType !== 'partner',
    );
    const partnerEdges = edgeArray.filter(
      (e) => e.relationshipType === 'partner',
    );
    expect(parentEdges).toHaveLength(2);
    expect(partnerEdges).toHaveLength(1);
  });

  it('creates siblings linked to same parents as ego', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [
          { name: '', nameKnown: false, edgeType: 'biological' },
          { name: '', nameKnown: false, edgeType: 'biological' },
        ],
        parentPartnerships: [{ parentIndices: [0, 1], isActive: true }],
        siblings: [
          { name: '', sharedParentIndices: [0, 1] },
          { name: '', sharedParentIndices: [0, 1] },
        ],
      }),
    );

    const { nodes, edges } = store.getState().network;
    expect(nodes.size).toBe(5);

    const edgeArray = [...edges.values()];
    const parentEdges = edgeArray.filter(
      (e) => e.relationshipType !== 'partner',
    );
    const partnerEdges = edgeArray.filter(
      (e) => e.relationshipType === 'partner',
    );
    // 2 parents × 3 children (ego + 2 siblings) = 6 parent edges
    expect(parentEdges).toHaveLength(6);
    expect(partnerEdges).toHaveLength(1);
  });

  it('creates partner and children with partner', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        partner: { hasPartner: true, name: '' },
        childrenWithPartner: [{ name: '' }, { name: '' }],
      }),
    );

    const { nodes, edges } = store.getState().network;
    // ego + partner + 2 children = 4
    expect(nodes.size).toBe(4);

    const edgeArray = [...edges.values()];
    const parentEdges = edgeArray.filter(
      (e) => e.relationshipType !== 'partner',
    );
    const partnerEdges = edgeArray.filter(
      (e) => e.relationshipType === 'partner',
    );
    // 2 parents (ego + partner) × 2 children = 4
    expect(parentEdges).toHaveLength(4);
    expect(partnerEdges).toHaveLength(1);
  });

  it('creates solo children linked only to ego', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        otherChildren: [{ name: '' }, { name: '' }, { name: '' }],
      }),
    );

    const { nodes, edges } = store.getState().network;
    // ego + 3 children = 4
    expect(nodes.size).toBe(4);

    const edgeArray = [...edges.values()];
    const parentEdges = edgeArray.filter(
      (e) => e.relationshipType !== 'partner',
    );
    expect(parentEdges).toHaveLength(3);
  });

  it('sets adoption status on ego', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store
      .getState()
      .generateQuickStartNetwork(quickStart({ adoptionStatus: 'in' }));

    const ego = [...store.getState().network.nodes.values()].find(
      (n) => n.isEgo,
    );
    expect(ego?.adoptionStatus).toBe('in');
  });

  it('creates inactive partner edge for ex-partners', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [
          { name: 'Mom', nameKnown: true, edgeType: 'biological' },
          { name: 'Dad', nameKnown: true, edgeType: 'biological' },
        ],
        parentPartnerships: [{ parentIndices: [0, 1], isActive: false }],
      }),
    );

    const partnerEdge = [...store.getState().network.edges.values()].find(
      (e) => e.relationshipType === 'partner',
    );
    expect(partnerEdge).toBeDefined();
    expect(partnerEdge?.isActive).toBe(false);
  });

  it('sets gestational carrier flag on parent edge', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [
          { name: 'Mom', nameKnown: true, edgeType: 'biological' },
          { name: 'Donor', nameKnown: true, edgeType: 'donor' },
        ],
        parentPartnerships: [],
        gestationalCarrierParentIndex: 0,
      }),
    );

    const egoId = [...store.getState().network.nodes.entries()].find(
      ([, n]) => n.isEgo,
    )![0];
    const momEdge = [...store.getState().network.edges.values()].find(
      (e) =>
        e.target === egoId &&
        e.relationshipType !== 'partner' &&
        e.relationshipType === 'biological',
    );
    expect(momEdge).toBeDefined();
    if (momEdge && momEdge.relationshipType !== 'partner') {
      expect(momEdge.isGestationalCarrier).toBe(true);
    }
  });

  it('creates per-sibling parent assignments', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [
          { name: 'Mom', nameKnown: true, edgeType: 'biological' },
          { name: 'Donor1', nameKnown: true, edgeType: 'donor' },
          { name: 'Donor2', nameKnown: true, edgeType: 'donor' },
        ],
        parentPartnerships: [],
        siblings: [
          { name: 'Sib1', sharedParentIndices: [0, 1] },
          { name: 'Sib2', sharedParentIndices: [0, 2] },
        ],
      }),
    );

    const { nodes, edges } = store.getState().network;
    // ego + 3 parents + 2 siblings = 6
    expect(nodes.size).toBe(6);

    const sib1Entry = [...nodes.entries()].find(([, n]) => n.label === 'Sib1')!;
    const sib2Entry = [...nodes.entries()].find(([, n]) => n.label === 'Sib2')!;

    const sib1ParentEdges = [...edges.values()].filter(
      (e) => e.target === sib1Entry[0] && e.relationshipType !== 'partner',
    );
    const sib2ParentEdges = [...edges.values()].filter(
      (e) => e.target === sib2Entry[0] && e.relationshipType !== 'partner',
    );

    // Sib1 shares parents [0, 1] (Mom + Donor1)
    expect(sib1ParentEdges).toHaveLength(2);
    // Sib2 shares parents [0, 2] (Mom + Donor2)
    expect(sib2ParentEdges).toHaveLength(2);
  });
});

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
    store.getState().addNode({ label: 'Ego', isEgo: true });
    store.getState().syncMetadata();
    expect(dispatched.length).toBe(1);
  });
});

describe('integration: full flow', () => {
  it('quick-start → add donor → edit name → sync', () => {
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

    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [
          { name: '', nameKnown: false, edgeType: 'biological' },
          { name: '', nameKnown: false, edgeType: 'biological' },
        ],
        parentPartnerships: [{ parentIndices: [0, 1], isActive: true }],
      }),
    );
    expect(store.getState().network.nodes.size).toBe(3);

    const egoEntry = [...store.getState().network.nodes.entries()].find(
      ([_, n]) => n.isEgo,
    )!;
    const egoId = egoEntry[0];

    const donorId = store.getState().addNode({ label: '', isEgo: false });
    store.getState().addEdge({
      source: donorId,
      target: egoId,
      relationshipType: 'donor',
      isActive: true,
    });
    expect(store.getState().network.nodes.size).toBe(4);

    store.getState().updateNode(donorId, { label: 'Sperm Donor' });
    expect(store.getState().network.nodes.get(donorId)?.label).toBe(
      'Sperm Donor',
    );

    store.getState().syncMetadata();
    expect(dispatched.length).toBe(1);
  });
});

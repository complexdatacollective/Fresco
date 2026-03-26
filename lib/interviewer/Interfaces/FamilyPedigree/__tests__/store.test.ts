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
      [
        'n1',
        {
          isEgo: true,
          attributes: {
            [testConfig.nodeLabelVariable]: 'ego',
            [testConfig.biologicalSexVariable]: 'male',
          },
        },
      ],
      [
        'n2',
        {
          isEgo: false,
          attributes: {
            [testConfig.nodeLabelVariable]: 'mother',
            [testConfig.biologicalSexVariable]: 'female',
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
        [testConfig.biologicalSexVariable]: 'male',
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
        [testConfig.biologicalSexVariable]: 'female',
      },
    });

    const node = store.getState().network.nodes.get(id);
    expect(node).toEqual({
      isEgo: true,
      readOnly: false,
      attributes: {
        [testConfig.nodeLabelVariable]: 'ego',
        [testConfig.biologicalSexVariable]: 'female',
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
        [testConfig.biologicalSexVariable]: 'male',
      },
    });

    store.getState().updateNode(id, {
      readOnly: true,
      attributes: {
        [testConfig.nodeLabelVariable]: 'updated',
        [testConfig.biologicalSexVariable]: 'male',
      },
    });

    const node = store.getState().network.nodes.get(id);
    expect(node?.attributes[testConfig.nodeLabelVariable]).toBe('updated');
    expect(node?.readOnly).toBe(true);
    expect(node?.attributes[testConfig.biologicalSexVariable]).toBe('male');
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
        [testConfig.biologicalSexVariable]: 'female',
      },
    });
    const childId = store.getState().addNode({
      isEgo: false,
      attributes: {
        [testConfig.nodeLabelVariable]: 'child',
        [testConfig.biologicalSexVariable]: 'male',
      },
    });
    const unrelatedId = store.getState().addNode({
      isEgo: false,
      attributes: {
        [testConfig.nodeLabelVariable]: 'other',
        [testConfig.biologicalSexVariable]: 'male',
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
  parentBranches: [],
  halfSiblingOtherParents: [],
  siblingFamilies: [],
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
    expect(ego?.attributes[testConfig.nodeLabelVariable]).toBe('');
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

    const sib1Entry = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Sib1',
    )!;
    const sib2Entry = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Sib2',
    )!;

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

  it('creates grandparents for each parent branch', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [
          { name: 'Mom', nameKnown: true, edgeType: 'biological' },
          { name: 'Dad', nameKnown: true, edgeType: 'biological' },
        ],
        parentPartnerships: [{ parentIndices: [0, 1], isActive: true }],
        parentBranches: [
          {
            parentIndex: 0,
            grandparents: [
              { name: 'Grandma1', nameKnown: true },
              { name: 'Grandpa1', nameKnown: true },
            ],
            auntUncleCount: 0,
            auntsUncles: [],
          },
          {
            parentIndex: 1,
            grandparents: [
              { name: 'Grandma2', nameKnown: true },
              { name: 'Grandpa2', nameKnown: true },
            ],
            auntUncleCount: 0,
            auntsUncles: [],
          },
        ],
      }),
    );

    const { nodes, edges } = store.getState().network;
    // ego + 2 parents + 4 grandparents = 7
    expect(nodes.size).toBe(7);

    const grandma1 = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Grandma1',
    );
    const grandpa1 = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Grandpa1',
    );
    expect(grandma1).toBeDefined();
    expect(grandpa1).toBeDefined();

    const momEntry = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Mom',
    )!;

    // Each grandparent has a parent edge to Mom
    const gpToMomEdges = [...edges.values()].filter(
      (e) => e.target === momEntry[0] && e.relationshipType !== 'partner',
    );
    expect(gpToMomEdges).toHaveLength(2);

    // Grandparent pair has a partner edge
    const gpPartnerEdges = [...edges.values()].filter(
      (e) =>
        e.relationshipType === 'partner' &&
        ((e.source === grandma1![0] && e.target === grandpa1![0]) ||
          (e.source === grandpa1![0] && e.target === grandma1![0])),
    );
    expect(gpPartnerEdges).toHaveLength(1);
  });

  it('creates grandparent nodes with empty name when nameKnown is false', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [{ name: 'Mom', nameKnown: true, edgeType: 'biological' }],
        parentBranches: [
          {
            parentIndex: 0,
            grandparents: [
              { name: 'Grandma', nameKnown: true },
              { name: 'UnknownGP', nameKnown: false },
            ],
            auntUncleCount: 0,
            auntsUncles: [],
          },
        ],
      }),
    );

    // ego + mom + 2 grandparents = 4
    expect(store.getState().network.nodes.size).toBe(4);

    // The unknown grandparent should have empty name
    const unknownGP = [...store.getState().network.nodes.values()].find(
      (n) =>
        !n.isEgo &&
        n.attributes[testConfig.nodeLabelVariable] === '' &&
        n !== [...store.getState().network.nodes.values()].find((x) => x.isEgo),
    );
    expect(unknownGP).toBeDefined();
  });

  it('creates aunts/uncles linked to same grandparents as parent', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [{ name: 'Mom', nameKnown: true, edgeType: 'biological' }],
        parentBranches: [
          {
            parentIndex: 0,
            grandparents: [
              { name: 'Grandma', nameKnown: true },
              { name: 'Grandpa', nameKnown: true },
            ],
            auntUncleCount: 1,
            auntsUncles: [{ name: 'Aunt', hasChildren: false, children: [] }],
          },
        ],
      }),
    );

    const { nodes, edges } = store.getState().network;
    // ego + mom + 2 grandparents + aunt = 5
    expect(nodes.size).toBe(5);

    const auntEntry = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Aunt',
    )!;

    // Aunt should have 2 parent edges (from both grandparents)
    const auntParentEdges = [...edges.values()].filter(
      (e) => e.target === auntEntry[0] && e.relationshipType !== 'partner',
    );
    expect(auntParentEdges).toHaveLength(2);
  });

  it('creates cousins with aunt/uncle partner', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [{ name: 'Mom', nameKnown: true, edgeType: 'biological' }],
        parentBranches: [
          {
            parentIndex: 0,
            grandparents: [
              { name: 'Grandma', nameKnown: true },
              { name: 'Grandpa', nameKnown: true },
            ],
            auntUncleCount: 1,
            auntsUncles: [
              {
                name: 'Aunt',
                hasChildren: true,
                hasPartner: true,
                partner: { name: 'Uncle-in-law' },
                children: [{ name: 'Cousin1' }],
              },
            ],
          },
        ],
      }),
    );

    const { nodes, edges } = store.getState().network;
    // ego + mom + 2 grandparents + aunt + uncle-in-law + cousin = 7
    expect(nodes.size).toBe(7);

    const cousinEntry = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Cousin1',
    )!;

    // Cousin has 2 parent edges (aunt + uncle-in-law)
    const cousinParentEdges = [...edges.values()].filter(
      (e) => e.target === cousinEntry[0] && e.relationshipType !== 'partner',
    );
    expect(cousinParentEdges).toHaveLength(2);
  });

  it('creates cousins without partner (single parent)', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [{ name: 'Mom', nameKnown: true, edgeType: 'biological' }],
        parentBranches: [
          {
            parentIndex: 0,
            grandparents: [
              { name: 'Grandma', nameKnown: true },
              { name: 'Grandpa', nameKnown: true },
            ],
            auntUncleCount: 1,
            auntsUncles: [
              {
                name: 'Uncle',
                hasChildren: true,
                hasPartner: false,
                children: [{ name: 'Cousin1' }],
              },
            ],
          },
        ],
      }),
    );

    const { nodes, edges } = store.getState().network;
    // ego + mom + 2 grandparents + uncle + cousin = 6 (no partner)
    expect(nodes.size).toBe(6);

    const cousinEntry = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Cousin1',
    )!;

    // Cousin has only 1 parent edge (uncle only)
    const cousinParentEdges = [...edges.values()].filter(
      (e) => e.target === cousinEntry[0] && e.relationshipType !== 'partner',
    );
    expect(cousinParentEdges).toHaveLength(1);
  });

  it('single parent two donors: ego gets Mom+Donor1, sibling gets Mom+Donor2', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [
          { name: 'Mom', nameKnown: true, edgeType: 'biological' },
          { name: 'Donor 1', nameKnown: true, edgeType: 'donor' },
          { name: 'Donor 2', nameKnown: true, edgeType: 'donor' },
        ],
        egoParentIndices: [0, 1], // Mom + Donor 1 only
        parentPartnerships: [],
        siblings: [
          { name: 'Half Sib', sharedParentIndices: [0, 2] }, // Mom + Donor 2
        ],
      }),
    );

    const { nodes, edges } = store.getState().network;
    // ego + 3 parents + 1 sibling = 5
    expect(nodes.size).toBe(5);

    const egoEntry = [...nodes.entries()].find(([, n]) => n.isEgo)!;
    const egoId = egoEntry[0];

    // Ego should have edges from Mom (biological) and Donor 1 (donor) only
    const egoParentEdges = [...edges.values()].filter(
      (e) => e.target === egoId && e.relationshipType !== 'partner',
    );
    expect(egoParentEdges).toHaveLength(2);

    const egoEdgeTypes = egoParentEdges.map((e) => e.relationshipType).sort();
    expect(egoEdgeTypes).toEqual(['biological', 'donor']);

    // Ego should NOT have an edge from Donor 2
    const donor2Entry = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Donor 2',
    )!;
    const donor2ToEgo = [...edges.values()].find(
      (e) => e.source === donor2Entry[0] && e.target === egoId,
    );
    expect(donor2ToEgo).toBeUndefined();

    // Sibling should have edges from Mom (biological) and Donor 2 (donor)
    const sibEntry = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Half Sib',
    )!;
    const sibParentEdges = [...edges.values()].filter(
      (e) => e.target === sibEntry[0] && e.relationshipType !== 'partner',
    );
    expect(sibParentEdges).toHaveLength(2);

    const sibEdgeTypes = sibParentEdges.map((e) => e.relationshipType).sort();
    expect(sibEdgeTypes).toEqual(['biological', 'donor']);

    // Sibling should NOT have an edge from Donor 1
    const donor1Entry = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Donor 1',
    )!;
    const donor1ToSib = [...edges.values()].find(
      (e) => e.source === donor1Entry[0] && e.target === sibEntry[0],
    );
    expect(donor1ToSib).toBeUndefined();
  });

  it('creates half-sibling other parent with parent edge and former partner edge', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [
          { name: 'Mom', nameKnown: true, edgeType: 'biological' },
          { name: 'Dad', nameKnown: true, edgeType: 'biological' },
        ],
        parentPartnerships: [{ parentIndices: [0, 1], isActive: true }],
        siblings: [{ name: 'HalfSib', sharedParentIndices: [0] }],
        halfSiblingOtherParents: [
          {
            name: 'OtherDad',
            nameKnown: true,
            siblingIndex: 0,
            sharedParentIndices: [0],
          },
        ],
      }),
    );

    const { nodes, edges } = store.getState().network;
    // ego + 2 parents + 1 sibling + 1 other parent = 5
    expect(nodes.size).toBe(5);

    const otherDad = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'OtherDad',
    )!;
    const halfSib = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'HalfSib',
    )!;
    const mom = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Mom',
    )!;

    // OtherDad -> HalfSib parent edge
    const parentEdge = [...edges.values()].find(
      (e) =>
        e.source === otherDad[0] &&
        e.target === halfSib[0] &&
        e.relationshipType === 'biological',
    );
    expect(parentEdge).toBeDefined();

    // OtherDad <-> Mom former partner edge
    const partnerEdge = [...edges.values()].find(
      (e) =>
        e.relationshipType === 'partner' &&
        ((e.source === otherDad[0] && e.target === mom[0]) ||
          (e.source === mom[0] && e.target === otherDad[0])) &&
        e.isActive === false,
    );
    expect(partnerEdge).toBeDefined();
  });

  it('creates sibling partner and niblings', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        parents: [
          { name: 'Mom', nameKnown: true, edgeType: 'biological' },
          { name: 'Dad', nameKnown: true, edgeType: 'biological' },
        ],
        parentPartnerships: [{ parentIndices: [0, 1], isActive: true }],
        siblings: [{ name: 'Bro', sharedParentIndices: [0, 1] }],
        siblingFamilies: [
          {
            siblingIndex: 0,
            hasPartner: true,
            partner: { name: 'SisterInLaw' },
            children: [{ name: 'Niece' }],
          },
        ],
      }),
    );

    const { nodes, edges } = store.getState().network;
    // ego + 2 parents + bro + sister-in-law + niece = 6
    expect(nodes.size).toBe(6);

    const niece = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Niece',
    )!;
    const bro = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Bro',
    )!;
    const sil = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'SisterInLaw',
    )!;

    // Niece has 2 parent edges
    const nieceParentEdges = [...edges.values()].filter(
      (e) => e.target === niece[0] && e.relationshipType !== 'partner',
    );
    expect(nieceParentEdges).toHaveLength(2);

    // Bro <-> SisterInLaw partner edge
    const partnerEdge = [...edges.values()].find(
      (e) =>
        e.relationshipType === 'partner' &&
        ((e.source === bro[0] && e.target === sil[0]) ||
          (e.source === sil[0] && e.target === bro[0])),
    );
    expect(partnerEdge).toBeDefined();
  });

  it('creates niblings without partner (single parent sibling)', () => {
    const store = createFamilyPedigreeStore(new Map(), new Map(), testConfig);
    store.getState().generateQuickStartNetwork(
      quickStart({
        siblings: [{ name: 'Sis', sharedParentIndices: [] }],
        siblingFamilies: [
          {
            siblingIndex: 0,
            hasPartner: false,
            children: [{ name: 'Nephew' }],
          },
        ],
      }),
    );

    const { nodes, edges } = store.getState().network;
    // ego + sis + nephew = 3
    expect(nodes.size).toBe(3);

    const nephew = [...nodes.entries()].find(
      ([, n]) => n.attributes[testConfig.nodeLabelVariable] === 'Nephew',
    )!;

    const nephewParentEdges = [...edges.values()].filter(
      (e) => e.target === nephew[0] && e.relationshipType !== 'partner',
    );
    expect(nephewParentEdges).toHaveLength(1);
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
    store.getState().addNode({
      isEgo: true,
      attributes: { [testConfig.nodeLabelVariable]: 'Ego' },
    });
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

    const donorId = store.getState().addNode({
      isEgo: false,
      attributes: { [testConfig.nodeLabelVariable]: '' },
    });
    store.getState().addEdge({
      source: donorId,
      target: egoId,
      relationshipType: 'donor',
      isActive: true,
    });
    expect(store.getState().network.nodes.size).toBe(4);

    store.getState().updateNode(donorId, {
      attributes: { [testConfig.nodeLabelVariable]: 'Sperm Donor' },
    });
    expect(
      store.getState().network.nodes.get(donorId)?.attributes[
        testConfig.nodeLabelVariable
      ],
    ).toBe('Sperm Donor');

    store.getState().syncMetadata();
    expect(dispatched.length).toBe(1);
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { type FamilyTreeNodeType } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import {
  createFamilyTreeStore,
  type Edge,
  type FamilyTreeStoreApi,
} from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';

/**
 * Test Suite: store.test.ts
 *
 * Tests for store actions related to additional partners and half-siblings.
 */

type NodeData = Omit<FamilyTreeNodeType, 'id'>;
type EdgeData = Omit<Edge, 'id'>;

describe('addPlaceholderNode - additional partner creation', () => {
  let store: FamilyTreeStoreApi;

  beforeEach(() => {
    store = createFamilyTreeStore(new Map(), new Map());
  });

  test('creates additional partner with correct edge when relation is additionalPartner', () => {
    /**
     * Users should be able to create additional partners for family members.
     * When 'additionalPartner' relation is passed with an anchorId, it should:
     * 1. Create a new node for the partner
     * 2. Create a 'partner' edge between them
     */

    // Setup: Create a father node
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });

    // Act: Add additional partner for father
    const partnerId = store
      .getState()
      .addPlaceholderNode('additionalPartner', fatherId);

    // Assert: Partner was created with partner edge
    const edges = store.getState().network.edges;
    const partnerEdge = Array.from(edges.values()).find(
      (e) =>
        e.relationship === 'partner' &&
        (e.source === fatherId || e.target === fatherId),
    );

    expect(partnerId).toBeDefined();
    expect(partnerEdge).toBeDefined();
    expect(partnerEdge?.relationship).toBe('partner');
  });

  test('additional partner has opposite sex to anchor node (male anchor)', () => {
    // Male parent should get female partner
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });

    store.getState().addPlaceholderNode('additionalPartner', fatherId);

    // Find the partner node (not the father)
    const nodes = store.getState().network.nodes;
    const partnerNode = Array.from(nodes.entries()).find(
      ([id]) => id !== fatherId,
    )?.[1];

    expect(partnerNode?.sex).toBe('female');
  });

  test('additional partner has opposite sex to anchor node (female anchor)', () => {
    // Female parent should get male partner
    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });

    store.getState().addPlaceholderNode('additionalPartner', motherId);

    const nodes = store.getState().network.nodes;
    const partnerNode = Array.from(nodes.entries()).find(
      ([id]) => id !== motherId,
    )?.[1];

    expect(partnerNode?.sex).toBe('male');
  });

  test('additional partner label includes anchor name and partner', () => {
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });

    store.getState().addPlaceholderNode('additionalPartner', fatherId);

    const nodes = store.getState().network.nodes;
    const partnerNode = Array.from(nodes.entries()).find(
      ([id]) => id !== fatherId,
    )?.[1];

    expect(partnerNode?.label).toContain('partner');
  });

  test('additional partner requires anchorId', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Try to create additional partner without anchor
    store.getState().addPlaceholderNode('additionalPartner');

    // Should warn about missing anchorId
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('anchorId'));

    warnSpy.mockRestore();
  });

  test('edge direction follows sex convention (male source, female target)', () => {
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });

    store.getState().addPlaceholderNode('additionalPartner', fatherId);

    const edges = store.getState().network.edges;
    // Find the edge that includes father
    const partnerEdges = Array.from(edges.values()).filter(
      (e) =>
        e.relationship === 'partner' &&
        (e.source === fatherId || e.target === fatherId),
    );
    // Find the edge where father is source (added by additionalPartner, not primary partner)
    const partnerEdge = partnerEdges.find(
      (e) => e.source === fatherId || e.target === fatherId,
    );

    // Convention: male is source, female is target
    // Father is male, so father should be the source
    expect(partnerEdge?.source).toBe(fatherId);
  });
});

describe('addPlaceholderNode - half-sibling behavior with multiple partners', () => {
  let store: FamilyTreeStoreApi;

  beforeEach(() => {
    store = createFamilyTreeStore(new Map(), new Map());
  });

  test('half-sibling connects only to parent when no additional partner exists', () => {
    /**
     * If somehow a half-sibling is created without an additional partner,
     * it should connect only to the specified parent.
     * (Note: UI prevents this scenario via conditional options)
     */

    // Setup: Create basic family without additional partner
    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });
    const egoId = store.getState().addNode({
      label: 'ego',
      sex: 'male',
      isEgo: true,
      readOnly: false,
    });

    store.getState().addEdge({
      source: motherId,
      target: egoId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: fatherId,
      target: egoId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: fatherId,
      target: motherId,
      relationship: 'partner',
    });

    // Act: Add half-sibling (mother has no additional partner)
    const halfSibId = store
      .getState()
      .addPlaceholderNode('halfSister', motherId);

    // Assert: Half-sibling connected only to mother (no additional partner to connect to)
    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === halfSibId,
    );

    expect(parentEdges.length).toBe(1);
    expect(parentEdges[0]?.source).toBe(motherId);
  });

  test('half-sibling creation succeeds with existing additional partner', () => {
    /**
     * When an additional partner already exists for a parent, half-sibling creation
     * should succeed and connect to both the parent and their additional partner.
     */

    // Setup: mother with additional partner
    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });
    const additionalPartnerId = store.getState().addNode({
      label: "mother's partner",
      sex: 'male',
      readOnly: false,
    });

    // Primary partner edge
    store.getState().addEdge({
      source: fatherId,
      target: motherId,
      relationship: 'partner',
    });
    // Additional partner edge
    store.getState().addEdge({
      source: additionalPartnerId,
      target: motherId,
      relationship: 'partner',
    });

    // Also need ego for the store to work properly
    const egoId = store.getState().addNode({
      label: 'ego',
      sex: 'male',
      isEgo: true,
      readOnly: false,
    });
    store.getState().addEdge({
      source: motherId,
      target: egoId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: fatherId,
      target: egoId,
      relationship: 'parent',
    });

    // Act: Add half-sibling with explicit secondParentId
    const halfSibId = store
      .getState()
      .addPlaceholderNode('halfSister', motherId, additionalPartnerId);

    // Assert: Half-sibling connected to both mother and additional partner
    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === halfSibId,
    );

    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === motherId)).toBe(true);
    expect(parentEdges.some((e) => e.source === additionalPartnerId)).toBe(
      true,
    );
  });

  test('half-sibling uses correct additional partner when multiple exist', () => {
    /**
     * If a parent has multiple additional partners, the half-sibling
     * should be connected to the specified one via secondParentId.
     */

    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });
    const partner1Id = store.getState().addNode({
      label: 'partner1',
      sex: 'male',
      readOnly: false,
    });
    const partner2Id = store.getState().addNode({
      label: 'partner2',
      sex: 'male',
      readOnly: false,
    });

    // Primary partner edge (father)
    store.getState().addEdge({
      source: fatherId,
      target: motherId,
      relationship: 'partner',
    });
    // Additional partner edges
    store.getState().addEdge({
      source: partner1Id,
      target: motherId,
      relationship: 'partner',
    });
    store.getState().addEdge({
      source: partner2Id,
      target: motherId,
      relationship: 'partner',
    });

    const egoId = store.getState().addNode({
      label: 'ego',
      sex: 'male',
      isEgo: true,
      readOnly: false,
    });
    store.getState().addEdge({
      source: motherId,
      target: egoId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: fatherId,
      target: egoId,
      relationship: 'parent',
    });

    // Specify partner2 as second parent
    const halfSibId = store
      .getState()
      .addPlaceholderNode('halfBrother', motherId, partner2Id);

    // Should use partner2
    const edges = store.getState().network.edges;
    const halfSibParentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === halfSibId,
    );

    expect(halfSibParentEdges.length).toBe(2);
    expect(halfSibParentEdges.some((e) => e.source === motherId)).toBe(true);
    expect(halfSibParentEdges.some((e) => e.source === partner2Id)).toBe(true);
  });

  test('does not create duplicate partner edges', () => {
    /**
     * When creating a half-sibling with existing additional partner,
     * no new partner edges should be created.
     */

    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });
    const additionalPartnerId = store.getState().addNode({
      label: "mother's partner",
      sex: 'male',
      readOnly: false,
    });

    store.getState().addEdge({
      source: fatherId,
      target: motherId,
      relationship: 'partner',
    });
    store.getState().addEdge({
      source: additionalPartnerId,
      target: motherId,
      relationship: 'partner',
    });

    const egoId = store.getState().addNode({
      label: 'ego',
      sex: 'male',
      isEgo: true,
      readOnly: false,
    });
    store.getState().addEdge({
      source: motherId,
      target: egoId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: fatherId,
      target: egoId,
      relationship: 'parent',
    });

    const partnerEdgesBefore = Array.from(
      store.getState().network.edges.values(),
    ).filter((e) => e.relationship === 'partner');

    store
      .getState()
      .addPlaceholderNode('halfSister', motherId, additionalPartnerId);

    const partnerEdgesAfter = Array.from(
      store.getState().network.edges.values(),
    ).filter((e) => e.relationship === 'partner');

    // Should still have same number of partner edges
    expect(partnerEdgesAfter.length).toBe(partnerEdgesBefore.length);
  });
});

describe('addPlaceholderNode - existing behavior preservation', () => {
  let store: FamilyTreeStoreApi;

  beforeEach(() => {
    store = createFamilyTreeStore(new Map(), new Map());

    // Setup basic family tree
    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });
    const egoId = store.getState().addNode({
      label: 'ego',
      sex: 'male',
      isEgo: true,
      readOnly: false,
    });

    store.getState().addEdge({
      source: motherId,
      target: egoId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: fatherId,
      target: egoId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: fatherId,
      target: motherId,
      relationship: 'partner',
    });
  });

  test('full sibling connects to both parents', () => {
    store.getState().addPlaceholderNode('brother');

    const nodes = store.getState().network.nodes;
    const brotherEntry = Array.from(nodes.entries()).find(
      ([, n]) => n.label === 'brother',
    );

    expect(brotherEntry).toBeDefined();
    const brotherId = brotherEntry![0];

    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === brotherId,
    );

    expect(parentEdges.length).toBe(2);
  });

  test('son/daughter creates partner for ego if needed', () => {
    store.getState().addPlaceholderNode('daughter');

    const nodes = store.getState().network.nodes;
    const hasEgoPartner = Array.from(nodes.values()).some(
      (n) => n.label === 'Your partner',
    );

    expect(hasEgoPartner).toBe(true);
  });

  test('niece/nephew connects to sibling and their partner', () => {
    // First add a sibling
    store.getState().addPlaceholderNode('sister');

    // Get fresh state after adding sister
    let nodes = store.getState().network.nodes;
    const sisterEntry = Array.from(nodes.entries()).find(
      ([, n]) => n.label === 'sister',
    );
    const sisterId = sisterEntry![0];

    // Add niece with sister as anchor
    store.getState().addPlaceholderNode('niece', sisterId);

    // Get fresh state after adding niece (immer creates new objects)
    nodes = store.getState().network.nodes;
    const nieceEntry = Array.from(nodes.entries()).find(
      ([, n]) => n.label === 'niece',
    );
    expect(nieceEntry).toBeDefined();

    const edges = store.getState().network.edges;
    const nieceParentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === nieceEntry![0],
    );

    // Niece should have 2 parents (sister + sister's partner)
    expect(nieceParentEdges.length).toBe(2);
    expect(nieceParentEdges.some((e) => e.source === sisterId)).toBe(true);
  });
});

describe('generatePlaceholderNetwork - additional partners', () => {
  let store: FamilyTreeStoreApi;

  beforeEach(() => {
    const egoId = crypto.randomUUID();
    const initialNodes = new Map<string, NodeData>([
      [egoId, { label: 'ego', sex: 'male', isEgo: true, readOnly: false }],
    ]);
    store = createFamilyTreeStore(initialNodes, new Map());
    // Initialize minimal network first (grandparents, parents, ego connections)
    store.getState().initializeMinimalNetwork();
  });

  test('creates additional partners for father when specified', () => {
    store.getState().generatePlaceholderNetwork(
      {
        brothers: 0,
        sisters: 0,
        sons: 0,
        daughters: 0,
        'maternal-uncles': 0,
        'maternal-aunts': 0,
        'paternal-uncles': 0,
        'paternal-aunts': 0,
        'fathers-additional-partners': 2,
        'mothers-additional-partners': 0,
      },
      'male',
    );

    const nodes = store.getState().network.nodes;
    const edges = store.getState().network.edges;

    // Find father
    const fatherEntry = Array.from(nodes.entries()).find(
      ([, n]) => n.label === 'father',
    );
    expect(fatherEntry).toBeDefined();
    const fatherId = fatherEntry![0];

    // Count partner edges for father
    const fatherPartnerEdges = Array.from(edges.values()).filter(
      (e) =>
        e.relationship === 'partner' &&
        (e.source === fatherId || e.target === fatherId),
    );

    // Should have 3 partners: mother + 2 additional partners
    expect(fatherPartnerEdges.length).toBe(3);
  });

  test('creates additional partners for mother when specified', () => {
    store.getState().generatePlaceholderNetwork(
      {
        brothers: 0,
        sisters: 0,
        sons: 0,
        daughters: 0,
        'maternal-uncles': 0,
        'maternal-aunts': 0,
        'paternal-uncles': 0,
        'paternal-aunts': 0,
        'fathers-additional-partners': 0,
        'mothers-additional-partners': 1,
      },
      'female',
    );

    const nodes = store.getState().network.nodes;
    const edges = store.getState().network.edges;

    // Find mother
    const motherEntry = Array.from(nodes.entries()).find(
      ([, n]) => n.label === 'mother',
    );
    expect(motherEntry).toBeDefined();
    const motherId = motherEntry![0];

    // Count partner edges for mother
    const motherPartnerEdges = Array.from(edges.values()).filter(
      (e) =>
        e.relationship === 'partner' &&
        (e.source === motherId || e.target === motherId),
    );

    // Should have 2 partners: father + 1 additional partner
    expect(motherPartnerEdges.length).toBe(2);
  });

  test('additional partners have correct labels', () => {
    store.getState().generatePlaceholderNetwork(
      {
        brothers: 0,
        sisters: 0,
        sons: 0,
        daughters: 0,
        'maternal-uncles': 0,
        'maternal-aunts': 0,
        'paternal-uncles': 0,
        'paternal-aunts': 0,
        'fathers-additional-partners': 1,
        'mothers-additional-partners': 0,
      },
      'male',
    );

    const nodes = store.getState().network.nodes;

    // Find father's additional partner
    const additionalPartner = Array.from(nodes.values()).find((n) =>
      n.label.includes("father's partner"),
    );
    expect(additionalPartner).toBeDefined();
    expect(additionalPartner?.sex).toBe('female');
  });
});

describe('addPlaceholderNode - half-aunt/uncle creation', () => {
  let store: FamilyTreeStoreApi;
  let maternalGrandmotherId: string;
  let maternalGrandfatherId: string;
  let additionalGrandparentPartnerId: string;

  beforeEach(() => {
    store = createFamilyTreeStore(new Map(), new Map());

    // Create grandparents
    maternalGrandmotherId = store.getState().addNode({
      label: 'maternal grandmother',
      sex: 'female',
      readOnly: false,
    });
    maternalGrandfatherId = store.getState().addNode({
      label: 'maternal grandfather',
      sex: 'male',
      readOnly: false,
    });

    // Primary grandparent partner edge
    store.getState().addEdge({
      source: maternalGrandfatherId,
      target: maternalGrandmotherId,
      relationship: 'partner',
    });

    // Add an additional partner for grandmother
    additionalGrandparentPartnerId = store.getState().addNode({
      label: "grandmother's other partner",
      sex: 'male',
      readOnly: false,
    });
    store.getState().addEdge({
      source: additionalGrandparentPartnerId,
      target: maternalGrandmotherId,
      relationship: 'partner',
    });

    // Create mother
    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    store.getState().addEdge({
      source: maternalGrandfatherId,
      target: motherId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: maternalGrandmotherId,
      target: motherId,
      relationship: 'parent',
    });

    // Create ego
    const egoId = store.getState().addNode({
      label: 'ego',
      sex: 'male',
      isEgo: true,
      readOnly: false,
    });
    store.getState().addEdge({
      source: motherId,
      target: egoId,
      relationship: 'parent',
    });
  });

  test('half-aunt connects to grandparent and additional partner', () => {
    const halfAuntId = store
      .getState()
      .addPlaceholderNode(
        'halfAunt',
        maternalGrandmotherId,
        additionalGrandparentPartnerId,
      );

    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === halfAuntId,
    );

    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === maternalGrandmotherId)).toBe(
      true,
    );
    expect(
      parentEdges.some((e) => e.source === additionalGrandparentPartnerId),
    ).toBe(true);
  });

  test('half-uncle connects to grandparent and additional partner', () => {
    const halfUncleId = store
      .getState()
      .addPlaceholderNode(
        'halfUncle',
        maternalGrandmotherId,
        additionalGrandparentPartnerId,
      );

    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === halfUncleId,
    );

    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === maternalGrandmotherId)).toBe(
      true,
    );
    expect(
      parentEdges.some((e) => e.source === additionalGrandparentPartnerId),
    ).toBe(true);
  });

  test('half-aunt has correct sex', () => {
    const halfAuntId = store
      .getState()
      .addPlaceholderNode(
        'halfAunt',
        maternalGrandmotherId,
        additionalGrandparentPartnerId,
      );

    const halfAunt = store.getState().network.nodes.get(halfAuntId);
    expect(halfAunt?.sex).toBe('female');
  });

  test('half-uncle has correct sex', () => {
    const halfUncleId = store
      .getState()
      .addPlaceholderNode(
        'halfUncle',
        maternalGrandmotherId,
        additionalGrandparentPartnerId,
      );

    const halfUncle = store.getState().network.nodes.get(halfUncleId);
    expect(halfUncle?.sex).toBe('male');
  });
});

describe('store initialization', () => {
  test('creates store with empty network', () => {
    const store = createFamilyTreeStore(new Map(), new Map());

    expect(store.getState().network.nodes.size).toBe(0);
    expect(store.getState().network.edges.size).toBe(0);
  });

  test('creates store with initial nodes and edges', () => {
    const initialNodes = new Map<string, NodeData>([
      ['n1', { label: 'test', sex: 'male', readOnly: false }],
    ]);
    const initialEdges = new Map<string, EdgeData>([
      ['e1', { source: 'n1', target: 'n2', relationship: 'partner' }],
    ]);

    const store = createFamilyTreeStore(initialNodes, initialEdges);

    expect(store.getState().network.nodes.size).toBe(1);
    expect(store.getState().network.edges.size).toBe(1);
  });
});

describe('addPlaceholderNode - secondParentId support', () => {
  let store: FamilyTreeStoreApi;

  beforeEach(() => {
    store = createFamilyTreeStore(new Map(), new Map());
  });

  test('half-sibling uses explicit secondParentId instead of first additional partner', () => {
    /**
     * When secondParentId is provided, the half-sibling should be connected
     * to that specific partner, not just the first one found.
     */
    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });
    const partner1Id = store.getState().addNode({
      label: 'partner1',
      sex: 'male',
      readOnly: false,
    });
    const partner2Id = store.getState().addNode({
      label: 'partner2',
      sex: 'male',
      readOnly: false,
    });

    // Add partner edges
    store.getState().addEdge({
      source: fatherId,
      target: motherId,
      relationship: 'partner',
    });
    store.getState().addEdge({
      source: partner1Id,
      target: motherId,
      relationship: 'partner',
    });
    store.getState().addEdge({
      source: partner2Id,
      target: motherId,
      relationship: 'partner',
    });

    const egoId = store.getState().addNode({
      label: 'ego',
      sex: 'male',
      isEgo: true,
      readOnly: false,
    });
    store.getState().addEdge({
      source: motherId,
      target: egoId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: fatherId,
      target: egoId,
      relationship: 'parent',
    });

    // Explicitly specify partner2 as second parent
    const halfSibId = store
      .getState()
      .addPlaceholderNode('halfSister', motherId, partner2Id);

    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === halfSibId,
    );

    // Should be connected to mother + partner2 (not partner1)
    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === motherId)).toBe(true);
    expect(parentEdges.some((e) => e.source === partner2Id)).toBe(true);
    expect(parentEdges.some((e) => e.source === partner1Id)).toBe(false);
  });

  test('niece uses explicit secondParentId instead of auto-created partner', () => {
    /**
     * When secondParentId is provided for niece/nephew, it should use
     * that specific partner instead of auto-creating one.
     */
    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });
    const egoId = store.getState().addNode({
      label: 'ego',
      sex: 'male',
      isEgo: true,
      readOnly: false,
    });

    store.getState().addEdge({
      source: motherId,
      target: egoId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: fatherId,
      target: egoId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: fatherId,
      target: motherId,
      relationship: 'partner',
    });

    // Add a sister
    const sisterId = store.getState().addNode({
      label: 'sister',
      sex: 'female',
      readOnly: false,
    });
    store.getState().addEdge({
      source: motherId,
      target: sisterId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: fatherId,
      target: sisterId,
      relationship: 'parent',
    });

    // Sister has two partners
    const sistersPartnerId = store.getState().addNode({
      label: "sister's partner",
      sex: 'male',
      readOnly: false,
    });
    const sistersOtherPartnerId = store.getState().addNode({
      label: "sister's other partner",
      sex: 'male',
      readOnly: false,
    });
    store.getState().addEdge({
      source: sistersPartnerId,
      target: sisterId,
      relationship: 'partner',
    });
    store.getState().addEdge({
      source: sistersOtherPartnerId,
      target: sisterId,
      relationship: 'partner',
    });

    // Add niece with explicit secondParentId = sister's other partner
    const nieceId = store
      .getState()
      .addPlaceholderNode('niece', sisterId, sistersOtherPartnerId);

    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === nieceId,
    );

    // Niece should be connected to sister + sister's other partner (not sister's partner)
    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === sisterId)).toBe(true);
    expect(parentEdges.some((e) => e.source === sistersOtherPartnerId)).toBe(
      true,
    );
    expect(parentEdges.some((e) => e.source === sistersPartnerId)).toBe(false);
  });

  test('cousin uses explicit secondParentId', () => {
    /**
     * When secondParentId is provided for cousin, it should use
     * that specific partner for the aunt/uncle.
     */
    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const maternalGrandmotherId = store.getState().addNode({
      label: 'maternal grandmother',
      sex: 'female',
      readOnly: false,
    });
    const maternalGrandfatherId = store.getState().addNode({
      label: 'maternal grandfather',
      sex: 'male',
      readOnly: false,
    });

    store.getState().addEdge({
      source: maternalGrandfatherId,
      target: maternalGrandmotherId,
      relationship: 'partner',
    });
    store.getState().addEdge({
      source: maternalGrandmotherId,
      target: motherId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: maternalGrandfatherId,
      target: motherId,
      relationship: 'parent',
    });

    const egoId = store.getState().addNode({
      label: 'ego',
      sex: 'male',
      isEgo: true,
      readOnly: false,
    });
    store.getState().addEdge({
      source: motherId,
      target: egoId,
      relationship: 'parent',
    });

    // Add maternal aunt
    const auntId = store.getState().addNode({
      label: 'maternal aunt',
      sex: 'female',
      readOnly: false,
    });
    store.getState().addEdge({
      source: maternalGrandmotherId,
      target: auntId,
      relationship: 'parent',
    });
    store.getState().addEdge({
      source: maternalGrandfatherId,
      target: auntId,
      relationship: 'parent',
    });

    // Aunt has two partners
    const auntsPartnerId = store.getState().addNode({
      label: "aunt's partner",
      sex: 'male',
      readOnly: false,
    });
    const auntsOtherPartnerId = store.getState().addNode({
      label: "aunt's other partner",
      sex: 'male',
      readOnly: false,
    });
    store.getState().addEdge({
      source: auntsPartnerId,
      target: auntId,
      relationship: 'partner',
    });
    store.getState().addEdge({
      source: auntsOtherPartnerId,
      target: auntId,
      relationship: 'partner',
    });

    // Add cousin with explicit secondParentId = aunt's other partner
    const cousinId = store
      .getState()
      .addPlaceholderNode('firstCousinMale', auntId, auntsOtherPartnerId);

    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === cousinId,
    );

    // Cousin should be connected to aunt + aunt's other partner
    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === auntId)).toBe(true);
    expect(parentEdges.some((e) => e.source === auntsOtherPartnerId)).toBe(
      true,
    );
    expect(parentEdges.some((e) => e.source === auntsPartnerId)).toBe(false);
  });

  test('grandchild uses explicit secondParentId', () => {
    /**
     * When secondParentId is provided for grandchild, it should use
     * that specific partner for ego's child.
     */
    const egoId = store.getState().addNode({
      label: 'ego',
      sex: 'male',
      isEgo: true,
      readOnly: false,
    });

    // Ego's daughter
    const daughterId = store.getState().addNode({
      label: 'daughter',
      sex: 'female',
      readOnly: false,
    });
    store.getState().addEdge({
      source: egoId,
      target: daughterId,
      relationship: 'parent',
    });

    // Daughter has two partners
    const daughtersPartnerId = store.getState().addNode({
      label: "daughter's partner",
      sex: 'male',
      readOnly: false,
    });
    const daughtersOtherPartnerId = store.getState().addNode({
      label: "daughter's other partner",
      sex: 'male',
      readOnly: false,
    });
    store.getState().addEdge({
      source: daughtersPartnerId,
      target: daughterId,
      relationship: 'partner',
    });
    store.getState().addEdge({
      source: daughtersOtherPartnerId,
      target: daughterId,
      relationship: 'partner',
    });

    // Add grandchild with explicit secondParentId = daughter's other partner
    const grandchildId = store
      .getState()
      .addPlaceholderNode('grandson', daughterId, daughtersOtherPartnerId);

    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === grandchildId,
    );

    // Grandchild should be connected to daughter + daughter's other partner
    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === daughterId)).toBe(true);
    expect(parentEdges.some((e) => e.source === daughtersOtherPartnerId)).toBe(
      true,
    );
    expect(parentEdges.some((e) => e.source === daughtersPartnerId)).toBe(
      false,
    );
  });
});

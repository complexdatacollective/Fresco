import { beforeEach, describe, expect, test, vi } from 'vitest';
import { type FamilyTreeNodeType } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import {
  createFamilyTreeStore,
  type Edge,
  type FamilyTreeStoreApi,
} from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';

/**
 * Test Suite 3: store.test.ts
 *
 * Tests for store actions related to ex-partners and half-siblings.
 * These tests are written to fail initially, demonstrating TDD approach.
 */

type NodeData = Omit<FamilyTreeNodeType, 'id'>;
type EdgeData = Omit<Edge, 'id'>;

describe('addPlaceholderNode - ex-partner creation (Issue 1)', () => {
  let store: FamilyTreeStoreApi;

  beforeEach(() => {
    store = createFamilyTreeStore(new Map(), new Map());
  });

  test('creates ex-partner with correct edge when relation is exPartner', () => {
    /**
     * Users should be able to create ex-partners for family members.
     * When 'exPartner' relation is passed with an anchorId, it should:
     * 1. Create a new node for the ex-partner
     * 2. Create an 'ex-partner' edge between them
     */

    // Setup: Create a father node
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });

    // Act: Add ex-partner for father
    const exPartnerId = store.getState().addPlaceholderNode('exPartner', fatherId);

    // Assert: Ex-partner was created with ex-partner edge
    const edges = store.getState().network.edges;
    const exPartnerEdge = Array.from(edges.values()).find(
      (e) =>
        e.relationship === 'ex-partner' &&
        (e.source === fatherId || e.target === fatherId),
    );

    expect(exPartnerId).toBeDefined();
    expect(exPartnerEdge).toBeDefined();
    expect(exPartnerEdge?.relationship).toBe('ex-partner');
  });

  test('ex-partner has opposite sex to anchor node (male anchor)', () => {
    // Male parent should get female ex-partner
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });

    store.getState().addPlaceholderNode('exPartner', fatherId);

    // Find the ex-partner node (not the father)
    const nodes = store.getState().network.nodes;
    const exPartnerNode = Array.from(nodes.entries()).find(
      ([id]) => id !== fatherId,
    )?.[1];

    expect(exPartnerNode?.sex).toBe('female');
  });

  test('ex-partner has opposite sex to anchor node (female anchor)', () => {
    // Female parent should get male ex-partner
    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });

    store.getState().addPlaceholderNode('exPartner', motherId);

    const nodes = store.getState().network.nodes;
    const exPartnerNode = Array.from(nodes.entries()).find(
      ([id]) => id !== motherId,
    )?.[1];

    expect(exPartnerNode?.sex).toBe('male');
  });

  test('ex-partner label includes anchor name', () => {
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });

    store.getState().addPlaceholderNode('exPartner', fatherId);

    const nodes = store.getState().network.nodes;
    const exPartnerNode = Array.from(nodes.entries()).find(
      ([id]) => id !== fatherId,
    )?.[1];

    expect(exPartnerNode?.label).toContain('ex');
  });

  test('ex-partner requires anchorId', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Try to create ex-partner without anchor
    store.getState().addPlaceholderNode('exPartner');

    // Should warn about missing anchorId
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('anchorId'),
    );

    warnSpy.mockRestore();
  });

  test('edge direction follows sex convention (male source, female target)', () => {
    const fatherId = store.getState().addNode({
      label: 'father',
      sex: 'male',
      readOnly: false,
    });

    store.getState().addPlaceholderNode('exPartner', fatherId);

    const edges = store.getState().network.edges;
    const exPartnerEdge = Array.from(edges.values()).find(
      (e) => e.relationship === 'ex-partner',
    );

    // Convention: male is source, female is target
    // Father is male, so father should be the source
    expect(exPartnerEdge?.source).toBe(fatherId);
  });
});

describe('addPlaceholderNode - half-sibling behavior (Issue 2)', () => {
  let store: FamilyTreeStoreApi;

  beforeEach(() => {
    store = createFamilyTreeStore(new Map(), new Map());
  });

  test('half-sibling connects only to parent when no ex-partner exists', () => {
    /**
     * If somehow a half-sibling is created without an ex-partner,
     * it should connect only to the specified parent.
     * (Note: UI prevents this scenario via conditional options)
     */

    // Setup: Create basic family without ex-partner
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

    // Act: Add half-sibling (mother has no ex-partner)
    const halfSibId = store.getState().addPlaceholderNode('halfSister', motherId);

    // Assert: Half-sibling connected only to mother (no ex-partner to connect to)
    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === halfSibId,
    );

    expect(parentEdges.length).toBe(1);
    expect(parentEdges[0]?.source).toBe(motherId);

    // Verify no ex-partner edge was auto-created
    const exPartnerEdge = Array.from(edges.values()).find(
      (e) => e.relationship === 'ex-partner',
    );
    expect(exPartnerEdge).toBeUndefined();
  });

  test('half-sibling creation succeeds with existing ex-partner', () => {
    /**
     * When an ex-partner already exists for a parent, half-sibling creation
     * should succeed and connect to both the parent and their ex-partner.
     */

    // Setup: mother with ex-partner
    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const exPartnerId = store.getState().addNode({
      label: 'ex',
      sex: 'male',
      readOnly: false,
    });
    store.getState().addEdge({
      source: exPartnerId,
      target: motherId,
      relationship: 'ex-partner',
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

    // Act: Add half-sibling
    const halfSibId = store.getState().addPlaceholderNode('halfSister', motherId);

    // Assert: Half-sibling connected to both mother and ex-partner
    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === halfSibId,
    );

    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === motherId)).toBe(true);
    expect(parentEdges.some((e) => e.source === exPartnerId)).toBe(true);
  });

  test('half-sibling uses correct ex-partner when multiple exist', () => {
    /**
     * If a parent has multiple ex-partners (edge case), the half-sibling
     * should be connected to the first one found.
     */

    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const exPartner1Id = store.getState().addNode({
      label: 'ex1',
      sex: 'male',
      readOnly: false,
    });
    const exPartner2Id = store.getState().addNode({
      label: 'ex2',
      sex: 'male',
      readOnly: false,
    });

    store.getState().addEdge({
      source: exPartner1Id,
      target: motherId,
      relationship: 'ex-partner',
    });
    store.getState().addEdge({
      source: exPartner2Id,
      target: motherId,
      relationship: 'ex-partner',
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

    store.getState().addPlaceholderNode('halfBrother', motherId);

    // Should use one of the ex-partners (first found)
    const edges = store.getState().network.edges;
    const halfSibParentEdges = Array.from(edges.values()).filter(
      (e) =>
        e.relationship === 'parent' &&
        (e.source === exPartner1Id || e.source === exPartner2Id),
    );

    expect(halfSibParentEdges.length).toBe(1);
  });

  test('does not create duplicate ex-partner edges', () => {
    /**
     * When creating a half-sibling with existing ex-partner,
     * no new ex-partner edges should be created.
     */

    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const exPartnerId = store.getState().addNode({
      label: 'ex',
      sex: 'male',
      readOnly: false,
    });

    store.getState().addEdge({
      source: exPartnerId,
      target: motherId,
      relationship: 'ex-partner',
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

    const edgesBeforeCount = store.getState().network.edges.size;

    store.getState().addPlaceholderNode('halfSister', motherId);

    const edges = store.getState().network.edges;
    const exPartnerEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'ex-partner',
    );

    // Should still have only 1 ex-partner edge
    expect(exPartnerEdges.length).toBe(1);
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

  test('half-sibling uses explicit secondParentId instead of first ex-partner', () => {
    /**
     * When secondParentId is provided, the half-sibling should be connected
     * to that specific ex-partner, not just the first one found.
     */
    const motherId = store.getState().addNode({
      label: 'mother',
      sex: 'female',
      readOnly: false,
    });
    const exPartner1Id = store.getState().addNode({
      label: 'ex1',
      sex: 'male',
      readOnly: false,
    });
    const exPartner2Id = store.getState().addNode({
      label: 'ex2',
      sex: 'male',
      readOnly: false,
    });

    // Add ex-partner edges (ex1 added first)
    store.getState().addEdge({
      source: exPartner1Id,
      target: motherId,
      relationship: 'ex-partner',
    });
    store.getState().addEdge({
      source: exPartner2Id,
      target: motherId,
      relationship: 'ex-partner',
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

    // Explicitly specify ex2 as second parent
    const halfSibId = store.getState().addPlaceholderNode('halfSister', motherId, exPartner2Id);

    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === halfSibId,
    );

    // Should be connected to mother + ex2 (not ex1)
    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === motherId)).toBe(true);
    expect(parentEdges.some((e) => e.source === exPartner2Id)).toBe(true);
    expect(parentEdges.some((e) => e.source === exPartner1Id)).toBe(false);
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

    // Sister has a partner and an ex-partner
    const sistersPartnerId = store.getState().addNode({
      label: "sister's partner",
      sex: 'male',
      readOnly: false,
    });
    const sistersExId = store.getState().addNode({
      label: "sister's ex",
      sex: 'male',
      readOnly: false,
    });
    store.getState().addEdge({
      source: sistersPartnerId,
      target: sisterId,
      relationship: 'partner',
    });
    store.getState().addEdge({
      source: sistersExId,
      target: sisterId,
      relationship: 'ex-partner',
    });

    // Add niece with explicit secondParentId = sister's ex
    const nieceId = store.getState().addPlaceholderNode('niece', sisterId, sistersExId);

    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === nieceId,
    );

    // Niece should be connected to sister + sister's ex (not sister's partner)
    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === sisterId)).toBe(true);
    expect(parentEdges.some((e) => e.source === sistersExId)).toBe(true);
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

    // Aunt has partner and ex
    const auntsPartnerId = store.getState().addNode({
      label: "aunt's partner",
      sex: 'male',
      readOnly: false,
    });
    const auntsExId = store.getState().addNode({
      label: "aunt's ex",
      sex: 'male',
      readOnly: false,
    });
    store.getState().addEdge({
      source: auntsPartnerId,
      target: auntId,
      relationship: 'partner',
    });
    store.getState().addEdge({
      source: auntsExId,
      target: auntId,
      relationship: 'ex-partner',
    });

    // Add cousin with explicit secondParentId = aunt's ex
    const cousinId = store.getState().addPlaceholderNode('firstCousinMale', auntId, auntsExId);

    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === cousinId,
    );

    // Cousin should be connected to aunt + aunt's ex
    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === auntId)).toBe(true);
    expect(parentEdges.some((e) => e.source === auntsExId)).toBe(true);
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

    // Daughter has partner and ex
    const daughtersPartnerId = store.getState().addNode({
      label: "daughter's partner",
      sex: 'male',
      readOnly: false,
    });
    const daughtersExId = store.getState().addNode({
      label: "daughter's ex",
      sex: 'male',
      readOnly: false,
    });
    store.getState().addEdge({
      source: daughtersPartnerId,
      target: daughterId,
      relationship: 'partner',
    });
    store.getState().addEdge({
      source: daughtersExId,
      target: daughterId,
      relationship: 'ex-partner',
    });

    // Add grandchild with explicit secondParentId = daughter's ex
    const grandchildId = store.getState().addPlaceholderNode('grandson', daughterId, daughtersExId);

    const edges = store.getState().network.edges;
    const parentEdges = Array.from(edges.values()).filter(
      (e) => e.relationship === 'parent' && e.target === grandchildId,
    );

    // Grandchild should be connected to daughter + daughter's ex
    expect(parentEdges.length).toBe(2);
    expect(parentEdges.some((e) => e.source === daughterId)).toBe(true);
    expect(parentEdges.some((e) => e.source === daughtersExId)).toBe(true);
    expect(parentEdges.some((e) => e.source === daughtersPartnerId)).toBe(false);
  });
});

# FamilyTreeCensus Interface Rebuild Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the FamilyTreeCensus interface to use inclusive pedigree edge types natively, replace the gendered scaffolding questionnaire with a hybrid quick-start + contextual-add UI, and eliminate the adapter translation layer.

**Architecture:** Zustand store with Immer holds `ParentEdgeType` directly in `StoreEdge` unions. A thin structural converter (Map→array) replaces the semantic adapter. Quick-start is an inline form replacing the pedigree area. Adding relatives happens via a contextual menu anchored to tapped nodes.

**Tech Stack:** React 18, Zustand + Immer, Zod, `lib/pedigree-layout` (alignPedigree, computeConnectors), React Hook Form, existing FieldGroup/form hooks, Vitest.

---

## File Inventory

### Files to Create
- `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts` (rewrite in place)
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/QuickStartForm.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/NodeContextMenu.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/AddPersonForm.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/NameInput.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeView.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts` (rewrite in place)

### Files to Modify
- `lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeCensus.tsx` (rewrite orchestrator)
- `lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider.tsx` (new store shape)
- `lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter.ts` (thin structural conversion)
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout.tsx` (use new store shape)
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode.tsx` (new node data shape)
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/EdgeRenderer.tsx` (minor — already updated)
- `lib/interviewer/ducks/modules/session.ts` (update `FamilyTreeCensusStageMetadata`)

### Files to Delete
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/CensusForm.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/AddFamilyMemberForm.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNodeForm.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeShells.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/useDynamicFields.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/useRelatives.ts`
- `lib/interviewer/Interfaces/FamilyTreeCensus/utils/relationFlagsUtils.ts`
- `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/relationFlagsUtils.test.ts`

---

## Task 1: Rewrite Store Types

Replace the current `Relationship` / `RelationshipToEgo` / `Edge` types with the design's `StoreEdge` union and `NodeData` type that uses `ParentEdgeType` directly.

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts`
- Test: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`

**Step 1: Write the failing test**

Create a new test file (overwrite existing) with the first test that validates the new types:

```typescript
// store.test.ts
import { describe, expect, it } from 'vitest';
import { createFamilyTreeStore } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

describe('FamilyTreeStore', () => {
  describe('store creation', () => {
    it('creates store with empty network', () => {
      const store = createFamilyTreeStore(new Map(), new Map());
      const state = store.getState();

      expect(state.step).toBe('scaffolding');
      expect(state.network.nodes.size).toBe(0);
      expect(state.network.edges.size).toBe(0);
    });

    it('creates store with initial nodes and edges', () => {
      const nodes = new Map([
        ['n1', { label: 'Alice', sex: 'female' as const, isEgo: false }],
      ]);
      const edges = new Map([
        [
          'e1',
          {
            source: 'n1',
            target: 'n2',
            type: 'parent' as const,
            edgeType: 'social-parent' as const,
          },
        ],
      ]);
      const store = createFamilyTreeStore(nodes, edges);
      const state = store.getState();

      expect(state.network.nodes.size).toBe(1);
      expect(state.network.edges.size).toBe(1);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`
Expected: FAIL — types don't match yet

**Step 3: Rewrite store types**

Replace the top of `store.ts` with the new type definitions. Keep the Zustand/Immer setup and `createFamilyTreeStore` signature, but rewrite the types:

```typescript
import { type ParentEdgeType } from '~/lib/pedigree-layout/types';

export type Sex = 'male' | 'female';

export type NodeData = {
  label: string;
  sex?: Sex;
  isEgo: boolean;
  readOnly?: boolean;
  interviewNetworkId?: string;
  diseases?: Map<string, boolean>;
};

export type StoreEdge = {
  source: string;
  target: string;
} & (
  | { type: 'parent'; edgeType: ParentEdgeType }
  | { type: 'partner'; current: boolean }
);

type FamilyTreeState = {
  step: 'scaffolding' | 'diseaseNomination';
  network: {
    nodes: Map<string, NodeData>;
    edges: Map<string, StoreEdge>;
  };
};
```

Remove `Relationship`, `RelationshipToEgo`, `Edge`, and the old `FamilyTreeState`. Keep all action types for now (they'll be rewritten in later tasks).

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/store.ts lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts
git commit -m "feat(family-tree): rewrite store types to use ParentEdgeType directly"
```

---

## Task 2: Store Actions — addNode, updateNode, removeNode

Implement the core node CRUD actions on the new store.

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts`
- Test: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`

**Step 1: Write the failing tests**

Add to `store.test.ts`:

```typescript
describe('node actions', () => {
  it('addNode creates a node with generated id', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const id = store.getState().addNode({ label: 'Alice', sex: 'female', isEgo: false });
    expect(typeof id).toBe('string');
    expect(store.getState().network.nodes.get(id)).toEqual({
      label: 'Alice',
      sex: 'female',
      isEgo: false,
    });
  });

  it('updateNode merges partial updates', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const id = store.getState().addNode({ label: '', isEgo: false });
    store.getState().updateNode(id, { label: 'Bob' });
    expect(store.getState().network.nodes.get(id)?.label).toBe('Bob');
  });

  it('removeNode deletes node and its edges', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const parentId = store.getState().addNode({ label: 'Parent', isEgo: false });
    const childId = store.getState().addNode({ label: 'Child', isEgo: false });
    store.getState().addEdge({
      source: parentId,
      target: childId,
      type: 'parent',
      edgeType: 'social-parent',
    });
    expect(store.getState().network.edges.size).toBe(1);

    store.getState().removeNode(childId);
    expect(store.getState().network.nodes.has(childId)).toBe(false);
    expect(store.getState().network.edges.size).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`
Expected: FAIL

**Step 3: Implement node actions**

In `store.ts`, implement:

```typescript
type NetworkActions = {
  addNode: (node: NodeData & { id?: string }) => string;
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: StoreEdge & { id?: string }) => string;
  removeEdge: (id: string) => void;
  clearNetwork: () => void;
  syncMetadata: () => void;
};

// Inside createStore:
addNode: (node) => {
  const id = node.id ?? crypto.randomUUID();
  const { id: _, ...data } = node;
  set((state) => {
    state.network.nodes.set(id, data);
  });
  return id;
},

updateNode: (id, updates) => {
  set((state) => {
    const node = state.network.nodes.get(id);
    if (!node) return;
    Object.assign(node, updates);
  });
},

removeNode: (id) => {
  set((state) => {
    state.network.nodes.delete(id);
    for (const [edgeId, edge] of state.network.edges) {
      if (edge.source === id || edge.target === id) {
        state.network.edges.delete(edgeId);
      }
    }
  });
},
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/store.ts lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts
git commit -m "feat(family-tree): implement node CRUD actions on new store"
```

---

## Task 3: Store Actions — addEdge, removeEdge, clearNetwork

Implement edge management and network clearing.

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts`
- Test: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`

**Step 1: Write the failing tests**

```typescript
describe('edge actions', () => {
  it('addEdge creates parent edge with edgeType', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const p = store.getState().addNode({ label: 'P', isEgo: false });
    const c = store.getState().addNode({ label: 'C', isEgo: false });
    const edgeId = store.getState().addEdge({
      source: p,
      target: c,
      type: 'parent',
      edgeType: 'bio-parent',
    });
    const edge = store.getState().network.edges.get(edgeId);
    expect(edge).toMatchObject({
      source: p,
      target: c,
      type: 'parent',
      edgeType: 'bio-parent',
    });
  });

  it('addEdge creates partner edge with current flag', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const a = store.getState().addNode({ label: 'A', isEgo: false });
    const b = store.getState().addNode({ label: 'B', isEgo: false });
    const edgeId = store.getState().addEdge({
      source: a,
      target: b,
      type: 'partner',
      current: true,
    });
    const edge = store.getState().network.edges.get(edgeId);
    expect(edge).toMatchObject({
      source: a,
      target: b,
      type: 'partner',
      current: true,
    });
  });

  it('clearNetwork removes all nodes and edges', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    store.getState().addNode({ label: 'A', isEgo: false });
    store.getState().addNode({ label: 'B', isEgo: false });
    expect(store.getState().network.nodes.size).toBe(2);

    store.getState().clearNetwork();
    expect(store.getState().network.nodes.size).toBe(0);
    expect(store.getState().network.edges.size).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`
Expected: FAIL

**Step 3: Implement edge actions**

```typescript
addEdge: (edge) => {
  const id = edge.id ?? crypto.randomUUID();
  const { id: _, ...data } = edge;
  set((state) => {
    state.network.edges.set(id, data as StoreEdge);
  });
  return id;
},

removeEdge: (id) => {
  set((state) => {
    state.network.edges.delete(id);
  });
},

clearNetwork: () => {
  set((state) => {
    state.network.nodes.clear();
    state.network.edges.clear();
  });
},
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/store.ts lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts
git commit -m "feat(family-tree): implement edge actions and clearNetwork"
```

---

## Task 4: Store Action — generateQuickStartNetwork

Implement the quick-start network generation that creates ego, parents, siblings, partner, and children from the inline form data. All parent edges default to `social-parent`.

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts`
- Test: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`

**Step 1: Write the failing tests**

```typescript
describe('generateQuickStartNetwork', () => {
  it('creates ego when all counts are zero', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    store.getState().generateQuickStartNetwork({
      parentCount: 0,
      siblingCount: 0,
      hasPartner: false,
      childrenWithPartnerCount: 0,
      soloChildrenCount: 0,
    });
    const nodes = store.getState().network.nodes;
    expect(nodes.size).toBe(1);
    const ego = [...nodes.values()].find((n) => n.isEgo);
    expect(ego).toBeDefined();
  });

  it('creates parents with social-parent edges and partner group', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    store.getState().generateQuickStartNetwork({
      parentCount: 2,
      siblingCount: 0,
      hasPartner: false,
      childrenWithPartnerCount: 0,
      soloChildrenCount: 0,
    });
    const nodes = store.getState().network.nodes;
    const edges = store.getState().network.edges;

    // ego + 2 parents
    expect(nodes.size).toBe(3);

    // 2 parent edges (each parent → ego) + 1 partner edge between parents
    const parentEdges = [...edges.values()].filter((e) => e.type === 'parent');
    const partnerEdges = [...edges.values()].filter((e) => e.type === 'partner');
    expect(parentEdges.length).toBe(2);
    expect(partnerEdges.length).toBe(1);
    expect(parentEdges.every((e) => e.type === 'parent' && e.edgeType === 'social-parent')).toBe(true);
  });

  it('creates siblings linked to same parents as ego', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    store.getState().generateQuickStartNetwork({
      parentCount: 2,
      siblingCount: 2,
      hasPartner: false,
      childrenWithPartnerCount: 0,
      soloChildrenCount: 0,
    });
    const nodes = store.getState().network.nodes;
    // ego + 2 parents + 2 siblings = 5
    expect(nodes.size).toBe(5);

    const edges = store.getState().network.edges;
    // 2 parent→ego + 1 partner + 2×2 parent→sibling = 9
    const parentEdges = [...edges.values()].filter((e) => e.type === 'parent');
    expect(parentEdges.length).toBe(6); // 2 parents × (ego + 2 siblings)
  });

  it('creates partner and children with partner', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    store.getState().generateQuickStartNetwork({
      parentCount: 0,
      siblingCount: 0,
      hasPartner: true,
      childrenWithPartnerCount: 2,
      soloChildrenCount: 0,
    });
    const nodes = store.getState().network.nodes;
    // ego + partner + 2 children = 4
    expect(nodes.size).toBe(4);

    const edges = store.getState().network.edges;
    // ego↔partner (1 partner edge) + 2×2 parent→child = 5
    const partnerEdges = [...edges.values()].filter((e) => e.type === 'partner');
    const parentEdges = [...edges.values()].filter((e) => e.type === 'parent');
    expect(partnerEdges.length).toBe(1);
    expect(parentEdges.length).toBe(4); // 2 parents × 2 children
  });

  it('creates solo children linked only to ego', () => {
    const store = createFamilyTreeStore(new Map(), new Map());
    store.getState().generateQuickStartNetwork({
      parentCount: 0,
      siblingCount: 0,
      hasPartner: false,
      childrenWithPartnerCount: 0,
      soloChildrenCount: 3,
    });
    const nodes = store.getState().network.nodes;
    // ego + 3 children = 4
    expect(nodes.size).toBe(4);

    const edges = store.getState().network.edges;
    const parentEdges = [...edges.values()].filter((e) => e.type === 'parent');
    expect(parentEdges.length).toBe(3); // 1 parent × 3 children
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`
Expected: FAIL

**Step 3: Implement generateQuickStartNetwork**

```typescript
type QuickStartData = {
  parentCount: number;
  siblingCount: number;
  hasPartner: boolean;
  childrenWithPartnerCount: number;
  soloChildrenCount: number;
};

// Inside store actions:
generateQuickStartNetwork: (data: QuickStartData) => {
  const { addNode, addEdge, clearNetwork } = get();
  clearNetwork();

  const egoId = addNode({ label: '', isEgo: true });

  // Parents
  const parentIds: string[] = [];
  for (let i = 0; i < data.parentCount; i++) {
    const id = addNode({ label: '', isEgo: false });
    parentIds.push(id);
    addEdge({ source: id, target: egoId, type: 'parent', edgeType: 'social-parent' });
  }

  // Partner group between parents (if >1)
  if (parentIds.length > 1) {
    for (let i = 0; i < parentIds.length - 1; i++) {
      addEdge({
        source: parentIds[i]!,
        target: parentIds[i + 1]!,
        type: 'partner',
        current: true,
      });
    }
  }

  // Siblings (linked to same parents as ego)
  for (let i = 0; i < data.siblingCount; i++) {
    const sibId = addNode({ label: '', isEgo: false });
    for (const parentId of parentIds) {
      addEdge({ source: parentId, target: sibId, type: 'parent', edgeType: 'social-parent' });
    }
  }

  // Partner
  let partnerId: string | undefined;
  if (data.hasPartner) {
    partnerId = addNode({ label: '', isEgo: false });
    addEdge({ source: egoId, target: partnerId, type: 'partner', current: true });
  }

  // Children with partner
  for (let i = 0; i < data.childrenWithPartnerCount; i++) {
    const childId = addNode({ label: '', isEgo: false });
    addEdge({ source: egoId, target: childId, type: 'parent', edgeType: 'social-parent' });
    if (partnerId) {
      addEdge({ source: partnerId, target: childId, type: 'parent', edgeType: 'social-parent' });
    }
  }

  // Solo children
  for (let i = 0; i < data.soloChildrenCount; i++) {
    const childId = addNode({ label: '', isEgo: false });
    addEdge({ source: egoId, target: childId, type: 'parent', edgeType: 'social-parent' });
  }
},
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/store.ts lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts
git commit -m "feat(family-tree): implement quick-start network generation"
```

---

## Task 5: Store Action — syncMetadata

Implement Redux metadata sync with the new store shape.

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts`
- Modify: `lib/interviewer/ducks/modules/session.ts` (update metadata schema)
- Test: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`

**Step 1: Update the metadata schema**

In `session.ts`, replace `FamilyTreeCensusStageMetadataSchema`:

```typescript
const FamilyTreeCensusStageMetadataSchema = z.object({
  hasCompletedQuickStart: z.boolean(),
  nodes: z.optional(
    z.array(
      z.object({
        id: z.string(),
        interviewNetworkId: z.string().optional(),
        label: z.string(),
        sex: z.enum(['male', 'female']).optional(),
        isEgo: z.boolean(),
      }),
    ),
  ),
  edges: z.optional(
    z.array(
      z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
      }).and(
        z.union([
          z.object({
            type: z.literal('parent'),
            edgeType: z.enum([
              'social-parent',
              'bio-parent',
              'donor',
              'surrogate',
              'co-parent',
            ]),
          }),
          z.object({
            type: z.literal('partner'),
            current: z.boolean(),
          }),
        ]),
      ),
    ),
  ),
});
```

**Step 2: Write the failing test**

```typescript
describe('syncMetadata', () => {
  it('dispatches updateStageMetadata with current nodes and edges', () => {
    const dispatched: unknown[] = [];
    const mockDispatch = (action: unknown) => {
      dispatched.push(action);
      return action;
    };
    const store = createFamilyTreeStore(
      new Map(),
      new Map(),
      mockDispatch as ReturnType<typeof useAppDispatch>,
    );
    store.getState().addNode({ label: 'Ego', isEgo: true });
    store.getState().syncMetadata();

    expect(dispatched.length).toBe(1);
  });
});
```

**Step 3: Implement syncMetadata**

```typescript
syncMetadata: () => {
  const { nodes, edges } = get().network;

  const serializedNodes = [...nodes.entries()].map(([id, node]) => ({
    id,
    interviewNetworkId: node.interviewNetworkId,
    label: node.label,
    sex: node.sex,
    isEgo: node.isEgo,
  }));

  const serializedEdges = [...edges.entries()].map(([id, edge]) => ({
    id,
    ...edge,
  }));

  dispatch?.(
    updateStageMetadata({
      hasCompletedQuickStart: true,
      nodes: serializedNodes,
      edges: serializedEdges,
    }),
  );
},
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/store.ts lib/interviewer/ducks/modules/session.ts lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts
git commit -m "feat(family-tree): implement syncMetadata with new schema"
```

---

## Task 6: Rewrite pedigreeAdapter — Thin Structural Conversion

Replace the semantic translation adapter with a thin Map→array converter. `ParentEdgeType` passes straight through.

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter.ts`
- Test: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/pedigreeAdapter.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { storeToPedigreeInput } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter';
import { type NodeData, type StoreEdge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

describe('storeToPedigreeInput (thin conversion)', () => {
  it('converts Maps to PedigreeInput arrays', () => {
    const nodes = new Map<string, NodeData>([
      ['p1', { label: 'Parent 1', sex: 'male', isEgo: false }],
      ['p2', { label: 'Parent 2', sex: 'female', isEgo: false }],
      ['c1', { label: 'Child', isEgo: true }],
    ]);
    const edges = new Map<string, StoreEdge>([
      ['e1', { source: 'p1', target: 'c1', type: 'parent', edgeType: 'social-parent' }],
      ['e2', { source: 'p2', target: 'c1', type: 'parent', edgeType: 'social-parent' }],
      ['e3', { source: 'p1', target: 'p2', type: 'partner', current: true }],
    ]);

    const result = storeToPedigreeInput(nodes, edges);

    expect(result.input.id.length).toBe(3);
    expect(result.input.parents[result.idToIndex.get('c1')!]!.length).toBe(2);
    expect(result.input.parents[result.idToIndex.get('c1')!]![0]!.edgeType).toBe('social-parent');
    expect(result.input.relation).toEqual([
      { id1: result.idToIndex.get('p1')!, id2: result.idToIndex.get('p2')!, code: 4 },
    ]);
  });

  it('passes ParentEdgeType straight through without translation', () => {
    const nodes = new Map<string, NodeData>([
      ['sp', { label: 'Social Parent', isEgo: false }],
      ['donor', { label: 'Donor', isEgo: false }],
      ['child', { label: 'Child', isEgo: true }],
    ]);
    const edges = new Map<string, StoreEdge>([
      ['e1', { source: 'sp', target: 'child', type: 'parent', edgeType: 'social-parent' }],
      ['e2', { source: 'donor', target: 'child', type: 'parent', edgeType: 'donor' }],
    ]);

    const result = storeToPedigreeInput(nodes, edges);
    const childIdx = result.idToIndex.get('child')!;
    const parentConnections = result.input.parents[childIdx]!;

    const edgeTypes = parentConnections.map((p) => p.edgeType);
    expect(edgeTypes).toContain('social-parent');
    expect(edgeTypes).toContain('donor');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/pedigreeAdapter.test.ts`
Expected: FAIL — function signature changed

**Step 3: Rewrite storeToPedigreeInput**

```typescript
import { type NodeData, type StoreEdge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import {
  type Gender,
  type ParentConnection,
  type PedigreeInput,
  type Relation,
  type Sex,
} from '~/lib/pedigree-layout/types';

type ConversionResult = {
  input: PedigreeInput;
  indexToId: string[];
  idToIndex: Map<string, number>;
};

function mapSex(sex: 'male' | 'female' | undefined): Sex {
  if (sex === 'male') return 'male';
  if (sex === 'female') return 'female';
  return 'unknown';
}

function mapGender(sex: 'male' | 'female' | undefined): Gender {
  if (sex === 'male') return 'man';
  if (sex === 'female') return 'woman';
  return 'unknown';
}

export function storeToPedigreeInput(
  nodes: Map<string, NodeData>,
  edges: Map<string, StoreEdge>,
): ConversionResult {
  const indexToId: string[] = [];
  const idToIndex = new Map<string, number>();

  let idx = 0;
  for (const nodeId of nodes.keys()) {
    indexToId.push(nodeId);
    idToIndex.set(nodeId, idx);
    idx++;
  }

  const n = indexToId.length;
  const id: string[] = indexToId.slice();
  const sex: Sex[] = indexToId.map((nid) => mapSex(nodes.get(nid)?.sex));
  const gender: Gender[] = indexToId.map((nid) => mapGender(nodes.get(nid)?.sex));
  const parents: ParentConnection[][] = Array.from({ length: n }, () => []);
  const relations: Relation[] = [];

  for (const edge of edges.values()) {
    if (edge.type === 'parent') {
      const childIdx = idToIndex.get(edge.target);
      const parentIdx = idToIndex.get(edge.source);
      if (childIdx === undefined || parentIdx === undefined) continue;
      parents[childIdx]!.push({
        parentIndex: parentIdx,
        edgeType: edge.edgeType, // straight through, no translation
      });
    } else if (edge.type === 'partner') {
      const i1 = idToIndex.get(edge.source);
      const i2 = idToIndex.get(edge.target);
      if (i1 === undefined || i2 === undefined) continue;
      relations.push({ id1: i1, id2: i2, code: 4 });
    }
  }

  return {
    input: {
      id,
      sex,
      gender,
      parents,
      relation: relations.length > 0 ? relations : undefined,
    },
    indexToId,
    idToIndex,
  };
}
```

Keep `pedigreeLayoutToPositions` and `buildConnectorData` unchanged (they don't reference `Edge` type).

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/pedigreeAdapter.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter.ts lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/pedigreeAdapter.test.ts
git commit -m "refactor(family-tree): thin structural adapter, no semantic translation"
```

---

## Task 7: NameInput Component

Create the custom name input with "Don't know" toggle switch.

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/NameInput.tsx`

**Step 1: Implement NameInput**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Switch } from '~/components/ui/switch';
import { Input } from '~/components/ui/input';
import { cn } from '~/utils/shadcn';

type NameInputProps = {
  value: string;
  onChange: (value: string) => void;
  unknownLabel?: string;
  className?: string;
};

export function NameInput({
  value,
  onChange,
  unknownLabel = 'Unknown',
  className,
}: NameInputProps) {
  const [dontKnow, setDontKnow] = useState(value === '');

  useEffect(() => {
    if (dontKnow) {
      onChange('');
    }
  }, [dontKnow, onChange]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Input
        placeholder="Enter name"
        value={dontKnow ? unknownLabel : value}
        onChange={(e) => onChange(e.target.value)}
        disabled={dontKnow}
      />
      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={dontKnow}
          onCheckedChange={setDontKnow}
        />
        Don&apos;t know
      </label>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: No new errors from NameInput

**Step 3: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/NameInput.tsx
git commit -m "feat(family-tree): add NameInput component with don't-know toggle"
```

---

## Task 8: QuickStartForm Component

Create the inline quick-start form that replaces the pedigree area when no nodes exist.

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/QuickStartForm.tsx`

**Step 1: Implement QuickStartForm**

This is an inline form (not a modal) with number steppers for parents, siblings, partner toggle, and children counts. On submit it calls `generateQuickStartNetwork`.

```typescript
'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/input';
import { Switch } from '~/components/ui/switch';
import { cn } from '~/utils/shadcn';

type QuickStartFormProps = {
  prompt: string;
  onSubmit: (data: {
    parentCount: number;
    siblingCount: number;
    hasPartner: boolean;
    childrenWithPartnerCount: number;
    soloChildrenCount: number;
  }) => void;
};

function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          type="button"
        >
          −
        </Button>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="w-16 text-center"
          min={min}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(value + 1)}
          type="button"
        >
          +
        </Button>
      </div>
    </div>
  );
}

export function QuickStartForm({ prompt, onSubmit }: QuickStartFormProps) {
  const [parentCount, setParentCount] = useState(2);
  const [siblingCount, setSiblingCount] = useState(0);
  const [hasPartner, setHasPartner] = useState(false);
  const [childrenWithPartnerCount, setChildrenWithPartnerCount] = useState(0);
  const [soloChildrenCount, setSoloChildrenCount] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      parentCount,
      siblingCount,
      hasPartner,
      childrenWithPartnerCount,
      soloChildrenCount,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'mx-auto flex max-w-md flex-col gap-6 rounded-lg bg-card p-8 shadow-lg',
      )}
    >
      <p className="text-center text-lg">{prompt}</p>

      <div className="flex flex-col gap-4">
        <NumberStepper
          label="How many parents do you have?"
          value={parentCount}
          onChange={setParentCount}
        />

        <NumberStepper
          label="How many siblings do you have?"
          value={siblingCount}
          onChange={setSiblingCount}
        />

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">Do you have a partner?</span>
          <Switch checked={hasPartner} onCheckedChange={setHasPartner} />
        </div>

        {hasPartner && (
          <NumberStepper
            label="How many children together?"
            value={childrenWithPartnerCount}
            onChange={setChildrenWithPartnerCount}
          />
        )}

        <NumberStepper
          label="Children from another relationship?"
          value={soloChildrenCount}
          onChange={setSoloChildrenCount}
        />
      </div>

      <Button type="submit">Build Family Tree</Button>
    </form>
  );
}
```

**Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: No new errors

**Step 3: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/QuickStartForm.tsx
git commit -m "feat(family-tree): add inline QuickStartForm component"
```

---

## Task 9: NodeContextMenu Component

Create the contextual menu that appears when tapping a node in the pedigree. Shows add/edit options anchored to the node.

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/NodeContextMenu.tsx`

**Step 1: Implement NodeContextMenu**

The menu presents options based on the selected node's context:
- "Add parent" → opens AddPersonForm with role picker
- "Add child" → if partners exist, asks which partner
- "Add partner" → asks current/ex
- "Add sibling" → available if node has parents
- "Edit name" → opens NameInput
- "Change role" → for parent edges, change edgeType

```typescript
'use client';

import { Button } from '~/components/ui/Button';
import { type NodeData, type StoreEdge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { cn } from '~/utils/shadcn';

type NodeContextMenuProps = {
  nodeId: string;
  node: NodeData;
  position: { x: number; y: number };
  edges: Map<string, StoreEdge>;
  nodes: Map<string, NodeData>;
  onAddParent: () => void;
  onAddChild: () => void;
  onAddPartner: () => void;
  onAddSibling: () => void;
  onEditName: () => void;
  onClose: () => void;
  className?: string;
};

export function NodeContextMenu({
  nodeId,
  node: _node,
  position,
  edges,
  nodes: _nodes,
  onAddParent,
  onAddChild,
  onAddPartner,
  onAddSibling,
  onEditName,
  onClose,
  className,
}: NodeContextMenuProps) {
  const hasParents = [...edges.values()].some(
    (e) => e.type === 'parent' && e.target === nodeId,
  );

  return (
    <div
      className={cn(
        'absolute z-50 flex flex-col gap-1 rounded-lg bg-popover p-2 shadow-lg',
        className,
      )}
      style={{ left: position.x, top: position.y }}
    >
      <Button variant="ghost" size="sm" onClick={onAddParent}>
        Add parent
      </Button>
      <Button variant="ghost" size="sm" onClick={onAddChild}>
        Add child
      </Button>
      <Button variant="ghost" size="sm" onClick={onAddPartner}>
        Add partner
      </Button>
      {hasParents && (
        <Button variant="ghost" size="sm" onClick={onAddSibling}>
          Add sibling
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onEditName}>
        Edit name
      </Button>
      <Button variant="ghost" size="sm" onClick={onClose}>
        Cancel
      </Button>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: No new errors

**Step 3: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/NodeContextMenu.tsx
git commit -m "feat(family-tree): add NodeContextMenu component"
```

---

## Task 10: AddPersonForm Component

Create the follow-up form for adding a relative. Handles role picker (for parents), partner picker (for children), current/ex toggle (for partners), and name input.

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/AddPersonForm.tsx`

**Step 1: Implement AddPersonForm**

```typescript
'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { type ParentEdgeType } from '~/lib/pedigree-layout/types';
import { NameInput } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/NameInput';
import { type NodeData, type StoreEdge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { cn } from '~/utils/shadcn';

type AddPersonMode = 'parent' | 'child' | 'partner' | 'sibling';

type AddPersonFormProps = {
  mode: AddPersonMode;
  anchorNodeId: string;
  nodes: Map<string, NodeData>;
  edges: Map<string, StoreEdge>;
  onSubmit: (data: {
    name: string;
    mode: AddPersonMode;
    edgeType?: ParentEdgeType;
    partnerId?: string;
    current?: boolean;
  }) => void;
  onCancel: () => void;
  className?: string;
};

const PARENT_EDGE_TYPES: { value: ParentEdgeType; label: string }[] = [
  { value: 'social-parent', label: 'Social parent' },
  { value: 'bio-parent', label: 'Biological parent' },
  { value: 'donor', label: 'Donor' },
  { value: 'surrogate', label: 'Surrogate' },
  { value: 'co-parent', label: 'Co-parent' },
];

export function AddPersonForm({
  mode,
  anchorNodeId,
  nodes,
  edges,
  onSubmit,
  onCancel,
  className,
}: AddPersonFormProps) {
  const [name, setName] = useState('');
  const [edgeType, setEdgeType] = useState<ParentEdgeType>('social-parent');
  const [partnerId, setPartnerId] = useState<string | undefined>();
  const [current, setCurrent] = useState(true);

  // Find partners of anchor node for "add child" mode
  const partners: { id: string; label: string }[] = [];
  if (mode === 'child') {
    for (const [_edgeId, edge] of edges) {
      if (edge.type !== 'partner') continue;
      if (edge.source === anchorNodeId) {
        const partner = nodes.get(edge.target);
        if (partner) partners.push({ id: edge.target, label: partner.label || 'Unnamed' });
      } else if (edge.target === anchorNodeId) {
        const partner = nodes.get(edge.source);
        if (partner) partners.push({ id: edge.source, label: partner.label || 'Unnamed' });
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      mode,
      edgeType: mode === 'parent' ? edgeType : undefined,
      partnerId: mode === 'child' && partners.length > 0 ? partnerId : undefined,
      current: mode === 'partner' ? current : undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-4 rounded-lg bg-card p-4 shadow-lg', className)}
    >
      <h3 className="text-sm font-semibold capitalize">Add {mode}</h3>

      {mode === 'parent' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Relationship type</legend>
          {PARENT_EDGE_TYPES.map((t) => (
            <label key={t.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="edgeType"
                value={t.value}
                checked={edgeType === t.value}
                onChange={() => setEdgeType(t.value)}
              />
              {t.label}
            </label>
          ))}
        </fieldset>
      )}

      {mode === 'child' && partners.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">With which partner?</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="partnerId"
              value=""
              checked={partnerId === undefined}
              onChange={() => setPartnerId(undefined)}
            />
            No partner (solo)
          </label>
          {partners.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="partnerId"
                value={p.id}
                checked={partnerId === p.id}
                onChange={() => setPartnerId(p.id)}
              />
              {p.label}
            </label>
          ))}
        </fieldset>
      )}

      {mode === 'partner' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Current or ex partner?</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="current"
              checked={current}
              onChange={() => setCurrent(true)}
            />
            Current
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="current"
              checked={!current}
              onChange={() => setCurrent(false)}
            />
            Ex
          </label>
        </fieldset>
      )}

      <NameInput value={name} onChange={setName} />

      <div className="flex gap-2">
        <Button type="submit">Add</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

**Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: No new errors

**Step 3: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/AddPersonForm.tsx
git commit -m "feat(family-tree): add AddPersonForm with role picker and follow-up questions"
```

---

## Task 11: PedigreeView Component

Create the main scaffolding view that combines pedigree layout with node tap handling and the contextual menu.

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeView.tsx`

**Step 1: Implement PedigreeView**

This component:
1. Renders the pedigree layout from store nodes/edges
2. Handles node taps to show NodeContextMenu
3. Opens AddPersonForm for follow-up questions
4. Commits additions to the store

```typescript
'use client';

import { useCallback, useState } from 'react';
import { type ParentEdgeType } from '~/lib/pedigree-layout/types';
import { AddPersonForm } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/AddPersonForm';
import { NodeContextMenu } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/NodeContextMenu';
import { NameInput } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/NameInput';
import { PedigreeLayout } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout';
import { useFamilyTreeStore } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider';

type AddPersonMode = 'parent' | 'child' | 'partner' | 'sibling';

type InteractionState =
  | { type: 'idle' }
  | { type: 'contextMenu'; nodeId: string; position: { x: number; y: number } }
  | { type: 'addPerson'; nodeId: string; mode: AddPersonMode }
  | { type: 'editName'; nodeId: string };

export function PedigreeView() {
  const [interaction, setInteraction] = useState<InteractionState>({ type: 'idle' });

  const nodes = useFamilyTreeStore((s) => s.network.nodes);
  const edges = useFamilyTreeStore((s) => s.network.edges);
  const addNode = useFamilyTreeStore((s) => s.addNode);
  const addEdge = useFamilyTreeStore((s) => s.addEdge);
  const updateNode = useFamilyTreeStore((s) => s.updateNode);

  const handleNodeTap = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      setInteraction({ type: 'contextMenu', nodeId, position });
    },
    [],
  );

  const handleAddPerson = useCallback(
    (data: {
      name: string;
      mode: AddPersonMode;
      edgeType?: ParentEdgeType;
      partnerId?: string;
      current?: boolean;
    }) => {
      if (interaction.type !== 'addPerson') return;
      const anchorId = interaction.nodeId;

      const newNodeId = addNode({ label: data.name, isEgo: false });

      switch (data.mode) {
        case 'parent':
          addEdge({
            source: newNodeId,
            target: anchorId,
            type: 'parent',
            edgeType: data.edgeType ?? 'social-parent',
          });
          break;
        case 'child':
          addEdge({
            source: anchorId,
            target: newNodeId,
            type: 'parent',
            edgeType: 'social-parent',
          });
          if (data.partnerId) {
            addEdge({
              source: data.partnerId,
              target: newNodeId,
              type: 'parent',
              edgeType: 'social-parent',
            });
          }
          break;
        case 'partner':
          addEdge({
            source: anchorId,
            target: newNodeId,
            type: 'partner',
            current: data.current ?? true,
          });
          break;
        case 'sibling': {
          // Find anchor's parents and link the new sibling to the same parents
          for (const edge of edges.values()) {
            if (edge.type === 'parent' && edge.target === anchorId) {
              addEdge({
                source: edge.source,
                target: newNodeId,
                type: 'parent',
                edgeType: edge.edgeType,
              });
            }
          }
          break;
        }
      }

      setInteraction({ type: 'idle' });
    },
    [interaction, addNode, addEdge, edges],
  );

  const handleEditName = useCallback(
    (name: string) => {
      if (interaction.type !== 'editName') return;
      updateNode(interaction.nodeId, { label: name });
    },
    [interaction, updateNode],
  );

  const close = useCallback(() => setInteraction({ type: 'idle' }), []);

  return (
    <div className="relative h-full w-full">
      <PedigreeLayout onNodeTap={handleNodeTap} />

      {interaction.type === 'contextMenu' && (
        <NodeContextMenu
          nodeId={interaction.nodeId}
          node={nodes.get(interaction.nodeId)!}
          position={interaction.position}
          edges={edges}
          nodes={nodes}
          onAddParent={() =>
            setInteraction({ type: 'addPerson', nodeId: interaction.nodeId, mode: 'parent' })
          }
          onAddChild={() =>
            setInteraction({ type: 'addPerson', nodeId: interaction.nodeId, mode: 'child' })
          }
          onAddPartner={() =>
            setInteraction({ type: 'addPerson', nodeId: interaction.nodeId, mode: 'partner' })
          }
          onAddSibling={() =>
            setInteraction({ type: 'addPerson', nodeId: interaction.nodeId, mode: 'sibling' })
          }
          onEditName={() =>
            setInteraction({ type: 'editName', nodeId: interaction.nodeId })
          }
          onClose={close}
        />
      )}

      {interaction.type === 'addPerson' && (
        <AddPersonForm
          mode={interaction.mode}
          anchorNodeId={interaction.nodeId}
          nodes={nodes}
          edges={edges}
          onSubmit={handleAddPerson}
          onCancel={close}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      )}

      {interaction.type === 'editName' && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-card p-4 shadow-lg">
          <NameInput
            value={nodes.get(interaction.nodeId)?.label ?? ''}
            onChange={handleEditName}
          />
          <button onClick={close} className="mt-2 text-sm underline">
            Done
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: No new errors

**Step 3: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeView.tsx
git commit -m "feat(family-tree): add PedigreeView with contextual menu interaction"
```

---

## Task 12: Update FamilyTreeNode for New Store Shape

Update the node component to work with `NodeData` instead of the old `FamilyTreeNodeType`.

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode.tsx`

**Step 1: Read the current FamilyTreeNode.tsx**

Read the file to understand the current rendering logic and drag behavior.

**Step 2: Update the type import and rendering**

Replace `FamilyTreeNodeType` with `NodeData` import. Update the component props to accept:
- `nodeId: string`
- `node: NodeData`
- `onTap?: (nodeId: string, position: { x: number; y: number }) => void`

The node should:
- Show the label if non-empty, otherwise show a placeholder ("Parent 1", "Sibling 2", etc.)
- Show ego icon if `isEgo`
- Support tap interaction (calls `onTap` with node position)
- Keep existing drag-to-bin support via `useDragSource`

**Step 3: Verify it compiles**

Run: `pnpm typecheck`
Expected: No new errors from FamilyTreeNode

**Step 4: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode.tsx
git commit -m "refactor(family-tree): update FamilyTreeNode for new NodeData type"
```

---

## Task 13: Update PedigreeLayout Component

Update the layout component to accept new store types and pass `onNodeTap` through.

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout.tsx`

**Step 1: Read the current PedigreeLayout.tsx**

Understand the current layout computation and rendering pipeline.

**Step 2: Update to use new adapter**

The layout component should:
1. Accept `onNodeTap` callback prop
2. Use the new `storeToPedigreeInput` (which now takes `Map<string, NodeData>` and `Map<string, StoreEdge>`)
3. Call `alignPedigree` → positions → connectors
4. Render nodes via updated `FamilyTreeNode` with `onTap`
5. Render connectors via existing `EdgeRenderer`

**Step 3: Verify it compiles**

Run: `pnpm typecheck`
Expected: No new errors

**Step 4: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout.tsx
git commit -m "refactor(family-tree): update PedigreeLayout for new store types"
```

---

## Task 14: Update FamilyTreeProvider

Update the provider to hydrate from Redux using the new `NodeData` / `StoreEdge` types.

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider.tsx`

**Step 1: Read current FamilyTreeProvider.tsx**

Already read. The provider creates the Zustand store from Redux nodes/edges.

**Step 2: Update hydration logic**

Replace the hydration to:
1. Map Redux nodes to `NodeData` (no more `FamilyTreeNodeType`)
2. Map Redux edges to `StoreEdge` with `type: 'parent' | 'partner'` and the corresponding discriminated fields
3. Remove imports of old types (`Edge`, `Relationship`, `FamilyTreeNodeType`)
4. Remove `getRelationshipTypeVariable` usage — edges now carry `type` and `edgeType`/`current` directly

The provider also needs to handle hydration from `FamilyTreeCensusStageMetadata` (the new schema with `nodes` and `edges` arrays). If metadata exists, prefer it over Redux nodes/edges.

**Step 3: Verify it compiles**

Run: `pnpm typecheck`
Expected: No new errors

**Step 4: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider.tsx
git commit -m "refactor(family-tree): update FamilyTreeProvider for new store shape"
```

---

## Task 15: Rewrite FamilyTreeCensus Orchestrator

Replace the three-step orchestrator with a two-phase design: scaffolding → disease nomination.

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeCensus.tsx`

**Step 1: Read current FamilyTreeCensus.tsx fully**

Understand step management, validation, and Redux integration.

**Step 2: Rewrite the orchestrator**

The new orchestrator has two phases:
1. **Scaffolding** — shows `QuickStartForm` if no nodes, else shows `PedigreeView`
2. **Disease nomination** — iterates disease variables if configured

Key changes:
- Remove `FamilyTreeShells` import and usage
- Remove `nameGenerationStep` handling
- Use `QuickStartForm` inline (not modal)
- Use `PedigreeView` for scaffolding interaction
- Keep `NodeBin` for drag-to-bin deletion
- Keep `useBeforeNext` for validation/sync
- Keep `Prompts` for stage prompts

```typescript
function FamilyTreeCensus({ stage }: FamilyTreeCensusProps) {
  const nodes = useFamilyTreeStore((s) => s.network.nodes);
  const step = useFamilyTreeStore((s) => s.step);
  const generateQuickStartNetwork = useFamilyTreeStore((s) => s.generateQuickStartNetwork);
  const syncMetadata = useFamilyTreeStore((s) => s.syncMetadata);

  const hasNodes = nodes.size > 0;

  useBeforeNext(() => {
    syncMetadata();
    return true;
  });

  if (step === 'scaffolding') {
    if (!hasNodes && stage.quickStart?.enabled) {
      return (
        <QuickStartForm
          prompt={stage.quickStart.prompt}
          onSubmit={generateQuickStartNetwork}
        />
      );
    }
    return (
      <>
        <PedigreeView />
        <NodeBin />
      </>
    );
  }

  // Disease nomination phase
  return <DiseaseNominationView stage={stage} />;
}
```

**Step 3: Verify it compiles**

Run: `pnpm typecheck`
Expected: No new errors

**Step 4: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeCensus.tsx
git commit -m "refactor(family-tree): rewrite orchestrator with two-phase design"
```

---

## Task 16: Delete Replaced Files

Remove the old files that are no longer needed.

**Files to delete:**
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/CensusForm.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/AddFamilyMemberForm.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNodeForm.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeShells.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/useDynamicFields.tsx`
- `lib/interviewer/Interfaces/FamilyTreeCensus/useRelatives.ts`
- `lib/interviewer/Interfaces/FamilyTreeCensus/utils/relationFlagsUtils.ts`
- `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/relationFlagsUtils.test.ts`

**Step 1: Verify no remaining imports of deleted files**

Search for imports of each deleted file across the codebase. Any remaining references must be updated first.

Run: `pnpm grep -r "CensusForm\|AddFamilyMemberForm\|FamilyTreeNodeForm\|FamilyTreeShells\|useDynamicFields\|useRelatives\|relationFlagsUtils" --include="*.ts" --include="*.tsx" lib/`

**Step 2: Delete the files**

```bash
rm lib/interviewer/Interfaces/FamilyTreeCensus/components/CensusForm.tsx
rm lib/interviewer/Interfaces/FamilyTreeCensus/components/AddFamilyMemberForm.tsx
rm lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNodeForm.tsx
rm lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeShells.tsx
rm lib/interviewer/Interfaces/FamilyTreeCensus/useDynamicFields.tsx
rm lib/interviewer/Interfaces/FamilyTreeCensus/useRelatives.ts
rm lib/interviewer/Interfaces/FamilyTreeCensus/utils/relationFlagsUtils.ts
rm lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/relationFlagsUtils.test.ts
```

**Step 3: Verify build**

Run: `pnpm typecheck`
Expected: No import errors referencing deleted files

**Step 4: Commit**

```bash
git add -A
git commit -m "chore(family-tree): delete replaced files from old interface"
```

---

## Task 17: Update Storybook Stories

Update the existing Storybook stories to use the new component architecture.

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeCensus.stories.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/PedigreeLayout.stories.tsx`

**Step 1: Read current stories**

Read both story files to understand the existing story structure.

**Step 2: Update FamilyTreeCensus.stories.tsx**

Update to use the new component architecture. Stories should demonstrate:
- QuickStartForm (empty state)
- PedigreeView with pre-populated nodes
- NodeContextMenu interaction

**Step 3: Update PedigreeLayout.stories.tsx**

Update any type references from `Edge` to `StoreEdge`.

**Step 4: Verify Storybook compiles**

Run: `pnpm typecheck`
Expected: No new errors

**Step 5: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeCensus.stories.tsx lib/interviewer/Interfaces/FamilyTreeCensus/PedigreeLayout.stories.tsx
git commit -m "docs(family-tree): update storybook stories for new architecture"
```

---

## Task 18: Integration Test — Full Flow

Write an integration test that exercises the full flow: quick-start → add relative → edit name → sync metadata.

**Files:**
- Test: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`

**Step 1: Write the integration test**

```typescript
describe('integration: full flow', () => {
  it('quick-start → add donor → edit name → sync', () => {
    const dispatched: unknown[] = [];
    const mockDispatch = (action: unknown) => {
      dispatched.push(action);
      return action;
    };
    const store = createFamilyTreeStore(
      new Map(),
      new Map(),
      mockDispatch as ReturnType<typeof useAppDispatch>,
    );

    // Quick-start: ego + 2 parents
    store.getState().generateQuickStartNetwork({
      parentCount: 2,
      siblingCount: 0,
      hasPartner: false,
      childrenWithPartnerCount: 0,
      soloChildrenCount: 0,
    });
    expect(store.getState().network.nodes.size).toBe(3);

    // Find ego
    const egoEntry = [...store.getState().network.nodes.entries()].find(
      ([_, n]) => n.isEgo,
    )!;
    const egoId = egoEntry[0];

    // Add a donor parent to ego
    const donorId = store.getState().addNode({ label: '', isEgo: false });
    store.getState().addEdge({
      source: donorId,
      target: egoId,
      type: 'parent',
      edgeType: 'donor',
    });
    expect(store.getState().network.nodes.size).toBe(4);

    // Edit the donor's name
    store.getState().updateNode(donorId, { label: 'Sperm Donor' });
    expect(store.getState().network.nodes.get(donorId)?.label).toBe('Sperm Donor');

    // Sync metadata
    store.getState().syncMetadata();
    expect(dispatched.length).toBe(1);
  });
});
```

**Step 2: Run test**

Run: `pnpm vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts
git commit -m "test(family-tree): add integration test for full flow"
```

---

## Task 19: Run Full Test Suite and Fix Issues

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 2: Run type checking**

Run: `pnpm typecheck`
Expected: No new errors

**Step 3: Run linting**

Run: `pnpm lint --fix`
Expected: No new errors

**Step 4: Run formatter**

Run: `pnpm prettier --write "lib/interviewer/Interfaces/FamilyTreeCensus/**/*.{ts,tsx}"`

**Step 5: Fix any issues found**

Address test failures, type errors, and lint issues. Create new commits for each fix.

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore(family-tree): fix lint and formatting issues"
```

---

## Task 20: Clean Up Unused Exports and Dead Code

**Step 1: Run knip to find unused code**

Run: `pnpm knip`

**Step 2: Remove any unused exports from the family tree files**

Check for:
- Old type exports no longer referenced (`Relationship`, `RelationshipToEgo`, etc.)
- Unused utility functions in `nodeUtils.ts` and `edgeUtils.ts`
- Stale re-exports

**Step 3: Commit**

```bash
git add -A
git commit -m "chore(family-tree): remove unused exports and dead code"
```

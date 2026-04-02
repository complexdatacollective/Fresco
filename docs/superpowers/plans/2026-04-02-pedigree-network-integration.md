# Pedigree Network Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Family Pedigree store use NcNode/NcEdge format and commit data to the interview network on finalization, with nomination steps operating directly on Redux.

**Architecture:** The Zustand store switches from custom NodeData/StoreEdge types to NcNode/NcEdge from `@codaco/shared-consts`. A separate NodeMetadata map tracks UI-only state (readOnly). On finalization, the store dispatches `addNode`/`addEdge` to Redux. Post-finalization, nomination reads from Redux and uses `toggleNodeAttributes`. A new `'adoptive'` edge type replaces the `adoptionStatus` node field.

**Tech Stack:** TypeScript, Zustand (with Immer), Redux Toolkit, React, NcNode/NcEdge from `@codaco/shared-consts`

**Key conventions:** path aliases (`~/`), `type` not `interface`, Prettier formatting, no direct `process.env`, no `console.log` without eslint-disable.

---

### Task 1: Add `'adoptive'` edge type to layout system

**Files:**
- Modify: `lib/pedigree-layout/types.ts:1` (ParentEdgeType)
- Modify: `lib/pedigree-layout/connectors.ts:41-43` (isPrimaryEdge)
- Modify: `lib/pedigree-layout/sugiyamaLayout.ts:41-43` (isPrimaryEdge)
- Modify: `lib/pedigree-layout/pedigreeAdapter.ts:67-80` (adoption inference)
- Modify: `lib/pedigree-layout/components/EdgeRenderer.tsx:156-165` (getAuxiliaryStyle)
- Modify: `schemas/familyPedigree.ts:15` (ParentTypeSchema)
- Test: `lib/pedigree-layout/__tests__/connectors.test.ts`

**Context:** Currently `adoptionStatus` is a top-level field on `NodeData`. An `'adoptive'` parent edge type replaces it: when a child has any `'adoptive'` edge, the layout treats their `'biological'` edges as auxiliary (positioning the child under adoptive parents).

- [ ] **Step 1: Add `'adoptive'` to `ParentEdgeType`**

In `lib/pedigree-layout/types.ts`, add `'adoptive'` to the union:

```typescript
export type ParentEdgeType = 'biological' | 'social' | 'donor' | 'surrogate' | 'adoptive';
```

In `schemas/familyPedigree.ts`, update `ParentTypeSchema`:

```typescript
const ParentTypeSchema = z.enum(['biological', 'social', 'donor', 'surrogate', 'adoptive']);
```

- [ ] **Step 2: Update `isPrimaryEdge` in both locations**

In `lib/pedigree-layout/connectors.ts:41-43`:

```typescript
function isPrimaryEdge(edgeType: ParentEdgeType): boolean {
  return edgeType === 'biological' || edgeType === 'social' || edgeType === 'adoptive';
}
```

In `lib/pedigree-layout/sugiyamaLayout.ts:41-43`:

```typescript
function isPrimaryEdge(edgeType: ParentEdgeType): boolean {
  return edgeType === 'biological' || edgeType === 'social' || edgeType === 'adoptive';
}
```

- [ ] **Step 3: Update pedigreeAdapter to infer adoption from edges**

In `lib/pedigree-layout/pedigreeAdapter.ts`, replace the adoption remapping block (lines 67-80) that checks `childNode?.adoptionStatus`. Instead, after building all parent connections, check if any child has an `'adoptive'` edge — if so, remap their `'biological'` edges to `'donor'`:

```typescript
// After the main edge loop, remap biological edges for adopted children.
// A child with any 'adoptive' parent edge has their biological edges
// treated as auxiliary so they are positioned under adoptive parents.
for (let i = 0; i < n; i++) {
  const hasAdoptiveParent = parents[i]!.some(
    (p) => p.edgeType === 'adoptive',
  );
  if (!hasAdoptiveParent) continue;
  for (const p of parents[i]!) {
    if (p.edgeType === 'biological') {
      p.edgeType = 'donor';
    }
  }
}
```

Remove the per-edge adoption check that reads `childNode?.adoptionStatus`.

- [ ] **Step 4: Update `getAuxiliaryStyle` in EdgeRenderer**

In `lib/pedigree-layout/components/EdgeRenderer.tsx`, the `getAuxiliaryStyle` switch already handles known types. `'adoptive'` is primary so it won't appear in auxiliary lines. No change needed here — but verify the `AuxiliaryConnector` edgeType union in `types.ts` doesn't need `'adoptive'` added (it shouldn't, since adoptive edges are primary).

- [ ] **Step 5: Write test for adoptive edge layout behavior**

In `lib/pedigree-layout/__tests__/connectors.test.ts`, add a test:

```typescript
it('treats adoptive edges as primary', () => {
  // Layout: adoptiveMom(0) + adoptiveDad(1) couple, bioMom(2) biological
  // child(3) has adoptive edges to couple + biological to bioMom
  const adoptiveLayout: PedigreeLayout = {
    n: [3, 1],
    nid: [
      [0, 1, 2],
      [3, 0, 0],
    ],
    pos: [
      [0, 1, 3],
      [0.5, 0, 0],
    ],
    fam: [
      [0, 0, 0],
      [1, 0, 0],
    ],
    group: [
      [1, 0, 0],
      [0, 0, 0],
    ],
    twins: null,
    groupMember: [
      [false, false, false],
      [false, false, false],
    ],
  };
  const adoptiveParents: ParentConnection[][] = [
    [],
    [],
    [],
    [
      { parentIndex: 0, edgeType: 'adoptive' },
      { parentIndex: 1, edgeType: 'adoptive' },
      { parentIndex: 2, edgeType: 'biological' },
    ],
  ];
  const connectors = computeConnectors(adoptiveLayout, scaling, adoptiveParents);
  // The parent-child connector from the couple should be 'adoptive' (primary)
  expect(connectors.parentChildLines.length).toBeGreaterThan(0);
  const pcLine = connectors.parentChildLines[0]!;
  expect(pcLine.edgeType).toBe('adoptive');
});
```

- [ ] **Step 6: Run tests and verify**

Run: `pnpm typecheck && pnpm test -- --run lib/pedigree-layout/__tests__/connectors.test.ts`

Expected: typecheck passes, new test passes, existing tests pass.

- [ ] **Step 7: Commit**

```bash
git add lib/pedigree-layout/ schemas/familyPedigree.ts
git commit -m "feat: add 'adoptive' edge type to pedigree layout system"
```

---

### Task 2: Remove `AdoptionStatus` and update store types

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/store.ts` (remove AdoptionStatus, NodeData, StoreEdge; add NcNode/NcEdge-based types)
- Modify: `lib/pedigree-layout/components/PedigreeNode.tsx` (remove AdoptionBrackets adoptionStatus dependency)
- Modify: `lib/pedigree-layout/pedigreeAdapter.ts` (remove adoptionStatus import)

**Context:** Remove the `AdoptionStatus` type and all direct references to `adoptionStatus` on nodes. The adoption bracket rendering will instead be driven by checking edges for `'adoptive'` type. This task only removes the old type — the full NcNode/NcEdge migration is Task 3.

- [ ] **Step 1: Remove `AdoptionStatus` type from store.ts**

In `lib/interviewer/Interfaces/FamilyPedigree/store.ts`, remove:

```typescript
export type AdoptionStatus = 'in' | 'out' | 'by-relative';
```

Remove `adoptionStatus?: AdoptionStatus` from `NodeData`.

- [ ] **Step 2: Update PedigreeNode to receive adoption state as a prop**

In `lib/pedigree-layout/components/PedigreeNode.tsx`, change the props to accept `isAdopted` as a boolean instead of reading `node.adoptionStatus`:

```typescript
type PedigreeNodeProps = {
  node: NodeData & { id: string };
  displayLabel: string;
  allowDrag: boolean;
  selected?: boolean;
  onClick?: () => void;
  isAdopted?: boolean;
};
```

Replace the destructuring and bracket logic:

```typescript
const wrappedNode = isAdopted ? (
  <AdoptionBrackets status="in">{nodeElement}</AdoptionBrackets>
) : (
  nodeElement
);
```

Remove the `AdoptionStatus` import. Update `AdoptionBrackets` to accept a simple boolean or keep status as `'in'` for now (the visual distinction between in/out/by-relative can be revisited later — the brackets look the same for all).

- [ ] **Step 3: Update PedigreeView to compute isAdopted from edges**

In `lib/pedigree-layout/components/PedigreeView.tsx`, in the `renderNode` callback, compute whether the node has an `'adoptive'` parent edge:

```typescript
const isAdopted = [...edges.values()].some(
  (e) =>
    e.target === node.id &&
    e.attributes[relationshipTypeVariable] === 'adoptive',
);
```

Pass `isAdopted={isAdopted}` to `PedigreeNode`.

Note: This uses the current `StoreEdge` format. It will be updated to NcEdge in Task 3.

- [ ] **Step 4: Remove adoptionStatus from syncMetadata serialization**

In `store.ts`, remove `adoptionStatus: node.adoptionStatus` from the `syncMetadata` serialization (around line 225).

- [ ] **Step 5: Update wizard transforms to produce `'adoptive'` edges instead of adoptionStatus**

In `egoCellTransform.ts`:
- Remove the `hasAdoptiveParent` check and `egoAdoptionStatus` from the return type
- When an additional parent has `role === 'adoptive-parent'`, produce an edge with `relationshipType: 'adoptive'` instead of `'social'`

In `EgoCellResult` type, remove `egoAdoptionStatus?: 'in'`.

In `FamilyPedigree.tsx`, remove the `egoAdoptionStatus` handling in the `onSubmit` callback.

- [ ] **Step 6: Update all test fixtures**

Remove `adoptionStatus` from all test fixtures in:
- `lib/interviewer/Interfaces/FamilyPedigree/__tests__/store.test.ts`
- `lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/__tests__/egoCellTransform.test.ts`
- `lib/pedigree-layout/__stories__/PedigreeLayout.stories.tsx` (update adoption stories to use `'adoptive'` edges instead)

- [ ] **Step 7: Run typecheck, lint, tests**

```bash
pnpm typecheck && pnpm lint && pnpm test -- --run
```

Fix any remaining references to `AdoptionStatus` or `adoptionStatus`.

- [ ] **Step 8: Commit**

```bash
git commit -m "refactor: replace adoptionStatus with 'adoptive' edge type"
```

---

### Task 3: Refactor store to use NcNode/NcEdge

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/store.ts` (major rewrite)
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigreeProvider.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils.ts` (add `getNodeTypeKey` selector)
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/utils/edgeUtils.ts` (add `getEdgeTypeKey` selector)

**Context:** Replace `NodeData` and `StoreEdge` with `NcNode` and `NcEdge`. All domain data lives in `attributes` keyed by protocol variable names. A separate `NodeMetadata` map tracks UI-only state.

- [ ] **Step 1: Add nodeType/edgeType selectors**

In `lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils.ts`, add:

```typescript
export const getNodeTypeKey = createSelector(getNodeConfig, (c) => c.type);
```

In `lib/interviewer/Interfaces/FamilyPedigree/utils/edgeUtils.ts`, add:

```typescript
export const getEdgeTypeKey = createSelector(getEdgeConfig, (c) => c.type);
```

- [ ] **Step 2: Expand VariableConfig**

In `store.ts`, update `VariableConfig` to include the codebook type keys:

```typescript
export type VariableConfig = {
  nodeType: string;
  edgeType: string;
  nodeLabelVariable: string;
  egoVariable: string;
  relationshipTypeVariable: string;
  isActiveVariable: string;
  isGestationalCarrierVariable: string;
};
```

- [ ] **Step 3: Replace NodeData with NcNode + NodeMetadata**

Remove the `NodeData` type. Add:

```typescript
export type NodeMetadata = {
  readOnly: boolean;
};
```

Change the store state:

```typescript
type FamilyPedigreeState = {
  step: 'scaffolding' | 'diseaseNomination';
  activeNominationVariable: string | null;
  network: {
    nodes: Map<string, NcNode>;
    edges: Map<string, NcEdge>;
  };
  nodeMetadata: Map<string, NodeMetadata>;
  /** Maps store node _uid → Redux interview network _uid after finalization.
   *  Used by resetNetwork to delete the correct Redux nodes. */
  storeToReduxIdMap: Map<string, string>;
};
```

- [ ] **Step 4: Replace StoreEdge with NcEdge**

Remove `StoreEdge` and `CommitBatchEdgeData` types. Update `CommitBatch`:

```typescript
export type CommitBatch = {
  nodes: {
    tempId: string;
    data: {
      attributes: Record<string, unknown>;
    };
  }[];
  edges: {
    source: string;
    target: string;
    data: {
      attributes: Record<string, unknown>;
    };
  }[];
};
```

The batch carries raw attribute data. The store's `commitBatch` action constructs full `NcNode`/`NcEdge` objects using the variable config's `nodeType`/`edgeType`.

- [ ] **Step 5: Rewrite store actions**

All actions now operate on `NcNode`/`NcEdge`:

`addNode`: Creates an `NcNode` with `{ _uid, type: variableConfig.nodeType, attributes }`. Sets `nodeMetadata` entry with `readOnly` based on whether `attributes[egoVariable] === true`.

`updateNode`: Merges attributes on the existing `NcNode`.

`removeNode`: Deletes node and its edges, plus the `nodeMetadata` entry.

`addEdge`: Creates an `NcEdge` with `{ _uid, type: variableConfig.edgeType, from: source, to: target, attributes }`.

`commitBatch`: Uses `variableConfig.nodeType`/`variableConfig.edgeType` to construct full `NcNode`/`NcEdge` from batch data.

`toggleNodeAttribute`: Sets `node.attributes[variable] = node.attributes[variable] !== true`.

`syncMetadata`: Serializes `NcNode[]` and `NcEdge[]` arrays from the Maps.

- [ ] **Step 6: Update FamilyPedigreeProvider**

In `FamilyPedigreeProvider.tsx`:
- Add `getNodeTypeKey` and `getEdgeTypeKey` selectors
- Build `variableConfig` with `nodeType` and `edgeType`
- Convert Redux `NcNode`/`NcEdge` to store Maps with minimal transformation (nodes already are NcNode; edges need `from`/`to` from Redux edge + attributes)
- Initialize `nodeMetadata` map (ego → readOnly: true)

The conversion is now much simpler since both sides use NcNode/NcEdge.

- [ ] **Step 7: Run typecheck**

```bash
pnpm typecheck
```

This will likely show many errors in consuming code (adapter, components, transforms, tests). That's expected — the following tasks fix those.

- [ ] **Step 8: Commit (may not compile yet)**

```bash
git commit -m "refactor: replace NodeData/StoreEdge with NcNode/NcEdge in store"
```

---

### Task 4: Update pedigree adapter layer

**Files:**
- Modify: `lib/pedigree-layout/pedigreeAdapter.ts`
- Modify: `lib/pedigree-layout/components/PedigreeLayout.tsx`

**Context:** The adapter converts store data to `PedigreeInput` for the layout algorithm. It now reads from `NcNode`/`NcEdge` using `VariableConfig` to extract relationship types, isActive, etc.

- [ ] **Step 1: Add `readEdge` helper**

In `pedigreeAdapter.ts`, add a helper that extracts typed edge properties from NcEdge attributes:

```typescript
function readEdge(
  edge: NcEdge,
  config: VariableConfig,
): {
  relationshipType: string;
  isActive: boolean;
  isGestationalCarrier: boolean;
} {
  return {
    relationshipType:
      (edge.attributes[config.relationshipTypeVariable] as string) ?? 'biological',
    isActive: edge.attributes[config.isActiveVariable] !== false,
    isGestationalCarrier:
      edge.attributes[config.isGestationalCarrierVariable] === true,
  };
}
```

- [ ] **Step 2: Update `storeToPedigreeInput`**

Change the signature to accept `NcNode`/`NcEdge` Maps plus `VariableConfig`:

```typescript
export function storeToPedigreeInput(
  nodes: Map<string, NcNode>,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): ConversionResult
```

In the edge loop, use `readEdge(edge, variableConfig)` to get `relationshipType`, `isActive`, `isGestationalCarrier`. Use `edge.from`/`edge.to` instead of `edge.source`/`edge.target`.

- [ ] **Step 3: Update `buildConnectorData`**

Change to accept `NcEdge` Maps plus `VariableConfig`:

```typescript
export function buildConnectorData(
  layout: PedigreeLayout,
  edges: Map<string, NcEdge>,
  dimensions: LayoutDimensions,
  parents: ParentConnection[][] = [],
  idToIndex?: Map<string, number>,
  nodeNames?: string[],
  variableConfig?: VariableConfig,
): ConnectorRenderData
```

Update the `activePartnerPairs` construction to read from `edge.attributes[variableConfig.relationshipTypeVariable]` and `edge.attributes[variableConfig.isActiveVariable]`.

- [ ] **Step 4: Update PedigreeLayout component**

In `lib/pedigree-layout/components/PedigreeLayout.tsx`, update the node type:

```typescript
type PedigreeLayoutNode = NcNode & { id: string };
```

Update the `storeToPedigreeInput` and `buildConnectorData` calls to pass `variableConfig`. Add `variableConfig` as a prop.

- [ ] **Step 5: Run typecheck, fix cascading issues**

```bash
pnpm typecheck
```

Fix any remaining type errors in adapter consumers.

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor: update pedigree adapter for NcNode/NcEdge"
```

---

### Task 5: Update components

**Files:**
- Modify: `lib/pedigree-layout/components/PedigreeView.tsx`
- Modify: `lib/pedigree-layout/components/PedigreeNode.tsx`
- Modify: `lib/pedigree-layout/components/NodeContextMenu.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigree.tsx`

**Context:** Components now receive NcNode/NcEdge data. PedigreeView becomes the bridge between the data source (store or Redux) and the layout. PedigreeNode reads `isEgo` from attributes via a variable name prop.

- [ ] **Step 1: Update PedigreeNode**

Change `PedigreeNodeProps` to accept `NcNode & { id: string }`:

```typescript
type PedigreeNodeProps = {
  node: NcNode & { id: string };
  displayLabel: string;
  allowDrag: boolean;
  selected?: boolean;
  onClick?: () => void;
  isEgo?: boolean;
  isAdopted?: boolean;
};
```

Read `isEgo` from props instead of `node.isEgo`. The caller (PedigreeView) computes it from `node.attributes[egoVariable]`.

- [ ] **Step 2: Update PedigreeView**

PedigreeView needs to work with both the Zustand store (during scaffolding) and Redux (during nomination). Rather than having it access both, make it accept nodes/edges/actions as props:

```typescript
type PedigreeViewProps = {
  nodes: Map<string, NcNode>;
  edges: Map<string, NcEdge>;
  nodeMetadata: Map<string, NodeMetadata>;
  variableConfig: VariableConfig;
  activeNominationVariable: string | null;
  onToggleAttribute?: (nodeId: string, variable: string) => void;
  onAddNode?: (node: NcNode) => string;
  onUpdateNode?: (id: string, updates: Partial<NcNode>) => void;
  onRemoveNode?: (id: string) => void;
  onAddEdge?: (edge: NcEdge) => string;
  onCommitBatch?: (batch: CommitBatch) => void;
};
```

This allows FamilyPedigree.tsx to pass different data sources and action handlers depending on the current mode.

Update `computeNodeDisplayLabels` to work with NcNode (read name from `node.attributes[variableConfig.nodeLabelVariable]`).

Update the `renderNode` callback to compute `isEgo` and `isAdopted` from the data and pass as props to PedigreeNode.

- [ ] **Step 3: Update NodeContextMenu**

Add a `readOnly` prop. When true, render only the node trigger without the menu:

```typescript
type NodeContextMenuProps = {
  isBiological: boolean;
  isEgo: boolean;
  readOnly?: boolean;
  onAction: (action: NodeContextMenuAction) => void;
  children: ReactElement;
};
```

When `readOnly` is true, render just `{children}` without the Menu wrapper.

- [ ] **Step 4: Update FamilyPedigree.tsx**

Update the component to:
- Build `variableConfig` with `nodeType` and `edgeType`
- Pass the correct data source to PedigreeView based on `isNetworkCommitted` and `currentStepIndex`
- During scaffolding (not committed): pass store data + store actions
- During scaffolding (committed, read-only): pass store data + no actions + readOnly metadata
- During nomination: pass Redux data + toggleNodeAttributes dispatch

- [ ] **Step 5: Run typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor: update components for NcNode/NcEdge data model"
```

---

### Task 6: Update wizard transforms

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/egoCellTransform.ts`
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/childCellTransform.ts`
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/siblingCellTransform.ts`
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/components/wizards/AddParentWizard.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/components/wizards/AddChildWizard.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/components/wizards/AddSiblingWizard.tsx`

**Context:** All transforms produce `CommitBatch` data. The batch now carries `attributes` dicts that use protocol variable names. Relationship type, isActive, isGestationalCarrier go into `edge.data.attributes` instead of being top-level fields.

- [ ] **Step 1: Update `buildBioParent` in egoCellTransform**

Instead of producing `NodeData` with a flat `attributes` dict plus top-level `relationshipType`/`isGestationalCarrier`, produce batch entries where:
- Node `data.attributes` contains `{ [nodeLabelVariable]: name, ...extraAttrs }`
- Edge `data.attributes` contains `{ [relationshipTypeVariable]: type, [isActiveVariable]: true, [isGestationalCarrierVariable]: gc }`

- [ ] **Step 2: Update `buildAdditionalParent` in egoCellTransform**

When `role === 'adoptive-parent'`, set `edge.data.attributes[relationshipTypeVariable] = 'adoptive'` instead of `'social'`.

- [ ] **Step 3: Update partnership and child edge construction**

All edges in the batch carry attributes via the variable config keys. Partner edges: `{ [relationshipTypeVariable]: 'partner', [isActiveVariable]: isActive }`.

- [ ] **Step 4: Update childCellTransform and siblingCellTransform**

Same pattern: edge attributes go into `data.attributes` using variable config keys. Node attributes go into `data.attributes` with the label variable.

- [ ] **Step 5: Update wizard entry points**

`AddParentWizard.tsx`, `AddChildWizard.tsx`, `AddSiblingWizard.tsx` — these call the transform functions and may construct edge data directly. Update to use attribute-based format.

- [ ] **Step 6: Update transform tests**

Update expected output in:
- `__tests__/egoCellTransform.test.ts`
- `__tests__/childCellTransform.test.ts`
- `__tests__/siblingCellTransform.test.ts`

- [ ] **Step 7: Run tests**

```bash
pnpm typecheck && pnpm test -- --run
```

- [ ] **Step 8: Commit**

```bash
git commit -m "refactor: update wizard transforms for NcNode/NcEdge batch format"
```

---

### Task 7: Implement finalization flow

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/store.ts` (add `finalizeNetwork` action)
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigree.tsx` (finalization logic)

**Context:** When the user clicks "Continue" after scaffolding and confirms, the store data is committed to the interview network via Redux `addNode`/`addEdge` actions. Stage metadata is updated. The pedigree view switches to reading from Redux.

- [ ] **Step 1: Add `finalizeNetwork` action to store**

This action:
1. Iterates all nodes in the store, dispatches `addNode` to Redux for each
2. Stores the `_uid` mapping (store ID → Redux ID)
3. Iterates all edges, dispatches `addEdge` with mapped `from`/`to` IDs
4. Sets all `nodeMetadata` entries to `readOnly: true`
5. Calls `syncMetadata` to persist the store snapshot

```typescript
finalizeNetwork: async () => {
  const { nodes, edges } = get().network;
  const idMap = new Map<string, string>();

  for (const [storeId, node] of nodes) {
    const result = await dispatch!(
      addNodeAction({
        type: variableConfig.nodeType,
        attributeData: { ...node.attributes },
        allowUnknownAttributes: true,
      }),
    );
    const reduxId = (result.payload as { modelData: { _uid: string } })
      .modelData._uid;
    idMap.set(storeId, reduxId);
  }

  for (const [, edge] of edges) {
    const from = idMap.get(edge.from) ?? edge.from;
    const to = idMap.get(edge.to) ?? edge.to;
    await dispatch!(
      addEdgeAction({
        type: variableConfig.edgeType,
        from,
        to,
        attributeData: { ...edge.attributes },
      }),
    );
  }

  set((state) => {
    state.storeToReduxIdMap = idMap;
    for (const id of state.nodeMetadata.keys()) {
      state.nodeMetadata.get(id)!.readOnly = true;
    }
  });

  get().syncMetadata();
};
```

Note: Import `addNode` and `addEdge` from `~/lib/interviewer/ducks/modules/session` — rename them to avoid clashing with store's own `addNode`.

- [ ] **Step 2: Wire up finalization in FamilyPedigree.tsx**

In `handleConfirmAndAdvance`:

```typescript
if (result === true) {
  await finalizeNetwork();
  dispatch(updateStageMetadata({ isNetworkCommitted: true }));
  setCurrentStepIndex(1);
  updateNominationVariable(1);
}
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: implement finalization flow committing store to interview network"
```

---

### Task 8: Implement nomination using Redux

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigree.tsx`
- Modify: `lib/pedigree-layout/components/PedigreeView.tsx`

**Context:** Post-finalization, nomination prompts read from the interview network (Redux) and use `toggleNodeAttributes` for click-to-toggle. The Sociogram pattern is the reference implementation.

- [ ] **Step 1: Build Redux data source in FamilyPedigree.tsx**

When `isNetworkCommitted && currentStepIndex > 0`:
- Read nodes from `getNetworkNodes` selector (already imported)
- Read edges from `getNetworkEdges` selector (already imported)
- Convert to `Map<string, NcNode>` and `Map<string, NcEdge>` for PedigreeView
- Pass `onToggleAttribute` that dispatches `toggleNodeAttributes`:

```typescript
const handleToggleAttribute = (nodeId: string, variable: string) => {
  const node = allNodes.find((n) => n._uid === nodeId);
  const currentValue = node?.attributes[variable] === true;
  dispatch(
    toggleNodeAttributes({
      nodeId,
      attributes: { [variable]: !currentValue },
    }),
  );
};
```

- [ ] **Step 2: Pass Redux data to PedigreeView during nomination**

```typescript
{isNetworkCommitted && currentStepIndex > 0 ? (
  <PedigreeView
    nodes={reduxNodesMap}
    edges={reduxEdgesMap}
    nodeMetadata={readOnlyMetadata}
    variableConfig={variableConfig}
    activeNominationVariable={allPrompts[currentStepIndex]?.variable ?? null}
    onToggleAttribute={handleToggleAttribute}
  />
) : (
  <PedigreeView
    nodes={storeNodes}
    edges={storeEdges}
    nodeMetadata={storeMetadata}
    variableConfig={variableConfig}
    activeNominationVariable={null}
    onAddNode={addNode}
    /* ... other store actions */
  />
)}
```

- [ ] **Step 3: Remove `toggleNodeAttribute` from store**

The store's `toggleNodeAttribute` action is no longer needed. During scaffolding, attribute edits go through `updateNode`. During nomination, `toggleNodeAttributes` goes to Redux. Remove the action from the store.

- [ ] **Step 4: Run typecheck and test**

```bash
pnpm typecheck && pnpm test -- --run
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: implement nomination using Redux toggleNodeAttributes"
```

---

### Task 9: Implement reset flow

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigree.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/store.ts`

**Context:** When viewing a finalized pedigree in read-only mode (prompt 1), the user can click "Reset". This deletes all committed nodes/edges from the interview network, clears the store, and returns to the empty scaffolding state.

- [ ] **Step 1: Add `resetNetwork` action to store**

This action:
1. Iterates all nodes in the store (which are the ones that were committed)
2. For each, finds the corresponding interview network node by matching attributes or stored mapping
3. Dispatches `deleteNode` to Redux for each
4. Clears the store network and metadata
5. Updates stage metadata to `isNetworkCommitted: false`

```typescript
resetNetwork: () => {
  const { storeToReduxIdMap } = get();

  // Delete from interview network — deleteNode cascade-deletes edges
  for (const reduxId of storeToReduxIdMap.values()) {
    dispatch!(deleteNodeAction(reduxId));
  }

  // Clear store
  set((state) => {
    state.network.nodes.clear();
    state.network.edges.clear();
    state.nodeMetadata.clear();
    state.storeToReduxIdMap.clear();
    state.step = 'scaffolding';
    state.activeNominationVariable = null;
  });

  dispatch!(updateStageMetadata({ isNetworkCommitted: false }));
};
```

The `storeToReduxIdMap` was populated during finalization (Task 7) and persisted via `syncMetadata`. On reset, we iterate its values (Redux `_uid`s) and dispatch `deleteNode` for each.

- [ ] **Step 2: Wire up reset in FamilyPedigree.tsx**

In `handleResetPedigree`:

```typescript
const handleResetPedigree = async () => {
  await confirm({
    title: 'Reset family pedigree?',
    description:
      'This will delete all family members and relationships. This action cannot be undone.',
    confirmLabel: 'Reset',
    cancelLabel: 'Cancel',
    intent: 'destructive',
    onConfirm: () => {
      resetNetwork();
    },
  });
};
```

- [ ] **Step 3: Run typecheck and test**

```bash
pnpm typecheck && pnpm test -- --run
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: implement reset flow deleting committed nodes from interview network"
```

---

### Task 10: Update tests and stories

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/__tests__/store.test.ts`
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/__tests__/commitBatch.test.ts`
- Modify: `lib/pedigree-layout/__tests__/pedigreeAdapter.test.ts`
- Modify: `lib/pedigree-layout/__tests__/PedigreeLayout.test.tsx`
- Modify: `lib/pedigree-layout/__stories__/PedigreeLayout.stories.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigree.stories.tsx`

**Context:** All test fixtures and stories need to use `NcNode`/`NcEdge` format. Store tests need to verify the new finalization and reset actions. Adapter tests need to pass `VariableConfig`.

- [ ] **Step 1: Update store tests**

Convert all `NodeData`/`StoreEdge` fixtures to `NcNode`/`NcEdge`. Update `VariableConfig` fixtures to include `nodeType` and `edgeType`. Add tests for:
- `finalizeNetwork` dispatches correct Redux actions
- `resetNetwork` clears store and dispatches deletions
- `nodeMetadata` readOnly behavior

- [ ] **Step 2: Update adapter tests**

In `pedigreeAdapter.test.ts`, convert `makeNodes` and `makeEdges` helpers to produce `NcNode`/`NcEdge`. Pass `variableConfig` to `storeToPedigreeInput`.

- [ ] **Step 3: Update layout tests and stories**

In `PedigreeLayout.test.tsx` and `PedigreeLayout.stories.tsx`, update the `buildNetwork` helper and all node/edge fixtures to use `NcNode`/`NcEdge` format.

- [ ] **Step 4: Update FamilyPedigree stories**

Update the story data to use `NcNode`/`NcEdge`. Verify the Default story still renders correctly. Update any play functions that reference old field names.

- [ ] **Step 5: Run full test suite**

```bash
pnpm typecheck && pnpm lint && pnpm test -- --run
```

- [ ] **Step 6: Run knip**

```bash
pnpm knip
```

Remove any newly-unused exports.

- [ ] **Step 7: Final commit**

```bash
git commit -m "test: update all tests and stories for NcNode/NcEdge format"
```

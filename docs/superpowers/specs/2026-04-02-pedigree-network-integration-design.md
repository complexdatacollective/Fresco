# Pedigree Network Integration Design

## Goal

Make the Family Pedigree store use the interview network format (`NcNode`/`NcEdge`) and commit data to the interview network on finalization. After finalization, nomination steps operate directly on the interview network using existing Redux actions (`toggleNodeAttributes`).

## Current State

The pedigree interface operates an isolated Zustand store with its own types (`NodeData`, `StoreEdge`). It never writes to `session.network`. `syncMetadata()` writes a rendering snapshot to `stageMetadata` for persistence, but this is not the interview network.

## Architecture

### Store Data Model

Replace `NodeData` and `StoreEdge` with `NcNode` and `NcEdge` as the canonical store types.

**Nodes (`Map<string, NcNode>`):**

All domain data lives in `NcNode.attributes` keyed by protocol variable names:
- `attributes[egoVariable]` — boolean, replaces `isEgo` top-level field
- `attributes[nodeLabelVariable]` — string, the node's name (already here)
- Protocol form fields — already in `attributes`

Derived/computed properties (not stored):
- `isBioRelative` — computed from edges at render time
- `adoptionStatus` — inferred from presence of `'adoptive'` edge type (see below)

UI-only metadata stored outside `NcNode` in a separate `Map<string, NodeMetadata>`:
- `readOnly: boolean` — prevents deletion (ego, committed nodes)

Each `NcNode` also has `type` (the codebook node type from `nodeConfig.type`) and `_uid`.

**Edges (`Map<string, NcEdge>`):**

All edge data lives in `NcEdge.attributes` keyed by protocol variable names:
- `attributes[relationshipTypeVariable]` — `'biological' | 'social' | 'donor' | 'surrogate' | 'adoptive' | 'partner'`
- `attributes[isActiveVariable]` — boolean
- `attributes[isGestationalCarrierVariable]` — boolean

Each `NcEdge` also has `type` (the codebook edge type from `edgeConfig.type`), `from`, `to`, `_uid`.

### New Edge Type: `'adoptive'`

Replaces the `adoptionStatus` field on nodes. An `'adoptive'` edge is a primary edge type (child is positioned under these parents). When a child has any `'adoptive'` parent edge, the layout treats their `'biological'` edges as auxiliary.

Changes:
- `ParentEdgeType` gains `'adoptive'`
- `isPrimaryEdge()` returns true for `'adoptive'`
- `pedigreeAdapter.ts` — instead of checking `childNode.adoptionStatus`, check if the child has any `'adoptive'` edge. If so, remap `'biological'` edges to `'donor'` for layout positioning.
- `AdoptionStatus` type and all references removed
- Wizard transforms produce `'adoptive'` edges instead of setting `adoptionStatus`
- `AdoptionBrackets` rendering: check if the node has any `'adoptive'` parent edge (adopted-in) or any `'adoptive'` child edge where the child is ego (adopted-out). For by-relative, this is already handled by the adoptive parent being a biological relative.

### Adapter Layer

`pedigreeAdapter.ts` already converts the store format to `PedigreeInput` for the layout algorithm. It will now convert from `NcNode`/`NcEdge` instead of `NodeData`/`StoreEdge`. The layout algorithm itself does not change — it still receives `PedigreeInput` with `ParentConnection[]`, etc.

A helper function extracts edge properties from `NcEdge.attributes` using the variable config:

```
function readEdge(edge: NcEdge, config: VariableConfig): {
  relationshipType: string;
  isActive: boolean;
  isGestationalCarrier: boolean;
}
```

This keeps variable-name awareness contained in the adapter, not spread through the layout code.

### Store Actions

The store actions (`addNode`, `updateNode`, `addEdge`, etc.) operate on `NcNode`/`NcEdge` directly. The variable config is available to the store (already passed at creation time) so actions can read/write the correct attribute keys.

`toggleNodeAttribute` is replaced by direct attribute mutation on the store's `NcNode` during scaffolding. After finalization, the Redux `toggleNodeAttributes` action is used instead.

### Finalization Flow

When the user clicks "Continue" after scaffolding and confirms:

1. **Validate** the pedigree completeness (existing logic)
2. **Commit** to interview network:
   - For each node in the store: dispatch `addNode({ type: nodeConfig.type, attributeData: node.attributes })`
   - Store the returned `_uid` mapping (store ID → interview network ID)
   - For each edge: dispatch `addEdge({ from, to, type: edgeConfig.type, attributeData: edge.attributes })`
3. **Set stage metadata**: `isNetworkCommitted: true` plus the store snapshot for persistence/reload
4. **Advance** to the first nomination prompt

### Nomination Steps (Post-Finalization)

After finalization, the pedigree view switches data source:
- **Nodes/edges**: read from the interview network (`getNetworkNodes`, `getNetworkEdges` selectors) instead of the Zustand store
- **Node clicks**: dispatch `toggleNodeAttributes({ nodeId, attributes: { [variable]: !currentValue } })` — same pattern as Sociogram
- **Layout**: the pedigree layout component receives interview network data, adapted through the same `pedigreeAdapter`

The Zustand store is still alive (for the snapshot in stageMetadata and for reset), but the view reads from Redux.

### Revisiting the Stage

When returning to a finalized stage:

- **Prompt 1 (scaffolding)**: shows the pedigree in read-only mode (all nodes have `readOnly: true`). Context menu actions are hidden. A "Reset" button is visible.
- **Prompt 2+ (nomination)**: shows the pedigree with click-to-toggle, reading from the interview network.

**Reset flow:**
1. Warn the user that all family members and relationships will be deleted
2. For each node in the store snapshot: dispatch `deleteNode(interviewNetworkId)` to remove from interview network
3. Clear the Zustand store
4. Set `isNetworkCommitted: false` in stage metadata
5. Return to the empty scaffolding state

### `syncMetadata` Changes

`syncMetadata` continues to serialize the store state into `stageMetadata` for persistence across page reloads. Since the store now holds `NcNode`/`NcEdge`, the serialization is straightforward — store the Maps as arrays. On reload, `FamilyPedigreeProvider` reconstructs the store from the metadata if `isNetworkCommitted` is true.

### NodeMetadata Map

A separate `Map<string, NodeMetadata>` in the store tracks UI-only state:

```
type NodeMetadata = {
  readOnly: boolean;
};
```

This is not committed to the interview network. It's derived:
- Ego nodes: always `readOnly: true`
- After finalization: all nodes become `readOnly: true` (no structural changes allowed)

### Files Changed

**Core types:**
- `store.ts` — Replace `NodeData`/`StoreEdge` with `NcNode`/`NcEdge`, add `NodeMetadata`, add finalization actions
- `types.ts` — Add `'adoptive'` to `ParentEdgeType`

**Provider/initialization:**
- `FamilyPedigreeProvider.tsx` — Simplified: store already holds `NcNode`/`NcEdge`, minimal conversion needed from Redux

**Adapter:**
- `pedigreeAdapter.ts` — Convert from `NcNode`/`NcEdge` using variable config instead of `NodeData`/`StoreEdge`

**Layout:**
- `connectors.ts` — Add `'adoptive'` to `isPrimaryEdge()`
- `EdgeRenderer.tsx` — Handle `'adoptive'` in auxiliary styling (if needed)

**Components:**
- `FamilyPedigree.tsx` — Finalization logic, data source switching between store and Redux
- `PedigreeView.tsx` — Accept nodes/edges as props (either source), remove direct store access for nomination
- `PedigreeNode.tsx` — Read `isEgo` from attributes, derive `adoptionStatus` from edges
- `NodeContextMenu.tsx` — Respect read-only state

**Wizards/transforms:**
- All transforms produce `NcNode`/`NcEdge` compatible data
- `egoCellTransform.ts` — Produce `'adoptive'` edges instead of `adoptionStatus`
- Remove `AdoptionStatus` type

**Tests:**
- Update all fixtures to use `NcNode`/`NcEdge` format
- Add finalization/reset tests

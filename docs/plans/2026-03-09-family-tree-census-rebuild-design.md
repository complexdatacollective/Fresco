# FamilyTreeCensus Interface Rebuild Design

## Problem

The current FamilyTreeCensus interface has several structural issues:

1. **Heteronormative scaffolding**: The guided questionnaire uses gendered kinship terms ("brother", "sister", "maternal aunt") and assumes exactly two biological parents per person.
2. **Adapter layer mismatch**: The store uses its own `Relationship` type which must be translated to `ParentEdgeType` by an adapter, introducing bugs and indirection.
3. **Three-step friction**: Scaffolding, naming, and disease nomination are separate steps. The naming step forces users to click through every placeholder node sequentially.
4. **No edge type differentiation**: All parent edges are implicitly `social-parent`. There's no way to specify donor, surrogate, or bio-parent relationships during tree construction.

## Design Decisions

- **Hybrid scaffolding** — minimal quick-start form for the common case (parents, siblings, partner, children), then contextual node-tap UI for everything else
- **Edge types chosen at creation time** — when adding a parent, the user always picks the role (social-parent, bio-parent, donor, surrogate, co-parent)
- **Store uses `ParentEdgeType` directly** — no semantic translation layer
- **Scaffolding and naming merged** — adding a person includes naming them immediately
- **Clean break** from current protocol config — new stage schema, no backward compatibility

## Store & Data Model

### Edge Types

The store uses `ParentEdgeType` from the pedigree layout library directly:

```typescript
// From lib/pedigree-layout/types.ts (unchanged)
type ParentEdgeType = 'social-parent' | 'bio-parent' | 'donor' | 'surrogate' | 'co-parent';
```

### Store Edge Shape

```typescript
type StoreEdge = {
  source: string;
  target: string;
} & (
  | { type: 'parent'; edgeType: ParentEdgeType }
  | { type: 'partner'; current: boolean }
);
```

An edge is either a parent-type edge (with a `ParentEdgeType` role) or a partner edge (with a current/ex flag). This replaces the current `Relationship` union type.

### Store State

```typescript
type FamilyTreeState = {
  step: 'scaffolding' | 'diseaseNomination';
  network: {
    nodes: Map<string, NodeData>;
    edges: Map<string, StoreEdge>;
  };
};
```

### Adapter Elimination

`storeToPedigreeInput` becomes a thin structural conversion — `Map` → array reshaping with no semantic translation. `ParentEdgeType` passes straight through to `PedigreeInput.parents[].edgeType`.

## Quick-Start Flow

### Trigger

First load of the stage when no nodes exist yet.

### UI

An inline form panel replaces the pedigree area entirely. The pedigree is not shown until the quick-start is complete.

### Questions

1. "How many parents do you have?" — number stepper (0–∞)
2. "How many siblings do you have?" — number stepper (0–∞)
3. "Do you have a partner?" — yes/no toggle; if yes: "How many children together?" — number stepper
4. "Do you have children from another relationship?" — number stepper (0–∞)

### On Submit

The store generates:

- Ego node
- N parent nodes (unnamed, linked as `social-parent`)
- Partner group between all parents (if >1)
- N sibling nodes (unnamed, linked to same parents as ego)
- Partner node (if applicable, with partner edge to ego)
- N children with partner (unnamed, linked to ego + partner as `social-parent`)
- N solo children (unnamed, linked to ego only as `social-parent`)

If the user skips (all zeros), just ego is created.

All placeholder nodes start unnamed. The user names them via the contextual menu during scaffolding.

## Contextual "Add Person" UI

### Interaction

User taps a node in the pedigree. A contextual menu appears anchored to that node:

- **"Add parent"** → role picker (social-parent / bio-parent / donor / surrogate / co-parent)
- **"Add child"** → if the person has partners: "With which partner?"
- **"Add partner"** → "Current or ex partner?"
- **"Add sibling"** → available if the person has at least one parent (creates child of same parents); if person has multiple parent groups: "Which parents do they share?"

### Follow-Up Questions

- Adding a **donor/surrogate** for a child → "Who are [child]'s social parents?" (if none exist)
- Adding a **child** of a person with multiple partners → "With which partner?"
- Adding a **partner** → "Current or ex partner?"
- Adding a **sibling** when person has multiple parent groups → "Which parents do they share?"

Conditional fields use the existing `FieldGroup` / form hooks pattern.

### Name Input

Every addition requires a name via a custom `NameInput` component with a "Don't know" toggle switch. When toggled on, the text input is disabled and the node displays a generic label (e.g., "Parent 1"). The toggle can be flipped later to add a name.

### Editing Existing Nodes

Tapping an already-placed node also shows:

- **"Edit name"** — opens the `NameInput` with don't-know toggle
- **"Change role"** — for parent edges, change the edge type

### Node Removal

Handled via the existing drag-to-bin system. No delete button in the contextual menu.

## Stage Configuration

Clean break from the current protocol schema. Defined as a Zod schema:

```typescript
import { z } from 'zod';

const FamilyTreeCensusStageSchema = z.object({
  id: z.string(),
  type: z.literal('FamilyTreeCensus'),

  quickStart: z.object({
    enabled: z.boolean(),
    prompt: z.string(),
  }),

  diseaseNomination: z.array(z.object({
    prompt: z.string(),
    variable: z.string(),
  })).optional(),

  variables: z.object({
    nodeName: z.string(),
    nodeParentEdgeType: z.string(),
  }),

  edgeType: z.object({ type: z.string() }),
  subject: z.object({ type: z.string() }),
});

type FamilyTreeCensusStage = z.infer<typeof FamilyTreeCensusStageSchema>;
```

### Removed from Current Config

- `scaffoldingStep` / `nameGenerationStep` — replaced by `quickStart`
- `egoSexVariable` / `nodeSexVariable` — sex/gender set per-node during interaction
- `relationshipToEgoVariable` — kinship derived from graph structure
- `showQuickStartModal` — replaced by `quickStart.enabled`

## Component Architecture

### New Components

| Component | Purpose |
|-----------|---------|
| `FamilyTreeCensus.tsx` | Stage orchestrator. Two phases: scaffolding → disease nomination |
| `FamilyTreeProvider.tsx` | Creates Zustand store, hydrates from Redux metadata |
| `QuickStartForm.tsx` | Inline form shown instead of pedigree when no nodes exist |
| `PedigreeView.tsx` | Main scaffolding view: pedigree layout + node tap handling |
| `NodeContextMenu.tsx` | Anchored popover on node tap with add/edit options |
| `AddPersonForm.tsx` | Follow-up form for role picker, partner picker, name input |
| `NameInput.tsx` | Custom text input with "Don't know" toggle switch |
| `PedigreeLayout.tsx` | Pure rendering: layout algorithm + positioned nodes + SVG connectors |
| `EdgeRenderer.tsx` | SVG connector rendering (already updated for inclusive types) |
| `FamilyTreeNode.tsx` | Individual node rendering |

### Deleted Files

| File | Replacement |
|------|-------------|
| `CensusForm.tsx` | `QuickStartForm.tsx` |
| `AddFamilyMemberForm.tsx` | `NodeContextMenu.tsx` + `AddPersonForm.tsx` |
| `FamilyTreeNodeForm.tsx` | Naming merged into `AddPersonForm.tsx` |
| `FamilyTreeShells.tsx` | Routing absorbed into `FamilyTreeCensus.tsx` |
| `pedigreeAdapter.ts` | Thin utility function (Map → array conversion) |
| `useDynamicFields.tsx` | Replaced by contextual menu logic |
| `useRelatives.ts` | Replaced by graph-aware contextual menu |
| `relationFlagsUtils.ts` | Replaced by graph-aware contextual menu |

## Data Flow

```
Stage loads
    ↓
FamilyTreeProvider (hydrate from Redux metadata)
    ↓
Has nodes? ─── No ──→ QuickStartForm (inline, replaces pedigree)
    │                        ↓ on submit
    │                  Store generates placeholder nodes/edges
    │                        ↓
    Yes ──────────────→ PedigreeView
                             ↓
                        Tap node → NodeContextMenu
                             ↓
                        AddPersonForm (role, follow-ups, name)
                             ↓
                        Store.addNode() / Store.addEdge()
                             ↓
                        PedigreeLayout re-renders
                             ↓
                        Layout pipeline:
                          store.nodes/edges (Maps)
                          → structural conversion (Map→array)
                          → alignPedigree()
                          → positions + connectors
                             ↓
                        User advances stage
                             ↓
                        syncMetadata() → Redux
                             ↓
                        Disease nomination (if configured)
                             ↓
                        Complete
```

## Visual Style Reference

Per the inclusive pedigree layout design:

| Edge Type | Line Style | Weight | Opacity |
|-----------|-----------|--------|---------|
| `social-parent` | solid | 5px | 1.0 |
| `co-parent` | solid | 5px | 1.0 |
| `bio-parent` | dashed | 3px | 0.8 |
| `donor` | dotted | 2px | 0.6 |
| `surrogate` | dotted | 2px | 0.6 |
| `partner` | solid double | 5px | 1.0 |
| parent group bar | solid single | 5px | 1.0 |

# Simplified Connector Rendering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify pedigree edge types to `parent`/`donor`/`surrogate`, render connectors based on partner structure, compute bio-relative flags, and add a "Known Bio Parent" storybook example.

**Architecture:** Replace `social-parent`/`bio-parent`/`co-parent` with a single `parent` edge type carrying a `biological` flag. Rename partner `current` to `active`. Rendering is driven by partner structure: partner parents get horizontal lines, non-partner parents with partnered co-parents get dashed auxiliary treatment, otherwise solid diagonal joins. Bio-relative computation traverses genetic edges from ego.

**Tech Stack:** TypeScript, React, Vitest, Zustand, Zod

**Design doc:** `docs/plans/2026-03-10-simplified-connectors-design.md`

---

### Task 1: Update `ParentEdgeType` and `ParentConnection` in types

**Files:**
- Modify: `lib/pedigree-layout/types.ts`

**Step 1: Update `ParentEdgeType`**

Replace:
```typescript
export type ParentEdgeType =
  | 'social-parent'
  | 'bio-parent'
  | 'donor'
  | 'surrogate'
  | 'co-parent';
```

With:
```typescript
export type ParentEdgeType = 'parent' | 'donor' | 'surrogate';
```

**Step 2: Add `biological` to `ParentConnection`**

Replace:
```typescript
export type ParentConnection = {
  parentIndex: number;
  edgeType: ParentEdgeType;
};
```

With:
```typescript
export type ParentConnection = {
  parentIndex: number;
  edgeType: ParentEdgeType;
  biological?: boolean; // defaults to true. Only meaningful for 'parent' edges.
};
```

**Step 3: Rename `current` to `active` on `PartnerConnection`**

In the `PartnerConnection` type (added in previous work):
```typescript
export type PartnerConnection = {
  partnerIndex1: number;
  partnerIndex2: number;
  active: boolean;
};
```

**Step 4: Update `ParentGroupConnector`**

Remove `current` and `partner` since we no longer distinguish partner vs co-parent at the group line level, and there are no double lines. The group line is now always a single line between partner parents:

```typescript
export type ParentGroupConnector = {
  type: 'parent-group';
  segment: LineSegment;
  double: boolean;
  doubleSegment?: LineSegment;
};
```

**Step 5: Update `AuxiliaryConnector` edgeType**

Replace:
```typescript
export type AuxiliaryConnector = {
  type: 'auxiliary';
  edgeType: 'donor' | 'surrogate' | 'bio-parent';
  segment: LineSegment;
};
```

With:
```typescript
export type AuxiliaryConnector = {
  type: 'auxiliary';
  edgeType: 'donor' | 'surrogate' | 'unpartnered-parent';
  segment: LineSegment;
};
```

The `unpartnered-parent` value replaces `bio-parent` — it's rendered with the same dashed style but is determined by structure (no partner edge) rather than edge type.

**Step 6: Run typecheck to see all breakages**

Run: `pnpm typecheck 2>&1 | head -80`

Expected: Many errors. Do NOT fix them yet — later tasks address each file.

**Step 7: Commit**

```
refactor: simplify ParentEdgeType to parent/donor/surrogate
```

---

### Task 2: Update `StoreEdge` and store actions

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts`

**Step 1: Update `StoreEdge` partner variant**

Replace `current: boolean` with `active: boolean`:
```typescript
export type StoreEdge = {
  source: string;
  target: string;
} & (
  | { type: 'parent'; edgeType: ParentEdgeType; biological?: boolean }
  | { type: 'partner'; active: boolean }
);
```

**Step 2: Update `ParentDetail` type**

The `edgeType` field stays but now uses the new `ParentEdgeType`. Add `biological`:
```typescript
export type ParentDetail = PersonDetail & {
  nameKnown: boolean;
  edgeType: ParentEdgeType;
  biological?: boolean;
};
```

**Step 3: Update all `current: true` → `active: true` in store actions**

In the `applyQuickStart` action, change all partner edge creation:
```typescript
type: 'partner',
active: true,
```

**Step 4: Update all `edgeType: 'social-parent'` → `edgeType: 'parent'`**

Search and replace within store.ts:
- `'social-parent'` → `'parent'`
- `'bio-parent'` → `'parent'` (with `biological: true` where appropriate)
- `'co-parent'` → `'parent'`

For the `applyQuickStart` action specifically:
- Parent edges from the parents list: use `edgeType: parent.edgeType` (already correct, types constrain it)
- Bio-parent nodes: `edgeType: 'parent', biological: true`
- Children with partner: `edgeType: 'parent'` (biological defaults to true)
- Other children: `edgeType: 'parent'`

**Step 5: Commit**

```
refactor: update StoreEdge and store actions for simplified edge types
```

---

### Task 3: Update Zod schema in session.ts

**Files:**
- Modify: `lib/interviewer/ducks/modules/session.ts`

**Step 1: Update the edge Zod schema**

Replace:
```typescript
z.enum(['social-parent', 'bio-parent', 'donor', 'surrogate', 'co-parent'])
```

With:
```typescript
z.enum(['parent', 'donor', 'surrogate'])
```

Replace `current: z.boolean()` with `active: z.boolean()` in the partner variant.

**Step 2: Commit**

```
refactor: update Zod edge schema for simplified edge types
```

---

### Task 4: Update field options and wizard components

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/fieldOptions.ts`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ParentsDetailStep.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/BioParentsStep.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/QuickStartForm.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/AddPersonForm.tsx`

**Step 1: Update `PARENT_EDGE_TYPE_OPTIONS` in fieldOptions.ts**

```typescript
export const PARENT_EDGE_TYPE_OPTIONS: {
  value: ParentEdgeType;
  label: string;
}[] = [
  { value: 'parent', label: 'Parent' },
  { value: 'donor', label: 'Sperm/Egg Donor' },
  { value: 'surrogate', label: 'Surrogate Carrier' },
];
```

**Step 2: Update ParentsDetailStep.tsx**

The bio toggle should set `biological` instead of switching edge types:

```typescript
// Replace the NON_BIO_EDGE_TYPE_OPTIONS filter (remove it entirely)

// Update default edgeType in initial state:
edgeType: existing?.[i]?.edgeType ?? 'parent',
biological: existing?.[i]?.biological ?? true,

// Update the bio toggle onChange:
<UnconnectedField
  name={`parent-${i}-isBioParent`}
  label="This is my biological parent"
  component={ToggleField}
  value={parent.biological !== false}
  onChange={(v) => {
    updateParent(i, { biological: v ?? true });
  }}
/>

// Remove the conditional RadioGroupField for non-bio edge types
// (no longer needed since there's only 'parent' for custodial parents)
```

**Step 3: Update BioParentsStep.tsx**

Replace the filter `p.edgeType === 'bio-parent'` with `p.biological !== false`:
```typescript
const bioParentCount = parents.filter(
  (p) => p.biological !== false,
).length;
```

**Step 4: Update QuickStartForm.tsx skip logic**

Replace:
```typescript
parents.filter((p) => p.edgeType === 'bio-parent').length >= 2
```

With:
```typescript
parents.filter((p) => p.biological !== false).length >= 2
```

**Step 5: Update AddPersonForm.tsx default**

Replace `initialValue="social-parent"` with `initialValue="parent"`.

**Step 6: Commit**

```
refactor: update wizard components for simplified edge types
```

---

### Task 5: Update FamilyTreeProvider and PedigreeView

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeView.tsx`

**Step 1: Update `mapReduxEdgeToStoreEdge` in FamilyTreeProvider.tsx**

```typescript
function mapReduxEdgeToStoreEdge(
  relationship: string,
  source: string,
  target: string,
): StoreEdge {
  switch (relationship) {
    case 'donor':
      return { source, target, type: 'parent', edgeType: 'donor' };
    case 'surrogate':
      return { source, target, type: 'parent', edgeType: 'surrogate' };
    case 'partner':
      return { source, target, type: 'partner', active: true };
    case 'bio-parent':
      return {
        source,
        target,
        type: 'parent',
        edgeType: 'parent',
        biological: true,
      };
    case 'parent':
    case 'social-parent':
    default:
      return { source, target, type: 'parent', edgeType: 'parent' };
  }
}
```

**Step 2: Update PedigreeView.tsx defaults**

Replace all `edgeType: 'social-parent'` with `edgeType: 'parent'`.

**Step 3: Commit**

```
refactor: update FamilyTreeProvider and PedigreeView for simplified edge types
```

---

### Task 6: Update `alignPedigree.ts` auxiliary edge filtering

**Files:**
- Modify: `lib/pedigree-layout/alignPedigree.ts`

**Step 1: Update AUXILIARY_EDGE_TYPES constant**

Replace:
```typescript
const AUXILIARY_EDGE_TYPES = new Set<ParentEdgeType>([
  'donor',
  'surrogate',
  'bio-parent',
]);
```

With:
```typescript
const AUXILIARY_EDGE_TYPES = new Set<ParentEdgeType>([
  'donor',
  'surrogate',
]);
```

**Step 2: Update all `'social-parent'` and `'co-parent'` references**

Search for any remaining references to `social-parent` or `co-parent` in the file and replace with `'parent'`.

**Step 3: Commit**

```
refactor: update alignPedigree auxiliary edge filtering for simplified types
```

---

### Task 7: Update `connectors.ts` — remove double lines, add unpartnered-parent logic

**Files:**
- Modify: `lib/pedigree-layout/connectors.ts`

**Step 1: Simplify group line rendering**

Remove the `partner` and `current` fields from group connector construction. The group line is now always a single line:

```typescript
const connector: ParentGroupConnector = {
  type: 'parent-group',
  segment,
  double: isDouble,
};
```

Remove the `partnerPairs` and `partnerMap` lookups (no longer needed for group line styling).

**Step 2: Add unpartnered-parent auxiliary logic**

In the parent-child lines section, after determining children for a family, check if any parent of those children is unpartnered. The rule from the design doc:

> A `parent` receives dashed auxiliary treatment ONLY when:
> 1. The parent has NO partner edge with ANY other parent of the same child, AND
> 2. At least one OTHER parent of the same child IS in a partner group

For each child, look at all parents. If some parents are in a partner group (have group lines between them) and others are not, the non-partnered parents get auxiliary treatment.

Add after the existing auxiliary lines loop (donor/surrogate):

```typescript
// Unpartnered parent auxiliary lines
// A parent gets dashed treatment when they have no partner edge with
// any other parent of the same child, AND at least one other parent
// of that child IS in a partner group.
for (let i = 0; i < maxlev; i++) {
  for (let j = 0; j < (layout.n[i] ?? 0); j++) {
    const childId = layout.nid[i]![j]!;
    const childParents = parents[childId] ?? [];
    const parentEdges = childParents.filter((p) => p.edgeType === 'parent');
    if (parentEdges.length < 2) continue;

    // Find which parents are in partner groups (adjacent with group > 0)
    const partneredParents = new Set<number>();
    for (let pi = 0; pi < maxlev; pi++) {
      for (let pj = 0; pj < (layout.n[pi] ?? 0) - 1; pj++) {
        if ((layout.group[pi]?.[pj] ?? 0) > 0) {
          partneredParents.add(layout.nid[pi]![pj]!);
          partneredParents.add(layout.nid[pi]![pj + 1]!);
        }
      }
    }

    const hasPartneredParent = parentEdges.some((p) =>
      partneredParents.has(p.parentIndex),
    );
    if (!hasPartneredParent) continue;

    for (const pc of parentEdges) {
      if (partneredParents.has(pc.parentIndex)) continue;
      // This parent is unpartnered while others are partnered — dashed auxiliary
      for (let pi = 0; pi < maxlev; pi++) {
        for (let pj = 0; pj < (layout.n[pi] ?? 0); pj++) {
          if (layout.nid[pi]![pj] === pc.parentIndex) {
            const parentX = layout.pos[pi]![pj]!;
            const parentY = pi + boxh / 2;
            const childX = layout.pos[i]![j]!;
            const childY = i + boxh / 2;
            auxiliaryLines.push({
              type: 'auxiliary',
              edgeType: 'unpartnered-parent',
              segment: {
                type: 'line',
                x1: parentX,
                y1: parentY,
                x2: childX,
                y2: childY,
              },
            });
          }
        }
      }
    }
  }
}
```

**Step 3: Update the existing auxiliary loop**

Remove `bio-parent` from the auxiliary edge type check since it no longer exists:

```typescript
if (pc.edgeType === 'donor' || pc.edgeType === 'surrogate') {
```

**Step 4: Update `computeConnectors` signature**

The `partners` parameter can be simplified since we no longer need it for group line styling. However, keep it for now — it may be useful for future features. Just remove the `partnerMap` and `partnerPairs` lookups.

**Step 5: Commit**

```
refactor: remove double lines, add unpartnered-parent auxiliary logic
```

---

### Task 8: Update EdgeRenderer — simplify group lines, update auxiliary styles

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/EdgeRenderer.tsx`

**Step 1: Simplify `renderGroupLine`**

Remove the `conn.partner` branch (double lines) and the `!conn.current` slash. The function becomes:

```typescript
function renderGroupLine(
  conn: ParentGroupConnector,
  idx: number,
  color: string,
) {
  if (conn.double) {
    return (
      <g key={`consang-${idx}`}>
        {renderLine(conn.segment, color, `consang-line1-${idx}`)}
        {conn.doubleSegment &&
          renderLine(conn.doubleSegment, color, `consang-line2-${idx}`)}
      </g>
    );
  }

  return renderLine(conn.segment, color, `group-bar-${idx}`, {
    strokeLinecap: 'round',
  });
}
```

**Step 2: Update `getAuxiliaryStyle`**

Replace `bio-parent` with `unpartnered-parent`:

```typescript
function getAuxiliaryStyle(edgeType: AuxiliaryConnector['edgeType']) {
  switch (edgeType) {
    case 'unpartnered-parent':
      return { strokeDasharray: '8 4', strokeWidth: 3, opacity: 0.8 };
    case 'donor':
    case 'surrogate':
      return { strokeDasharray: '2 4', strokeWidth: 2, opacity: 0.6 };
  }
}
```

**Step 3: Commit**

```
refactor: simplify EdgeRenderer for new connector model
```

---

### Task 9: Update `pedigreeAdapter.ts` — partner `active` rename, biological flag

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter.ts`

**Step 1: Rename `current` → `active` in partner handling**

In `storeToPedigreeInput`, update the partner edge branch:
```typescript
partnerConnections.push({
  partnerIndex1: i1,
  partnerIndex2: i2,
  active: edge.active,
});
```

**Step 2: Pass `biological` through parent connections**

In the parent edge branch, include `biological`:
```typescript
parents[childIdx]!.push({
  parentIndex: parentIdx,
  edgeType: edge.edgeType,
  biological: edge.type === 'parent' ? edge.biological : undefined,
});
```

**Step 3: Commit**

```
refactor: update pedigreeAdapter for active rename and biological flag
```

---

### Task 10: Add bio-relative computation

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts` (add `isBioRelative` to NodeData)
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/computeBioRelatives.ts`

**Step 1: Add `isBioRelative` to `NodeData`**

```typescript
export type NodeData = {
  label: string;
  sex?: Sex;
  gender?: Gender;
  isEgo: boolean;
  isBioRelative?: boolean;
  readOnly?: boolean;
  interviewNetworkId?: string;
  diseases?: Map<string, boolean>;
};
```

**Step 2: Create `computeBioRelatives.ts`**

```typescript
import { type StoreEdge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

/**
 * Compute which nodes are biological relatives of ego.
 *
 * A node is a bio-relative if connected to ego through a chain of
 * genetic contributions:
 * - 'parent' edges where biological !== false (defaults to true)
 * - 'donor' edges (always genetic)
 * - 'surrogate' edges are NOT genetic
 *
 * Traverses both up (to ancestors) and down (to descendants).
 */
export function computeBioRelatives(
  egoId: string,
  edges: Map<string, StoreEdge>,
): Set<string> {
  const bioRelatives = new Set<string>();
  bioRelatives.add(egoId);

  // Build adjacency: genetic parent-child links (bidirectional)
  const geneticLinks = new Map<string, Set<string>>();

  const addLink = (a: string, b: string) => {
    if (!geneticLinks.has(a)) geneticLinks.set(a, new Set());
    geneticLinks.get(a)!.add(b);
  };

  for (const edge of edges.values()) {
    if (edge.type !== 'parent') continue;
    const isGenetic =
      edge.edgeType === 'donor' ||
      (edge.edgeType === 'parent' && edge.biological !== false);
    if (!isGenetic) continue;
    addLink(edge.source, edge.target);
    addLink(edge.target, edge.source);
  }

  // BFS from ego
  const queue = [egoId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    const neighbors = geneticLinks.get(current);
    if (!neighbors) continue;
    for (const neighbor of neighbors) {
      if (!bioRelatives.has(neighbor)) {
        bioRelatives.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return bioRelatives;
}
```

**Step 3: Integrate into PedigreeLayout.tsx**

In `lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout.tsx`, compute bio-relatives and pass them to nodes:

Import the function and, inside the `layoutResult` useMemo, compute bio-relatives. Then when rendering nodes, set `isBioRelative` on each node.

Actually, the better place is where nodes are consumed. The `PedigreeLayout` component receives `nodes` and `edges` — it can compute bio-relatives internally and pass the flag through `renderNode`.

In the component, add:

```typescript
const bioRelatives = useMemo(() => {
  const egoEntry = [...nodes.entries()].find(([, n]) => n.isEgo);
  if (!egoEntry) return new Set<string>();
  return computeBioRelatives(egoEntry[0], edges);
}, [nodes, edges]);
```

Then in the render loop:
```typescript
{renderNode({ id, ...node, isBioRelative: bioRelatives.has(id) })}
```

**Step 4: Commit**

```
feat: compute and pass bio-relative flag to pedigree nodes
```

---

### Task 11: Update PedigreeKey component

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeKey.tsx`

**Step 1: Update KEY_ENTRIES**

Replace the current entries with:

```typescript
const KEY_ENTRIES: KeyEntry[] = [
  { label: 'Parent', strokeWidth: 5 },
  {
    label: 'Biological parent',
    strokeWidth: 3,
    strokeDasharray: '8 4',
    opacity: 0.8,
  },
  {
    label: 'Egg or Sperm Donor',
    strokeWidth: 2,
    strokeDasharray: '2 4',
    opacity: 0.6,
  },
  {
    label: 'Surrogate Carrier',
    strokeWidth: 2,
    strokeDasharray: '2 4',
    opacity: 0.6,
  },
];
```

Remove the `double` and `slash` rendering code from `KeyLine` since there are no double lines.

**Step 2: Commit**

```
refactor: simplify PedigreeKey to match new connector model
```

---

### Task 12: Update storybook stories — rename edge types, add Known Bio Parent

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/PedigreeLayout.stories.tsx`

**Step 1: Global replacements across all network definitions**

- Replace all `edgeType: 'social-parent'` with `edgeType: 'parent'`
- Replace all `edgeType: 'co-parent'` with `edgeType: 'parent'`
- Replace all `current: true` with `active: true`
- Replace all `current: false` with `active: false`
- `donor` and `surrogate` edge types stay unchanged

**Step 2: Add "Known Bio Parent" network**

Add to the NETWORKS object and the argTypes options:

```typescript
'Known Bio Parent': buildNetwork(
  [
    { id: 'mom', label: fakeName('female'), sex: 'female' },
    { id: 'stepdad', label: fakeName('male'), sex: 'male' },
    { id: 'biodad', label: fakeName('male'), sex: 'male' },
    { id: 'ego', label: fakeName('female'), sex: 'female', isEgo: true },
    { id: 'sibling', label: fakeName('male'), sex: 'male' },
  ],
  [
    { source: 'mom', target: 'stepdad', type: 'partner', active: true },
    {
      source: 'mom',
      target: 'ego',
      type: 'parent',
      edgeType: 'parent',
      biological: true,
    },
    {
      source: 'stepdad',
      target: 'ego',
      type: 'parent',
      edgeType: 'parent',
      biological: false,
    },
    {
      source: 'biodad',
      target: 'ego',
      type: 'parent',
      edgeType: 'parent',
      biological: true,
    },
    {
      source: 'mom',
      target: 'sibling',
      type: 'parent',
      edgeType: 'parent',
      biological: true,
    },
    {
      source: 'stepdad',
      target: 'sibling',
      type: 'parent',
      edgeType: 'parent',
      biological: false,
    },
    {
      source: 'biodad',
      target: 'sibling',
      type: 'parent',
      edgeType: 'parent',
      biological: true,
    },
  ],
),
```

Note: The `buildNetwork` helper and `StoreEdge` type may need updating to accept the `biological` field. Check and update accordingly.

**Step 3: Add 'Known Bio Parent' to argTypes options list**

**Step 4: Commit**

```
feat: update storybook stories for simplified edge types, add Known Bio Parent
```

---

### Task 13: Update test fixtures

**Files:**
- Modify: `lib/pedigree-layout/__tests__/fixtures.ts`

**Step 1: Update all fixtures**

Replace all `edgeType: 'social-parent'` with `edgeType: 'parent'` in the `sp` helper and all fixture definitions.

Replace `'bio-parent'` with `'parent'` (add `biological: true` where it was bio-parent, add `biological: false` where it was social-parent in the blended family fixture).

Replace `'co-parent'` with `'parent'` in the threeCoParents fixture.

Update `multipleMarriages` fixture:
- Change `current` to `active` in PartnerConnection entries
- Replace edge type names

**Step 2: Commit**

```
test: update pedigree test fixtures for simplified edge types
```

---

### Task 14: Update all remaining test files

**Files:**
- Modify: `lib/pedigree-layout/__tests__/connectors.test.ts`
- Modify: `lib/pedigree-layout/__tests__/alignPedigree.test.ts`
- Modify: `lib/pedigree-layout/__tests__/utils.test.ts`
- Modify: `lib/pedigree-layout/__tests__/kindepth.test.ts`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/pedigreeAdapter.test.ts`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/store.test.ts`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/PedigreeLayout.test.tsx`

**Step 1: Global replacements across all test files**

- `'social-parent'` → `'parent'`
- `'bio-parent'` → `'parent'` (add `biological: true` where the test specifically tests bio-parent behavior)
- `'co-parent'` → `'parent'`
- `current: true` → `active: true` (on partner edges/connections)
- `current: false` → `active: false`
- Remove `partner:` and `current:` fields from `ParentGroupConnector` mock objects

**Step 2: Update connectors.test.ts specifically**

- Remove tests for `partner` and `current` flags on group lines
- Remove the double-line partner test
- Update the multi-partner test to use `active` instead of `current`
- Add a test for unpartnered-parent auxiliary lines

**Step 3: Run all tests**

Run: `npx vitest run lib/pedigree-layout lib/interviewer/Interfaces/FamilyTreeCensus/__tests__ -v 2>&1 | tail -30`

Fix any failures.

**Step 4: Commit**

```
test: update all test files for simplified edge types
```

---

### Task 15: Write tests for bio-relative computation

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/computeBioRelatives.test.ts`

**Step 1: Write tests**

```typescript
import { describe, expect, it } from 'vitest';
import { computeBioRelatives } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/computeBioRelatives';
import { type StoreEdge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

function buildEdges(defs: StoreEdge[]): Map<string, StoreEdge> {
  const edges = new Map<string, StoreEdge>();
  defs.forEach((e, i) => edges.set(`e${i}`, e));
  return edges;
}

describe('computeBioRelatives', () => {
  it('includes ego', () => {
    const result = computeBioRelatives('ego', new Map());
    expect(result.has('ego')).toBe(true);
  });

  it('includes biological parents', () => {
    const edges = buildEdges([
      { source: 'mom', target: 'ego', type: 'parent', edgeType: 'parent' },
      { source: 'dad', target: 'ego', type: 'parent', edgeType: 'parent' },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('mom')).toBe(true);
    expect(result.has('dad')).toBe(true);
  });

  it('excludes non-biological parents', () => {
    const edges = buildEdges([
      {
        source: 'stepdad',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
        biological: false,
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('stepdad')).toBe(false);
  });

  it('includes donors', () => {
    const edges = buildEdges([
      { source: 'donor', target: 'ego', type: 'parent', edgeType: 'donor' },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('donor')).toBe(true);
  });

  it('excludes surrogates', () => {
    const edges = buildEdges([
      {
        source: 'surrogate',
        target: 'ego',
        type: 'parent',
        edgeType: 'surrogate',
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('surrogate')).toBe(false);
  });

  it('traverses multi-generational chains', () => {
    const edges = buildEdges([
      { source: 'grandpa', target: 'dad', type: 'parent', edgeType: 'parent' },
      { source: 'dad', target: 'ego', type: 'parent', edgeType: 'parent' },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('grandpa')).toBe(true);
  });

  it('includes biological siblings', () => {
    const edges = buildEdges([
      { source: 'mom', target: 'ego', type: 'parent', edgeType: 'parent' },
      { source: 'mom', target: 'sibling', type: 'parent', edgeType: 'parent' },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('sibling')).toBe(true);
  });

  it('excludes non-biological siblings', () => {
    const edges = buildEdges([
      {
        source: 'stepmom',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
        biological: false,
      },
      {
        source: 'stepmom',
        target: 'stepsibling',
        type: 'parent',
        edgeType: 'parent',
      },
    ]);
    const result = computeBioRelatives('ego', edges);
    expect(result.has('stepsibling')).toBe(false);
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/computeBioRelatives.test.ts -v`

**Step 3: Commit**

```
test: add bio-relative computation tests
```

---

### Task 16: Format and final verification

**Step 1: Format all changed files**

Run: `npx prettier --write lib/pedigree-layout/types.ts lib/pedigree-layout/alignPedigree.ts lib/pedigree-layout/connectors.ts lib/pedigree-layout/__tests__/*.ts lib/interviewer/Interfaces/FamilyTreeCensus/**/*.ts lib/interviewer/Interfaces/FamilyTreeCensus/**/*.tsx lib/interviewer/ducks/modules/session.ts`

**Step 2: Run full test suite**

Run: `pnpm test -- --run 2>&1 | tail -10`
Expected: All tests pass.

**Step 3: Typecheck**

Run: `pnpm typecheck 2>&1 | tail -10`
Expected: Clean.

**Step 4: Lint**

Run: `pnpm lint --fix 2>&1 | tail -20`
Expected: Clean.

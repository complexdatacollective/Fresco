# Connector Refinements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix per-couple child connectors in blended families, add past-partnership diagonal slash, pass all partner edge properties end-to-end, and add a PedigreeKey legend component.

**Architecture:** The fam assignment in `alignped1` already produces distinct fam values per couple. The connector code's group-walking logic walks the full contiguous group regardless, producing the same parentx for all fam values. Fix by scoping the group walk to the specific couple bracket. Add `PartnerConnection` type to carry all partner edge metadata (currently `current`) from store through to rendering. Add `PedigreeKey` component showing 6 edge type entries.

**Tech Stack:** TypeScript, React, SVG, Vitest

---

### Task 1: Add `PartnerConnection` type and `current` to `ParentGroupConnector`

**Files:**
- Modify: `lib/pedigree-layout/types.ts`

**Step 1: Add PartnerConnection type**

After the `ParentConnection` type (line 25), add:

```typescript
export type PartnerConnection = {
  partnerIndex1: number;
  partnerIndex2: number;
  current: boolean;
};
```

**Step 2: Add `current` to `ParentGroupConnector`**

Add `current: boolean` to the `ParentGroupConnector` type (line 100):

```typescript
export type ParentGroupConnector = {
  type: 'parent-group';
  segment: LineSegment;
  partner: boolean;
  current: boolean;
  double: boolean;
  doubleSegment?: LineSegment;
};
```

**Step 3: Add `partners` to `PedigreeInput`**

Add to the `PedigreeInput` type (line 37):

```typescript
export type PedigreeInput = {
  id: string[];
  sex: Sex[];
  gender: Gender[];
  parents: ParentConnection[][];
  partners?: PartnerConnection[];
  relation?: Relation[];
  hints?: Hints;
};
```

**Step 4: Run typecheck to see what breaks**

Run: `pnpm typecheck 2>&1 | head -40`
Expected: Errors wherever `ParentGroupConnector` is constructed without `current`.

**Step 5: Commit**

```
feat: add PartnerConnection type and current flag to ParentGroupConnector
```

---

### Task 2: Scope connector group walking to specific couple

**Files:**
- Modify: `lib/pedigree-layout/connectors.ts:106-123`
- Test: `lib/pedigree-layout/__tests__/connectors.test.ts`

**Step 1: Write failing test for per-couple parent link targeting**

In `connectors.test.ts`, add a test using a multiple-marriages layout:

```typescript
it('routes parent links to specific couple midpoints in multi-partner layouts', () => {
  // Layout: [partner1(col0), parent(col1), partner2(col2)]
  // group: [1, 1, 0] — two adjacent couples sharing parent
  // child1 has fam=1 (couple at cols 0-1), child2 has fam=2 (couple at cols 1-2)
  const multiLayout: PedigreeLayout = {
    n: [3, 2],
    nid: [
      [1, 0, 2],   // partner1=1, parent=0, partner2=2
      [3, 4, 0],   // child1=3, child2=4
    ],
    pos: [
      [0, 1, 2],
      [0.5, 1.5, 0],
    ],
    fam: [
      [0, 0, 0],
      [1, 2, 0],   // child1 → fam=1 (cols 0-1), child2 → fam=2 (cols 1-2)
    ],
    group: [
      [1, 1, 0],   // group between col0-1 and col1-2
      [0, 0, 0],
    ],
    twins: null,
    groupMember: [
      [false, false, false],
      [false, false, false],
    ],
  };

  const multiParents: ParentConnection[][] = [
    [],
    [],
    [],
    [
      { parentIndex: 1, edgeType: 'social-parent' },
      { parentIndex: 0, edgeType: 'social-parent' },
    ],
    [
      { parentIndex: 0, edgeType: 'social-parent' },
      { parentIndex: 2, edgeType: 'social-parent' },
    ],
  ];

  const connectors = computeConnectors(multiLayout, scaling, multiParents);

  // Should produce 2 separate parent-child connectors (one per couple)
  expect(connectors.parentChildLines.length).toBe(2);

  // First connector (fam=1): parent link targets midpoint of cols 0 and 1 = 0.5
  const pc1 = connectors.parentChildLines[0]!;
  const pc1ParentX = pc1.parentLink[0]!.x1;
  expect(pc1ParentX).toBeCloseTo(0.5, 1);

  // Second connector (fam=2): parent link targets midpoint of cols 1 and 2 = 1.5
  const pc2 = connectors.parentChildLines[1]!;
  const pc2ParentX = pc2.parentLink[0]!.x1;
  expect(pc2ParentX).toBeCloseTo(1.5, 1);
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/pedigree-layout/__tests__/connectors.test.ts -v 2>&1 | tail -20`
Expected: FAIL — both connectors currently target midpoint of cols 0-2 = 1.0.

**Step 3: Fix group walking in `computeConnectors`**

In `connectors.ts`, replace the group walking code (lines ~106-123) with couple-scoped logic:

```typescript
// Couple is the two columns bracketing the group line that fam points to.
// fam is 1-based: fam=1 means the group line between col 0 and col 1.
const groupLeft = fam - 1;
const groupRight = fam;
const parentx =
  groupRight < (layout.n[i - 1] ?? 0)
    ? (layout.pos[i - 1]![groupLeft]! + layout.pos[i - 1]![groupRight]!) / 2
    : layout.pos[i - 1]![groupLeft]!;
```

This replaces the `while` loop that walked the full contiguous group. For single-parent families (where only one parent exists), `groupRight` may equal `groupLeft` and the fallback uses just `groupLeft`.

**Step 4: Run tests**

Run: `npx vitest run lib/pedigree-layout/__tests__/connectors.test.ts -v 2>&1 | tail -20`
Expected: All pass including new test.

**Step 5: Run full pedigree test suite**

Run: `npx vitest run lib/pedigree-layout lib/interviewer/Interfaces/FamilyTreeCensus/__tests__ -v 2>&1 | tail -20`
Expected: All pass. Existing tests for nuclear families (fam=1, couple at cols 0-1) should still work since the scoped walk produces the same midpoint.

**Step 6: Commit**

```
fix: scope connector group walking to specific couple bracket
```

---

### Task 3: Pass partner edge properties end-to-end

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter.ts`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout.tsx`
- Modify: `lib/pedigree-layout/connectors.ts`
- Test: `lib/pedigree-layout/__tests__/connectors.test.ts`

**Step 1: Write failing test for `current` on group connectors**

In `connectors.test.ts`, add:

```typescript
it('sets current=true on group lines for current partnerships', () => {
  const partners: PartnerConnection[] = [
    { partnerIndex1: 1, partnerIndex2: 2, current: true },
  ];
  const connectors = computeConnectors(
    layout, scaling, parents, 0.6, 0.5, [], partners,
  );
  expect(connectors.groupLines[0]!.current).toBe(true);
});

it('sets current=false on group lines for past partnerships', () => {
  const partners: PartnerConnection[] = [
    { partnerIndex1: 1, partnerIndex2: 2, current: false },
  ];
  const connectors = computeConnectors(
    layout, scaling, parents, 0.6, 0.5, [], partners,
  );
  expect(connectors.groupLines[0]!.current).toBe(false);
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/pedigree-layout/__tests__/connectors.test.ts -v 2>&1 | tail -20`
Expected: FAIL — `current` not set on group connectors.

**Step 3: Update `computeConnectors` to accept and use `partners`**

In `connectors.ts`, add `partners` parameter after `relations`:

```typescript
export function computeConnectors(
  layout: PedigreeLayout,
  scaling: ScalingParams,
  parents: ParentConnection[][],
  branch = 0.6,
  pconnect = 0.5,
  relations: Relation[] = [],
  partners: PartnerConnection[] = [],
): PedigreeConnectors {
```

Build a partner lookup map from `partners`:

```typescript
// Build partner pair lookup from partners array
const partnerMap = new Map<string, PartnerConnection>();
for (const p of partners) {
  const key = `${Math.min(p.partnerIndex1, p.partnerIndex2)},${Math.max(p.partnerIndex1, p.partnerIndex2)}`;
  partnerMap.set(key, p);
}
```

In the group line loop, look up the partner connection and set `current`:

```typescript
const pairKey = `${Math.min(leftId, rightId)},${Math.max(leftId, rightId)}`;
const partnerConn = partnerMap.get(pairKey);
const isPartner = partnerConn !== undefined || partnerPairs.has(pairKey);
const isCurrent = partnerConn?.current ?? true;

const connector: ParentGroupConnector = {
  type: 'parent-group',
  segment,
  partner: isPartner,
  current: isCurrent,
  double: isDouble,
};
```

**Step 4: Run tests**

Run: `npx vitest run lib/pedigree-layout/__tests__/connectors.test.ts -v 2>&1 | tail -20`
Expected: All pass.

**Step 5: Update `storeToPedigreeInput` to build `PartnerConnection[]`**

In `pedigreeAdapter.ts`, in the partner edge branch of the loop, build both `relations` and `partners`:

```typescript
} else if (edge.type === 'partner') {
  const i1 = idToIndex.get(edge.source);
  const i2 = idToIndex.get(edge.target);
  if (i1 === undefined || i2 === undefined) continue;
  relations.push({ id1: i1, id2: i2, code: 4 });
  partnerConnections.push({
    partnerIndex1: i1,
    partnerIndex2: i2,
    current: edge.current,
  });
}
```

Include `partners` in the returned `PedigreeInput`.

**Step 6: Update `buildConnectorData` to pass `partners` through**

In `pedigreeAdapter.ts`, add `partners` parameter to `buildConnectorData` and pass it to `computeConnectors`:

```typescript
export function buildConnectorData(
  layout: PedigreeLayout,
  _edges: Map<string, StoreEdge>,
  dimensions: LayoutDimensions,
  parents: ParentConnection[][] = [],
  relations: Relation[] = [],
  partners: PartnerConnection[] = [],
): ConnectorRenderData {
  // ...
  const connectors = computeConnectors(
    layout, scaling, parents, 0.6, 0.5, relations, partners,
  );
```

**Step 7: Update `PedigreeLayout.tsx` to pass `input.partners`**

```typescript
const connectorData = buildConnectorData(
  layout, edges, dimensions, input.parents, input.relation, input.partners,
);
```

**Step 8: Fix all existing `ParentGroupConnector` constructions**

Update all test mocks and any other code that creates `ParentGroupConnector` objects to include `current: true` (or appropriate value).

**Step 9: Run full test suite**

Run: `npx vitest run lib/pedigree-layout lib/interviewer/Interfaces/FamilyTreeCensus/__tests__ -v 2>&1 | tail -20`
Expected: All pass.

**Step 10: Commit**

```
feat: pass partner edge properties end-to-end via PartnerConnection
```

---

### Task 4: Render diagonal slash for past partnerships

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/EdgeRenderer.tsx`

**Step 1: Update `renderGroupLine` for past partnerships**

In the `conn.partner` branch of `renderGroupLine`, add the diagonal slash when `!conn.current`:

```typescript
if (conn.partner) {
  const offset = EDGE_WIDTH;
  const midX = (seg.x1 + seg.x2) / 2;
  const midY = (seg.y1 + seg.y2) / 2;
  const slashSize = offset * 2;

  return (
    <g key={`partner-${idx}`}>
      <line
        x1={seg.x1}
        y1={seg.y1 - offset}
        x2={seg.x2}
        y2={seg.y2 - offset}
        stroke={color}
        strokeWidth={EDGE_WIDTH}
      />
      <line
        x1={seg.x1}
        y1={seg.y1 + offset}
        x2={seg.x2}
        y2={seg.y2 + offset}
        stroke={color}
        strokeWidth={EDGE_WIDTH}
      />
      {!conn.current && (
        <line
          x1={midX - slashSize / 2}
          y1={midY + slashSize}
          x2={midX + slashSize / 2}
          y2={midY - slashSize}
          stroke={color}
          strokeWidth={EDGE_WIDTH}
        />
      )}
    </g>
  );
}
```

The slash runs from bottom-left to top-right at ~60 degrees, crossing both parallel lines.

**Step 2: Verify visually in storybook**

Open storybook, navigate to Blended Family story. The exPartner connection should show double lines with a diagonal slash. The newPartner connection should show double lines without a slash.

**Step 3: Commit**

```
feat: render diagonal slash on past partnership connectors
```

---

### Task 5: Create PedigreeKey component

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeKey.tsx`

**Step 1: Create the component**

```typescript
'use client';

const EDGE_WIDTH = 5;

type KeyEntry = {
  label: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity?: number;
  double?: boolean;
  slash?: boolean;
};

const KEY_ENTRIES: KeyEntry[] = [
  { label: 'Parent', strokeWidth: 5 },
  { label: 'Biological parent', strokeWidth: 3, strokeDasharray: '8 4', opacity: 0.8 },
  { label: 'Egg or Sperm Donor', strokeWidth: 2, strokeDasharray: '2 4', opacity: 0.6 },
  { label: 'Surrogate Carrier', strokeWidth: 2, strokeDasharray: '2 4', opacity: 0.6 },
  { label: 'Partner (current)', strokeWidth: 5, double: true },
  { label: 'Partner (past)', strokeWidth: 5, double: true, slash: true },
];

const LINE_WIDTH = 48;
const LINE_Y = 10;
const DOUBLE_OFFSET = EDGE_WIDTH;

function KeyLine({ entry, color }: { entry: KeyEntry; color: string }) {
  const y = LINE_Y;
  const opacity = entry.opacity ?? 1;

  if (entry.double) {
    const midX = LINE_WIDTH / 2;
    const slashSize = DOUBLE_OFFSET * 2;
    return (
      <svg width={LINE_WIDTH} height={20}>
        <line
          x1={0} y1={y - DOUBLE_OFFSET}
          x2={LINE_WIDTH} y2={y - DOUBLE_OFFSET}
          stroke={color} strokeWidth={entry.strokeWidth} opacity={opacity}
        />
        <line
          x1={0} y1={y + DOUBLE_OFFSET}
          x2={LINE_WIDTH} y2={y + DOUBLE_OFFSET}
          stroke={color} strokeWidth={entry.strokeWidth} opacity={opacity}
        />
        {entry.slash && (
          <line
            x1={midX - slashSize / 2} y1={y + slashSize}
            x2={midX + slashSize / 2} y2={y - slashSize}
            stroke={color} strokeWidth={entry.strokeWidth}
          />
        )}
      </svg>
    );
  }

  return (
    <svg width={LINE_WIDTH} height={20}>
      <line
        x1={0} y1={y} x2={LINE_WIDTH} y2={y}
        stroke={color}
        strokeWidth={entry.strokeWidth}
        strokeDasharray={entry.strokeDasharray}
        strokeLinecap="round"
        opacity={opacity}
      />
    </svg>
  );
}

type PedigreeKeyProps = {
  color: string;
} & React.HTMLAttributes<HTMLDivElement>;

export default function PedigreeKey({ color, ...props }: PedigreeKeyProps) {
  return (
    <div {...props}>
      {KEY_ENTRIES.map((entry) => (
        <div key={entry.label} className="flex items-center gap-3">
          <KeyLine entry={entry} color={color} />
          <span className="text-sm">{entry.label}</span>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```
feat: add PedigreeKey legend component
```

---

### Task 6: Add PedigreeKey to storybook story

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/PedigreeLayout.stories.tsx`

**Step 1: Import PedigreeKey and add to the story template**

Add the import and render `PedigreeKey` alongside the `PedigreeLayout` in the `Playground` story:

```typescript
import PedigreeKey from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeKey';
```

In the Playground return JSX, add the key below or beside the layout:

```typescript
return (
  <div className="flex size-full flex-col items-center justify-center gap-8 overflow-auto p-8">
    <PedigreeLayout
      nodes={stableNodes}
      edges={stableEdges}
      nodeWidth={nodeWidth}
      nodeHeight={nodeHeight}
      renderNode={renderNode}
    />
    <PedigreeKey
      color="var(--color-edge-1)"
      className="rounded-lg bg-white/10 p-4"
    />
  </div>
);
```

**Step 2: Verify in storybook**

Open storybook, check that the key renders below each network with correct line styles.

**Step 3: Commit**

```
feat: add PedigreeKey to pedigree layout storybook story
```

---

### Task 7: Add `multipleMarriages` fixture with partner relations and run full tests

**Files:**
- Modify: `lib/pedigree-layout/__tests__/fixtures.ts`
- Modify: `lib/pedigree-layout/__tests__/alignPedigree.test.ts`

**Step 1: Add partner relations to `multipleMarriages` fixture**

```typescript
export const multipleMarriages: PedigreeInput = {
  id: ['parent1', 'partner1', 'partner2', 'child1', 'child2'],
  sex: ['male', 'female', 'female', 'male', 'female'],
  gender: ['man', 'woman', 'woman', 'man', 'woman'],
  parents: [[], [], [], [sp(0), sp(1)], [sp(0), sp(2)]],
  relation: [
    { id1: 0, id2: 1, code: 4 },
    { id1: 0, id2: 2, code: 4 },
  ],
  partners: [
    { partnerIndex1: 0, partnerIndex2: 1, current: false },
    { partnerIndex1: 0, partnerIndex2: 2, current: true },
  ],
};
```

**Step 2: Add test asserting per-couple connectors in the aligned layout**

```typescript
it('multiple marriages: children from different couples get separate parent-child connectors', () => {
  const result = alignPedigree(multipleMarriages, {
    hints: { order: [1, 2, 3, 4, 5] },
  });

  const conn = computeConnectors(
    result,
    defaultScaling,
    multipleMarriages.parents,
    0.6,
    0.5,
    multipleMarriages.relation ?? [],
    multipleMarriages.partners ?? [],
  );

  // Should produce 2 separate parent-child connectors (one per couple)
  expect(conn.parentChildLines.length).toBe(2);

  // Parent links should target different x positions
  const x1 = conn.parentChildLines[0]!.parentLink[0]!.x1;
  const x2 = conn.parentChildLines[1]!.parentLink[0]!.x1;
  expect(x1).not.toBeCloseTo(x2, 1);

  // Group lines should have correct current flags
  const currentLine = conn.groupLines.find((g) => g.current);
  const pastLine = conn.groupLines.find((g) => !g.current);
  expect(currentLine).toBeDefined();
  expect(pastLine).toBeDefined();
});
```

**Step 3: Run full test suite**

Run: `npx vitest run lib/pedigree-layout lib/interviewer/Interfaces/FamilyTreeCensus/__tests__ -v 2>&1 | tail -20`
Expected: All pass.

**Step 4: Run typecheck and lint**

Run: `pnpm typecheck 2>&1 | tail -20`
Run: `pnpm lint 2>&1 | tail -20`
Expected: Clean (aside from any pre-existing issues).

**Step 5: Commit**

```
test: add multiple marriages integration test with per-couple connectors
```

---

### Task 8: Format and final verification

**Step 1: Format all changed files**

Run: `npx prettier --write lib/pedigree-layout/types.ts lib/pedigree-layout/connectors.ts lib/pedigree-layout/__tests__/connectors.test.ts lib/pedigree-layout/__tests__/fixtures.ts lib/pedigree-layout/__tests__/alignPedigree.test.ts lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter.ts lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout.tsx lib/interviewer/Interfaces/FamilyTreeCensus/components/EdgeRenderer.tsx lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeKey.tsx lib/interviewer/Interfaces/FamilyTreeCensus/PedigreeLayout.stories.tsx`

**Step 2: Run complete test suite**

Run: `pnpm test -- --run 2>&1 | tail -10`
Expected: All tests pass.

**Step 3: Typecheck**

Run: `pnpm typecheck 2>&1 | tail -10`
Expected: Clean.

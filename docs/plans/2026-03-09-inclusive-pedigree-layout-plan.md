# Inclusive Pedigree Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace heteronormative assumptions in the pedigree-layout library with flexible parent groups, typed edges, and gender-based node display so that diverse family structures (same-sex parents, single parents, donors, surrogates, co-parents) can be visualized.

**Architecture:** The `lib/pedigree-layout/` library is a standalone layout engine with no React dependency. We modify its input types (`PedigreeInput`), internal algorithms (`kindepth`, `alignped1/2/3/4`, `alignPedigree`, `autohint`, `checkHint`), and output types (`PedigreeConnectors`) to support N-parent groups instead of father/mother pairs. All changes are internal to the library — the adapter layer (in FamilyTreeCensus, currently deleted from working tree) will be updated separately when that feature is rebuilt.

**Tech Stack:** TypeScript 5.8, Vitest, quadprog (QP solver)

**Design doc:** `docs/plans/2026-03-09-inclusive-pedigree-layout-design.md`

---

## Task 1: Update Type Definitions

**Files:**
- Modify: `lib/pedigree-layout/types.ts`

**Step 1: Write the failing test**

No test needed — this is a type-only change. All existing tests will break after this change, which we fix in subsequent tasks.

**Step 2: Update types.ts**

Add new types and modify `PedigreeInput`:

```typescript
// Add after Sex type (line 1)
export type Gender =
  | 'man'
  | 'woman'
  | 'non-binary'
  | 'transgender-man'
  | 'transgender-woman'
  | 'genderqueer'
  | 'agender'
  | 'two-spirit'
  | 'other'
  | 'unknown';

export type ParentEdgeType =
  | 'social-parent'
  | 'bio-parent'
  | 'donor'
  | 'surrogate';

export type ParentConnection = {
  parentIndex: number;
  edgeType: ParentEdgeType;
};
```

Replace `PedigreeInput`:

```typescript
export type PedigreeInput = {
  id: string[];
  sex: Sex[];
  gender: Gender[];
  parents: ParentConnection[][]; // parents[i] = all parent connections for person i
  relation?: Relation[];
  hints?: Hints;
};
```

Expand `RelationCode`:

```typescript
export type RelationCode = 1 | 2 | 3 | 4 | 5 | 6;
// 1=MZ twin, 2=DZ twin, 3=unknown twin, 4=partner
// 5=co-parent, 6=donor/surrogate relation
```

Rename `SpouseHint` to `GroupHint`:

```typescript
export type GroupHint = {
  members: number[]; // ordered list of node indices in the group
  anchor: number;
};
```

Update `Hints`:

```typescript
export type Hints = {
  order: number[];
  groups?: GroupHint[];
};
```

Rename `SpouseEntry` to `GroupEntry`:

```typescript
// [member indices..., anchorSide, anchorType]
// Variable length — first N-2 elements are member indices
export type GroupEntry = number[];
```

Update `AlignmentArrays`:

```typescript
export type AlignmentArrays = {
  n: number[];
  nid: number[][];
  pos: number[][];
  fam: number[][];
  grouplist: GroupEntry[];
};
```

Update `PedigreeLayout`:

```typescript
export type PedigreeLayout = {
  n: number[];
  nid: number[][];
  pos: number[][];
  fam: number[][];
  group: number[][]; // replaces spouse: 0=none, >0=parent group membership
  twins: number[][] | null;
};
```

Update connector types — rename `SpouseConnector` to `ParentGroupConnector`, add `AuxiliaryConnector`:

```typescript
export type ParentGroupConnector = {
  type: 'parent-group';
  segment: LineSegment;
  double: boolean; // consanguineous
  doubleSegment?: LineSegment;
};

export type ParentChildConnector = {
  type: 'parent-child';
  edgeType: ParentEdgeType;
  uplines: LineSegment[];
  siblingBar: LineSegment;
  parentLink: LineSegment[];
};

export type AuxiliaryConnector = {
  type: 'auxiliary';
  edgeType: 'donor' | 'surrogate' | 'bio-parent';
  segments: LineSegment[];
};

export type PedigreeConnectors = {
  groupLines: ParentGroupConnector[];  // replaces spouseLines
  parentChildLines: ParentChildConnector[];
  auxiliaryLines: AuxiliaryConnector[];
  twinIndicators: TwinIndicator[];
  duplicateArcs: DuplicateArc[];
};
```

**Step 3: Run typecheck to see all downstream breakage**

Run: `pnpm typecheck 2>&1 | grep 'pedigree-layout' | head -40`
Expected: Many errors in every file that imports from types.ts

**Step 4: Commit**

```bash
git add lib/pedigree-layout/types.ts
git commit -m "refactor: update pedigree-layout types for inclusive family structures"
```

---

## Task 2: Update Utility Functions

**Files:**
- Modify: `lib/pedigree-layout/utils.ts`
- Modify: `lib/pedigree-layout/__tests__/utils.test.ts`

**Step 1: Write failing tests for updated ancestor/chaseup**

The `ancestor()` and `chaseup()` functions currently take `momIdx`/`dadIdx` arrays. Update them to take `parents: ParentConnection[][]`. Add new tests for the updated signatures alongside updated existing tests.

```typescript
// In utils.test.ts, update the ancestor tests:
describe('ancestor', () => {
  it('finds all ancestors of a person via parents array', () => {
    // grandpa=0, grandma=1, father=2, mother=3, child=4
    const parents: ParentConnection[][] = [
      [], [], // grandpa, grandma: founders
      [{ parentIndex: 0, edgeType: 'social-parent' }, { parentIndex: 1, edgeType: 'social-parent' }],
      [], // mother: founder
      [{ parentIndex: 2, edgeType: 'social-parent' }, { parentIndex: 3, edgeType: 'social-parent' }],
    ];
    const result = ancestor(4, parents);
    expect(result).toContain(2); // father
    expect(result).toContain(3); // mother
    expect(result).toContain(0); // grandpa
    expect(result).toContain(1); // grandma
    expect(result).not.toContain(4); // not self
  });

  it('returns empty for a founder', () => {
    const parents: ParentConnection[][] = [[]];
    expect(ancestor(0, parents)).toEqual([]);
  });

  it('handles single parent', () => {
    const parents: ParentConnection[][] = [
      [],
      [{ parentIndex: 0, edgeType: 'social-parent' }],
    ];
    expect(ancestor(1, parents)).toEqual([0]);
  });

  it('handles 3 parents', () => {
    const parents: ParentConnection[][] = [
      [], [], [],
      [
        { parentIndex: 0, edgeType: 'social-parent' },
        { parentIndex: 1, edgeType: 'social-parent' },
        { parentIndex: 2, edgeType: 'co-parent' },
      ],
    ];
    const result = ancestor(3, parents);
    expect(result.sort()).toEqual([0, 1, 2]);
  });
});

// Update chaseup tests similarly:
describe('chaseup', () => {
  it('finds all ancestors reachable from a set', () => {
    const parents: ParentConnection[][] = [
      [], [],
      [{ parentIndex: 0, edgeType: 'social-parent' }, { parentIndex: 1, edgeType: 'social-parent' }],
    ];
    const result = chaseup([2], parents);
    expect(result).toContain(0);
    expect(result).toContain(1);
    expect(result).toContain(2);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test lib/pedigree-layout/__tests__/utils.test.ts -- --run`
Expected: FAIL — signature mismatch

**Step 3: Update ancestor() and chaseup()**

```typescript
// Update ancestor signature:
export function ancestor(me: number, parents: ParentConnection[][]): number[] {
  const n = parents.length;
  const result = new Array<boolean>(n).fill(false);

  // Seed with direct parents
  const myParents = parents[me] ?? [];
  for (const p of myParents) {
    result[p.parentIndex] = true;
  }

  // Chase up iteratively
  for (let iter = 0; iter < n; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      if (!result[i]) continue;
      for (const p of parents[i] ?? []) {
        if (!result[p.parentIndex]) {
          result[p.parentIndex] = true;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  const indices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (result[i]) indices.push(i);
  }
  return indices;
}

// Update chaseup signature:
export function chaseup(x: number[], parents: ParentConnection[][]): number[] {
  const n = parents.length;
  const inSet = new Array<boolean>(n).fill(false);
  for (const idx of x) inSet[idx] = true;

  for (let iter = 0; iter < n; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      if (!inSet[i]) continue;
      for (const p of parents[i] ?? []) {
        if (!inSet[p.parentIndex]) {
          inSet[p.parentIndex] = true;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  const result: number[] = [];
  for (let i = 0; i < n; i++) {
    if (inSet[i]) result.push(i);
  }
  return result;
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test lib/pedigree-layout/__tests__/utils.test.ts -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/pedigree-layout/utils.ts lib/pedigree-layout/__tests__/utils.test.ts
git commit -m "refactor: update ancestor/chaseup to use parents array"
```

---

## Task 3: Update kindepth

**Files:**
- Modify: `lib/pedigree-layout/kindepth.ts`
- Modify: `lib/pedigree-layout/__tests__/kindepth.test.ts`

**Step 1: Write failing tests for new kindepth signature**

`kindepth` currently takes `(midx, didx, align)`. Change to `(parents, align)` where `parents` is `ParentConnection[][]`.

```typescript
describe('kindepth', () => {
  it('returns [0] for a single person', () => {
    expect(kindepth([[]])).toEqual([0]);
  });

  it('assigns depth 0 to founders, 1 to their children', () => {
    const parents: ParentConnection[][] = [
      [], [],
      [{ parentIndex: 0, edgeType: 'social-parent' }, { parentIndex: 1, edgeType: 'social-parent' }],
    ];
    expect(kindepth(parents)).toEqual([0, 0, 1]);
  });

  it('assigns increasing depth across generations', () => {
    const parents: ParentConnection[][] = [
      [], [],
      [{ parentIndex: 0, edgeType: 'social-parent' }, { parentIndex: 1, edgeType: 'social-parent' }],
      [],
      [{ parentIndex: 2, edgeType: 'social-parent' }, { parentIndex: 3, edgeType: 'social-parent' }],
    ];
    expect(kindepth(parents)).toEqual([0, 0, 1, 0, 2]);
  });

  it('handles single parent', () => {
    const parents: ParentConnection[][] = [
      [],
      [{ parentIndex: 0, edgeType: 'social-parent' }],
    ];
    expect(kindepth(parents)).toEqual([0, 1]);
  });

  it('handles 3 parents at same generation', () => {
    const parents: ParentConnection[][] = [
      [], [], [],
      [
        { parentIndex: 0, edgeType: 'social-parent' },
        { parentIndex: 1, edgeType: 'social-parent' },
        { parentIndex: 2, edgeType: 'co-parent' },
      ],
    ];
    expect(kindepth(parents)).toEqual([0, 0, 0, 1]);
  });

  it('aligns parent group members to same depth when align=true', () => {
    // grandpa=0, grandma=1, parent1=2, parent2=3 (marry-in), child=4
    const parents: ParentConnection[][] = [
      [], [],
      [{ parentIndex: 0, edgeType: 'social-parent' }, { parentIndex: 1, edgeType: 'social-parent' }],
      [],
      [{ parentIndex: 2, edgeType: 'social-parent' }, { parentIndex: 3, edgeType: 'social-parent' }],
    ];
    const depth = kindepth(parents, true);
    expect(depth[2]).toBe(depth[3]);
    expect(depth[4]!).toBeGreaterThan(depth[2]!);
  });

  it('throws on cyclic pedigree', () => {
    const parents: ParentConnection[][] = [
      [{ parentIndex: 1, edgeType: 'social-parent' }],
      [{ parentIndex: 0, edgeType: 'social-parent' }],
    ];
    expect(() => kindepth(parents)).toThrow('Impossible pedigree');
  });

  it('treats auxiliary parents (donor/surrogate) the same for depth', () => {
    const parents: ParentConnection[][] = [
      [], [],
      [{ parentIndex: 0, edgeType: 'social-parent' }, { parentIndex: 1, edgeType: 'donor' }],
    ];
    expect(kindepth(parents)).toEqual([0, 0, 1]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test lib/pedigree-layout/__tests__/kindepth.test.ts -- --run`
Expected: FAIL

**Step 3: Rewrite kindepth**

Replace `midx`/`didx` parameters with `parents: ParentConnection[][]`. The core algorithm stays the same — founders are people with no parents, depth is computed iteratively, and alignment chases parent group members to equalize depths. The key difference: instead of chasing dad/mom indices, iterate over `parents[i]` to find all parent indices.

The alignment section replaces "dad/mom pair" alignment with "parent group" alignment: collect all parent groups (sets of parents who share children), then equalize depths within each group using the same chase-up logic.

**Step 4: Run tests to verify they pass**

Run: `pnpm test lib/pedigree-layout/__tests__/kindepth.test.ts -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/pedigree-layout/kindepth.ts lib/pedigree-layout/__tests__/kindepth.test.ts
git commit -m "refactor: update kindepth to use parents array instead of midx/didx"
```

---

## Task 4: Update checkHint

**Files:**
- Modify: `lib/pedigree-layout/checkHint.ts`
- Modify: `lib/pedigree-layout/__tests__/checkHint.test.ts`

**Step 1: Write failing tests**

Remove sex-based validation. `checkHint` now validates `GroupHint[]` instead of `SpouseHint[]`. No sex checking — any combination of people can form a parent group.

```typescript
describe('checkHint', () => {
  it('passes valid hints through', () => {
    const hints: Hints = { order: [1, 2, 3] };
    expect(checkHint(hints, 3)).toEqual(hints);
  });

  it('throws on missing order', () => {
    expect(() => checkHint({ order: [] }, 3)).toThrow('Wrong length for order component');
  });

  it('throws on wrong length order', () => {
    expect(() => checkHint({ order: [1, 2] }, 3)).toThrow('Wrong length for order component');
  });

  it('validates group member indices are in range', () => {
    const hints: Hints = {
      order: [1, 2, 3],
      groups: [{ members: [0, 5], anchor: 0 }],
    };
    expect(() => checkHint(hints, 3)).toThrow('Invalid group member index');
  });

  it('accepts any combination of people in a group', () => {
    const hints: Hints = {
      order: [1, 2, 3],
      groups: [{ members: [0, 2], anchor: 0 }],
    };
    // No sex check — any pair is valid
    expect(() => checkHint(hints, 3)).not.toThrow();
  });

  it('accepts groups of 3+', () => {
    const hints: Hints = {
      order: [1, 2, 3],
      groups: [{ members: [0, 1, 2], anchor: 0 }],
    };
    expect(() => checkHint(hints, 3)).not.toThrow();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test lib/pedigree-layout/__tests__/checkHint.test.ts -- --run`
Expected: FAIL

**Step 3: Rewrite checkHint**

Change signature from `checkHint(hints, sex)` to `checkHint(hints, n)` where `n` is the number of people. Remove all sex-based validation. Validate that group member indices are in range `[0, n)`.

```typescript
export function checkHint(hints: Hints, n: number): Hints {
  if (!hints.order) {
    throw new Error('Missing order component');
  }
  if (hints.order.length !== n) {
    throw new Error('Wrong length for order component');
  }

  if (!hints.groups) return hints;

  for (const group of hints.groups) {
    for (const idx of group.members) {
      if (idx < 0 || idx >= n) {
        throw new Error('Invalid group member index');
      }
    }
  }

  return hints;
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test lib/pedigree-layout/__tests__/checkHint.test.ts -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/pedigree-layout/checkHint.ts lib/pedigree-layout/__tests__/checkHint.test.ts
git commit -m "refactor: remove sex-based validation from checkHint, use GroupHint"
```

---

## Task 5: Update Test Fixtures

**Files:**
- Modify: `lib/pedigree-layout/__tests__/fixtures.ts`

**Step 1: Rewrite all fixtures to use new PedigreeInput format**

Every fixture needs `parents` array instead of `fatherIndex`/`motherIndex`, plus `gender` array. Add new fixtures for diverse family structures.

```typescript
import { type PedigreeInput } from '~/lib/pedigree-layout/types';

// Helper to reduce boilerplate
const sp = (parentIndex: number): ParentConnection => ({
  parentIndex,
  edgeType: 'social-parent',
});

export const nuclearFamily: PedigreeInput = {
  id: ['parent1', 'parent2', 'child1', 'child2', 'child3'],
  sex: ['male', 'female', 'male', 'female', 'male'],
  gender: ['man', 'woman', 'man', 'woman', 'man'],
  parents: [[], [], [sp(0), sp(1)], [sp(0), sp(1)], [sp(0), sp(1)]],
};

export const threeGeneration: PedigreeInput = {
  id: ['gp1', 'gp2', 'parent1', 'parent2', 'child'],
  sex: ['male', 'female', 'male', 'female', 'male'],
  gender: ['man', 'woman', 'man', 'woman', 'man'],
  parents: [[], [], [sp(0), sp(1)], [], [sp(2), sp(3)]],
};

export const multipleMarriages: PedigreeInput = {
  id: ['parent1', 'partner1', 'partner2', 'child1', 'child2'],
  sex: ['male', 'female', 'female', 'male', 'female'],
  gender: ['man', 'woman', 'woman', 'man', 'woman'],
  parents: [[], [], [], [sp(0), sp(1)], [sp(0), sp(2)]],
};

export const twinFamily: PedigreeInput = {
  id: ['parent1', 'parent2', 'twin1', 'twin2', 'singleton'],
  sex: ['male', 'female', 'male', 'male', 'female'],
  gender: ['man', 'woman', 'man', 'man', 'woman'],
  parents: [[], [], [sp(0), sp(1)], [sp(0), sp(1)], [sp(0), sp(1)]],
  relation: [{ id1: 2, id2: 3, code: 1 }],
};

export const wideFamily: PedigreeInput = {
  id: ['p1', 'p2', 'c1', 'c2', 'c3', 'c4', 'c5'],
  sex: ['male', 'female', 'male', 'female', 'male', 'female', 'male'],
  gender: ['man', 'woman', 'man', 'woman', 'man', 'woman', 'man'],
  parents: [[], [], [sp(0), sp(1)], [sp(0), sp(1)], [sp(0), sp(1)], [sp(0), sp(1)], [sp(0), sp(1)]],
};

// --- New inclusive fixtures ---

export const sameSeParents: PedigreeInput = {
  id: ['parent1', 'parent2', 'child'],
  sex: ['female', 'female', 'male'],
  gender: ['woman', 'woman', 'man'],
  parents: [[], [], [sp(0), sp(1)]],
};

export const singleParentWithDonor: PedigreeInput = {
  id: ['parent', 'donor', 'child'],
  sex: ['female', 'male', 'female'],
  gender: ['woman', 'man', 'woman'],
  parents: [[], [], [
    { parentIndex: 0, edgeType: 'social-parent' },
    { parentIndex: 1, edgeType: 'donor' },
  ]],
};

export const threeCoParents: PedigreeInput = {
  id: ['parent1', 'parent2', 'parent3', 'child'],
  sex: ['female', 'female', 'male', 'male'],
  gender: ['woman', 'woman', 'man', 'man'],
  parents: [[], [], [], [
    { parentIndex: 0, edgeType: 'social-parent' },
    { parentIndex: 1, edgeType: 'social-parent' },
    { parentIndex: 2, edgeType: 'co-parent' },
  ]],
};

export const surrogacyFamily: PedigreeInput = {
  id: ['parent1', 'parent2', 'surrogate', 'child'],
  sex: ['male', 'male', 'female', 'female'],
  gender: ['man', 'man', 'woman', 'woman'],
  parents: [[], [], [], [
    { parentIndex: 0, edgeType: 'social-parent' },
    { parentIndex: 1, edgeType: 'social-parent' },
    { parentIndex: 2, edgeType: 'surrogate' },
  ]],
};

export const singleParent: PedigreeInput = {
  id: ['parent', 'child'],
  sex: ['female', 'male'],
  gender: ['woman', 'man'],
  parents: [[], [sp(0)]],
};
```

**Step 2: Commit**

```bash
git add lib/pedigree-layout/__tests__/fixtures.ts
git commit -m "refactor: rewrite pedigree fixtures for inclusive parent model"
```

---

## Task 6: Update alignped1, alignped2, alignped3

**Files:**
- Modify: `lib/pedigree-layout/alignped1.ts`
- Modify: `lib/pedigree-layout/alignped2.ts`
- Modify: `lib/pedigree-layout/alignped3.ts`
- Modify: `lib/pedigree-layout/__tests__/alignped3.test.ts`

This is the core layout refactor. These three functions work together and must be updated as a unit.

**Step 1: Write failing test for alignped3 with GroupEntry**

Update `alignped3.test.ts` to use `grouplist` instead of `spouselist`:

```typescript
describe('alignped3', () => {
  it('merges two single-level trees', () => {
    const x1: AlignmentArrays = {
      n: [2], nid: [[0, 1]], pos: [[0, 1]], fam: [[0, 0]], grouplist: [],
    };
    const x2: AlignmentArrays = {
      n: [2], nid: [[2, 3]], pos: [[0, 1]], fam: [[0, 0]], grouplist: [],
    };
    const result = alignped3(x1, x2, true);
    expect(result.n[0]).toBe(4);
  });
  // ... update remaining tests similarly
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test lib/pedigree-layout/__tests__/alignped3.test.ts -- --run`
Expected: FAIL

**Step 3: Update alignped3**

Replace `spouselist` with `grouplist` in the `AlignmentArrays` merging logic. The merge algorithm itself is geometry-only (computing slide distances and overlap detection) so the core math doesn't change. The main change is carrying `grouplist` through instead of `spouselist`.

**Step 4: Update alignped2**

Replace `dad`/`mom` parameters with `parents: ParentConnection[][]`. The function sorts siblings by horder and calls `alignped1` for each — the change is passing `parents` instead of `dad`/`mom` and using `grouplist` instead of `spouselist`.

**Step 5: Update alignped1**

This is the most significant change. Currently:
- Finds spouses from spouselist using column position (col1 = male, col2 = female)
- Places them left/right by sex
- Finds children by matching `dad[j] === x && mom[j] === spouse`

New logic:
- Finds group members from grouplist: any group entry containing `x`
- Places group members by order in the group entry (no sex dependency)
- Finds children by: for each group member pair, find children whose `parents` array references both (or all) members of the group
- Support variable-size groups (1, 2, 3+ members)

Key implementation detail: the `.5` encoding for spouse markers in `nid` generalizes to marking all non-anchor group members. The anchor is the person whose subtree is being laid out (`x`); all other group members get the `.5` marker.

**Step 6: Run all alignment tests**

Run: `pnpm test lib/pedigree-layout/__tests__/alignped3.test.ts -- --run`
Expected: PASS

**Step 7: Commit**

```bash
git add lib/pedigree-layout/alignped1.ts lib/pedigree-layout/alignped2.ts lib/pedigree-layout/alignped3.ts lib/pedigree-layout/__tests__/alignped3.test.ts
git commit -m "refactor: update alignment functions for parent groups"
```

---

## Task 7: Update autohint

**Files:**
- Modify: `lib/pedigree-layout/autohint.ts`

**Step 1: Update autohint to use new types**

Key changes:
- `ped.motherIndex`/`ped.fatherIndex` → `ped.parents` for depth computation
- `SpouseHint` → `GroupHint` throughout
- `findspouse()` helper: instead of finding the opposite-sex spouse, find any other group member at the same position. Remove the sex check entirely — just find adjacent nodes that share a group marker.
- `LayoutFn` type: update to match new `PedigreeInput` signature

The `findspouse` function becomes `findGroupMember`:

```typescript
function findGroupMember(mypos: number, pl: PedigreeLayout, lev: number): number {
  let lpos = mypos;
  while (lpos > 0 && pl.group[lev]![lpos - 1]! > 0) lpos--;
  let rpos = mypos;
  while (pl.group[lev]![rpos]! > 0) rpos++;
  if (rpos === lpos) throw new Error('autohint bug 3');
  // Return first non-self group member
  const myNid = pl.nid[lev]![mypos]!;
  for (let p = lpos; p <= rpos; p++) {
    if (pl.nid[lev]![p] !== myNid) return p;
  }
  throw new Error('autohint bug 4');
}
```

The spouse hint generation (switch/case block at line 377) outputs `GroupHint[]` instead of `SpouseHint[]`. The logic remains the same — it's ordering hints for duplicate resolution — but uses `members` array instead of `leftIndex`/`rightIndex`.

**Step 2: Run typecheck**

Run: `pnpm typecheck 2>&1 | grep 'autohint' | head -10`
Expected: No type errors in autohint.ts

**Step 3: Commit**

```bash
git add lib/pedigree-layout/autohint.ts
git commit -m "refactor: update autohint for parent groups, remove sex-based logic"
```

---

## Task 8: Update alignPedigree (Main Entry Point)

**Files:**
- Modify: `lib/pedigree-layout/alignPedigree.ts`
- Modify: `lib/pedigree-layout/__tests__/alignPedigree.test.ts`

**Step 1: Write failing tests with new fixtures**

```typescript
describe('alignPedigree', () => {
  it('lays out a nuclear family', () => {
    const result = alignPedigree(nuclearFamily, { hints: { order: [1, 2, 3, 4, 5] } });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
    const allIds = result.nid.flatMap((row, i) =>
      row.slice(0, result.n[i]).filter((v) => v >= 0),
    );
    for (let i = 0; i < 5; i++) {
      expect(allIds).toContain(i);
    }
  });

  it('lays out same-sex parents', () => {
    const result = alignPedigree(sameSeParents, { hints: { order: [1, 2, 3] } });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
    const allIds = result.nid.flatMap((row, i) =>
      row.slice(0, result.n[i]).filter((v) => v >= 0),
    );
    expect(allIds).toContain(0);
    expect(allIds).toContain(1);
    expect(allIds).toContain(2);
  });

  it('lays out single parent', () => {
    const result = alignPedigree(singleParent, { hints: { order: [1, 2] } });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
  });

  it('lays out three co-parents', () => {
    const result = alignPedigree(threeCoParents, { hints: { order: [1, 2, 3, 4] } });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
    // Parent level should have 3 people
    expect(result.n[0]).toBe(3);
  });

  it('lays out surrogacy family with auxiliary node', () => {
    const result = alignPedigree(surrogacyFamily, { hints: { order: [1, 2, 3, 4] } });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
    // All 4 people should appear
    const allIds = result.nid.flatMap((row, i) =>
      row.slice(0, result.n[i]).filter((v) => v >= 0),
    );
    for (let i = 0; i < 4; i++) {
      expect(allIds).toContain(i);
    }
  });

  it('does NOT throw when a person has only one parent', () => {
    expect(() =>
      alignPedigree(singleParent, { hints: { order: [1, 2] } }),
    ).not.toThrow();
  });

  it('produces non-overlapping positions', () => {
    const result = alignPedigree(wideFamily, { hints: { order: [1, 2, 3, 4, 5, 6, 7] } });
    for (let lev = 0; lev < result.n.length; lev++) {
      const nn = result.n[lev]!;
      if (nn <= 1) continue;
      const positions = result.pos[lev]!.slice(0, nn);
      for (let j = 0; j < positions.length - 1; j++) {
        expect(positions[j + 1]!).toBeGreaterThan(positions[j]!);
      }
    }
  });

  it('marks parent groups', () => {
    const result = alignPedigree(nuclearFamily, { hints: { order: [1, 2, 3, 4, 5] } });
    const hasGroup = result.group.some((row) => row.some((v) => v > 0));
    expect(hasGroup).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test lib/pedigree-layout/__tests__/alignPedigree.test.ts -- --run`
Expected: FAIL

**Step 3: Rewrite alignPedigree**

Key changes:
1. Remove the "0 or 2 parents" validation (line 37-44)
2. Replace `dad`/`mom` with extracting parent indices from `ped.parents`
3. Build parent groups instead of spouse list:
   - For each child, collect their social-parent and co-parent indices as a group
   - Deduplicate groups (multiple children may share the same parent group)
   - Partner relations (code 4) also form groups
4. Pass `ped.parents` to `kindepth` instead of `mom`/`dad`
5. Build `GroupEntry[]` instead of `SpouseEntry[]` — each entry lists the member indices of a parent group
6. Find founders: people with no parents whose group members also have no parents
7. Pass `parents` to `alignped1` instead of `dad`/`mom`
8. The "unhash" step produces `group` matrix instead of `spouse` matrix
9. Consanguinity detection: for each group, check ancestor overlap between any pair of members
10. Pass `parents` to `ancestor`/`chaseup` instead of `mom`/`dad`

**Step 4: Run tests to verify they pass**

Run: `pnpm test lib/pedigree-layout/__tests__/alignPedigree.test.ts -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/pedigree-layout/alignPedigree.ts lib/pedigree-layout/__tests__/alignPedigree.test.ts
git commit -m "refactor: update alignPedigree for flexible parent groups"
```

---

## Task 9: Update alignped4 (QP Optimization)

**Files:**
- Modify: `lib/pedigree-layout/alignped4.ts`

**Step 1: Update alignped4 signature**

Change `spouse: boolean[][]` parameter to `group: boolean[][]` (same semantics — marks adjacent nodes in the same group). The QP optimization logic is geometry-only — it minimizes horizontal displacement subject to ordering constraints. The `spouse` boolean matrix told it which adjacent pairs are connected. `group` does the same thing.

This is largely a rename: `spouse` → `group` throughout the function. The constraint-building logic that pairs adjacent marked nodes remains the same.

**Step 2: Run typecheck**

Run: `pnpm typecheck 2>&1 | grep 'alignped4' | head -10`
Expected: No type errors

**Step 3: Commit**

```bash
git add lib/pedigree-layout/alignped4.ts
git commit -m "refactor: rename spouse to group in alignped4 QP optimization"
```

---

## Task 10: Update Connectors

**Files:**
- Modify: `lib/pedigree-layout/connectors.ts`
- Modify: `lib/pedigree-layout/__tests__/connectors.test.ts`

**Step 1: Write failing tests for new connector types**

```typescript
describe('computeConnectors', () => {
  const scaling: ScalingParams = {
    boxWidth: 0.5, boxHeight: 0.5, legHeight: 0.25, hScale: 1, vScale: 1,
  };

  // Standard 2-parent layout (same structure as before, renamed fields)
  const layout: PedigreeLayout = {
    n: [2, 3],
    nid: [[1, 2, 0], [3, 4, 5]],
    pos: [[0, 2, 0], [0, 1, 2]],
    fam: [[0, 0, 0], [1, 1, 1]],
    group: [[1, 0, 0], [0, 0, 0]],  // replaces spouse
    twins: null,
  };

  // Input needed for edge type info
  const parents: ParentConnection[][] = [
    [], [], [], // nodes 0-2 are founders
    [{ parentIndex: 1, edgeType: 'social-parent' }, { parentIndex: 2, edgeType: 'social-parent' }],
    [{ parentIndex: 1, edgeType: 'social-parent' }, { parentIndex: 2, edgeType: 'social-parent' }],
    [{ parentIndex: 1, edgeType: 'social-parent' }, { parentIndex: 2, edgeType: 'social-parent' }],
  ];

  it('produces parent group connectors', () => {
    const connectors = computeConnectors(layout, scaling, parents);
    expect(connectors.groupLines.length).toBeGreaterThan(0);
    expect(connectors.groupLines[0]!.type).toBe('parent-group');
  });

  it('produces parent-child connectors with edgeType', () => {
    const connectors = computeConnectors(layout, scaling, parents);
    expect(connectors.parentChildLines.length).toBeGreaterThan(0);
    expect(connectors.parentChildLines[0]!.edgeType).toBe('social-parent');
  });

  it('produces auxiliary connectors for donor edges', () => {
    const donorLayout: PedigreeLayout = {
      n: [3, 1],
      nid: [[0, 1, 2], [3, 0, 0]],
      pos: [[0, 1, 3], [0.5, 0, 0]],
      fam: [[0, 0, 0], [1, 0, 0]],
      group: [[1, 0, 0], [0, 0, 0]],
      twins: null,
    };
    const donorParents: ParentConnection[][] = [
      [], [], [],
      [
        { parentIndex: 0, edgeType: 'social-parent' },
        { parentIndex: 1, edgeType: 'social-parent' },
        { parentIndex: 2, edgeType: 'donor' },
      ],
    ];
    const connectors = computeConnectors(donorLayout, scaling, donorParents);
    expect(connectors.auxiliaryLines.length).toBe(1);
    expect(connectors.auxiliaryLines[0]!.edgeType).toBe('donor');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test lib/pedigree-layout/__tests__/connectors.test.ts -- --run`
Expected: FAIL

**Step 3: Rewrite computeConnectors**

Add `parents: ParentConnection[][]` parameter. Key changes:

1. **Group lines** (replacing spouse lines): Same geometry — horizontal line between adjacent group members. Read from `layout.group` instead of `layout.spouse`.

2. **Parent-child lines**: Same geometry, but now carry `edgeType`. Determine the primary edge type for each parent-child family by looking at the `parents` array of the children in that family. Social-parent connections use the primary connector style.

3. **Auxiliary lines** (new): For each child, find parent connections with `edgeType` of `'donor'`, `'surrogate'`, or `'bio-parent'`. Generate a direct line segment from the auxiliary node's position to the child's position. These bypass the sibling bar.

4. Return type uses new `PedigreeConnectors` shape: `groupLines`, `parentChildLines`, `auxiliaryLines`, `twinIndicators`, `duplicateArcs`.

**Step 4: Run tests to verify they pass**

Run: `pnpm test lib/pedigree-layout/__tests__/connectors.test.ts -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/pedigree-layout/connectors.ts lib/pedigree-layout/__tests__/connectors.test.ts
git commit -m "refactor: update connectors for parent groups and auxiliary edges"
```

---

## Task 11: Run Full Test Suite & Fix Remaining Issues

**Files:**
- Potentially any file in `lib/pedigree-layout/`

**Step 1: Run all pedigree-layout tests**

Run: `pnpm test lib/pedigree-layout -- --run`
Expected: All tests should pass. If any fail, investigate and fix.

**Step 2: Run typecheck**

Run: `pnpm typecheck 2>&1 | grep 'pedigree-layout' | head -40`
Expected: No type errors in pedigree-layout files.

**Step 3: Run linter**

Run: `pnpm lint -- --fix`
Expected: No lint errors.

**Step 4: Run formatter**

Run: `pnpm prettier --write 'lib/pedigree-layout/**/*.ts'`

**Step 5: Commit any fixes**

```bash
git add lib/pedigree-layout/
git commit -m "fix: resolve remaining issues from pedigree-layout refactor"
```

---

## Task 12: Verify No Regressions for Traditional Families

**Files:**
- Modify: `lib/pedigree-layout/__tests__/alignPedigree.test.ts`

**Step 1: Add regression tests**

Verify that traditional 2-parent families produce the same layout geometry as before. These tests ensure the refactor didn't break the core algorithm for the common case.

```typescript
describe('traditional family regression', () => {
  it('nuclear family: 2 generations, parents above children', () => {
    const result = alignPedigree(nuclearFamily, { hints: { order: [1, 2, 3, 4, 5] } });
    // Parents at level 0, children at level 1
    expect(result.n.filter((v) => v > 0).length).toBe(2);
    expect(result.n[0]).toBe(2); // 2 parents
    expect(result.n[1]).toBe(3); // 3 children
  });

  it('three generations: grandparents -> parents -> child', () => {
    const result = alignPedigree(threeGeneration, { hints: { order: [1, 2, 3, 4, 5] } });
    expect(result.n.filter((v) => v > 0).length).toBe(3);
  });

  it('multiple marriages: one parent with two partner groups', () => {
    const result = alignPedigree(multipleMarriages, { hints: { order: [1, 2, 3, 4, 5] } });
    expect(result.n.filter((v) => v > 0).length).toBe(2);
    // Parent level should have 3 people (parent + 2 partners)
    expect(result.n[0]).toBe(3);
  });

  it('twin handling preserved', () => {
    const result = alignPedigree(twinFamily, { hints: { order: [1, 2, 3, 4, 5] } });
    expect(result.twins).not.toBeNull();
  });
});
```

**Step 2: Run tests**

Run: `pnpm test lib/pedigree-layout/__tests__/alignPedigree.test.ts -- --run`
Expected: PASS

**Step 3: Commit**

```bash
git add lib/pedigree-layout/__tests__/alignPedigree.test.ts
git commit -m "test: add regression tests for traditional family layouts"
```

---

## Summary

| Task | What Changes | Risk |
|------|-------------|------|
| 1 | Type definitions | Low — types only |
| 2 | Utils (ancestor/chaseup) | Low — leaf functions |
| 3 | kindepth | Medium — depth computation is foundational |
| 4 | checkHint | Low — simple validation |
| 5 | Test fixtures | Low — test data only |
| 6 | alignped1/2/3 | **High** — core layout algorithm |
| 7 | autohint | Medium — complex duplicate resolution |
| 8 | alignPedigree | **High** — main entry point |
| 9 | alignped4 | Low — mostly renaming |
| 10 | Connectors | Medium — new connector types |
| 11 | Full test suite | Low — integration verification |
| 12 | Regression tests | Low — test only |

**Critical path:** Tasks 1 → 2 → 3 → 5 → 6 → 8 → 10 → 11. Tasks 4, 7, 9 can be done in parallel with their neighbors.

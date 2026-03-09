# Inclusive Pedigree Layout Design

## Problem

The PedigreeLayout feature makes heteronormative assumptions that exclude many real family structures:

1. **Parents are always paired**, visually implying a romantic/sexual relationship when the actual relationship is co-parenthood
2. **No same-sex parents** — the layout algorithm assigns father/mother roles by sex, making same-sex parent pairs impossible
3. **No distinction between social and biological parenthood** — adoption, surrogacy, sperm/egg donation, and other family formation paths are invisible
4. **Sex drives layout positioning** — males are placed left, females right, throughout the algorithm

The visualization should reflect the primacy of social ties (the participant's subjective view of family), with biological-only relationships (donors, surrogates) rendered as secondary/auxiliary connections.

## Design Decisions

- **Separate edge types** (B) over edge metadata — richer type system for `social-parent`, `bio-parent`, `donor`, `surrogate`, `co-parent`, `partner`
- **Hybrid layout approach** (C) — keep `kinship2` algorithm's spacing/optimization math, strip all sex-dependent logic, replace with role-based positioning
- **Generic structural labels** (C) — use "Parent", "Grandparent", "Sibling" rather than gendered terms
- **Auxiliary nodes always visible** (A) — donors/surrogates appear in the tree with de-emphasized styling
- **Fully flexible parent counts** (C) — no constraints on number or type of parent edges per child
- **Sex field retained**, new `gender` field added — sex for biological data, gender for visual display of nodes

## Data Model

### New Types

```typescript
type Gender =
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

type ParentEdgeType =
  | 'social-parent'
  | 'bio-parent'
  | 'donor'
  | 'surrogate';

type ParentConnection = {
  parentIndex: number;
  edgeType: ParentEdgeType;
};
```

### PedigreeInput Changes

Replace `fatherIndex`/`motherIndex` with flexible parent connections:

```typescript
type PedigreeInput = {
  id: string[];
  sex: Sex[];
  gender: Gender[];
  parents: ParentConnection[][];  // parents[i] = connections for person i
  relation?: Relation[];
  hints?: Hints;
};
```

### RelationCode Expansion

```typescript
type RelationCode = 1 | 2 | 3 | 4 | 5 | 6;
// 1=MZ twin, 2=DZ twin, 3=unknown twin, 4=partner
// 5=co-parent, 6=donor/surrogate relation
```

## Layout Algorithm

### Parent Groups

The central concept replacing father/mother pairs. A **parent group** is the set of nodes who are `social-parent` or `co-parent` to the same children. This is the unit the layout positions together on a generation row.

- 2-parent group: positioned as adjacent pair (same visual result as current)
- 3+-parent group: occupies N adjacent columns with a spanning bar
- 1-parent group: single node, parent link drops directly from it
- Auxiliary nodes (donor, surrogate, bio-parent): placed in the same generation but offset from the parent group with additional horizontal spacing

### kindepth Changes

Replace `midx`/`didx` iteration with a `parentOf` lookup derived from the `parents` array. Depth assignment logic is unchanged — children are one generation below their parents. Spouse/partner alignment generalizes to parent group alignment: all members of a parent group are aligned to the same depth.

### alignPedigree Changes

- Remove "everyone must have 0 or 2 parents" validation
- Build parent groups from `parents` array: group parents who share children
- Parent-group list replaces spouse list (entries describe N-node groups, not just pairs)

### alignped1 Changes

- Place parent group members by array order (first-listed leftmost) instead of by sex
- Child lookup: find children whose `parents` array references any members of the current parent group
- Left/right distribution of multiple partners uses order, not sex

### autohint / checkHint Changes

- `SpouseHint` becomes `GroupHint` describing ordering within a parent group
- No sex-based left/right validation

### Auxiliary Node Placement

Auxiliary biological nodes are not part of parent groups. They are:
1. Assigned the same generation depth as the parent group they relate to
2. Positioned as extra columns with additional horizontal spacing from the parent group
3. Connected to children via separate connectors (not through the sibling bar)

### Consanguinity Detection

Generalized from checking ancestor overlap between 2 spouses to checking overlap between any pair of parent group members.

## Connector Geometry

### New Connector Types

```typescript
type EdgeStyle = 'solid' | 'dashed' | 'dotted';
type EdgeWeight = 'heavy' | 'medium' | 'light';

type ParentChildConnector = {
  type: 'parent-child';
  edgeType: ParentEdgeType;
  uplines: LineSegment[];
  siblingBar: LineSegment;
  parentLink: LineSegment[];
};

type ParentGroupConnector = {
  type: 'parent-group';
  segment: LineSegment;
  double: boolean;
  doubleSegment?: LineSegment;
};

type AuxiliaryConnector = {
  type: 'auxiliary';
  edgeType: 'donor' | 'surrogate' | 'bio-parent';
  segment: LineSegment;
};
```

### Visual Style Mapping

| Edge Type | Line Style | Weight | Opacity |
|-----------|-----------|--------|---------|
| `social-parent` | solid | heavy (5px) | 1.0 |
| `co-parent` | solid | heavy (5px) | 1.0 |
| `bio-parent` | dashed | medium (3px) | 0.8 |
| `donor` | dotted | light (2px) | 0.6 |
| `surrogate` | dotted | light (2px) | 0.6 |
| `partner` | solid double | heavy (5px) | 1.0 |

### Parent Link Geometry

- **2 parents**: midpoint between them (same as current)
- **3+ parents**: midpoint of the full parent group span
- **1 parent**: drops directly from the single parent node
- **Auxiliary connections**: separate line from auxiliary node to child, routed to avoid overlap with primary connectors

### Parent Group Bar

Replaces the spouse line. Horizontal bar spanning all members of a parent group. Communicates "these people parent together" without implying romantic partnership. Partner relationships (separate from parenting) use the existing double-line connector between partner nodes.

## Node Rendering

### Gender-Based Display

Gender drives node shape (replacing sex-based shapes):

| Gender | Node Shape |
|--------|-----------|
| `man` | Square |
| `woman` | Circle |
| `non-binary` | Diamond |
| `transgender-man` | Square with indicator |
| `transgender-woman` | Circle with indicator |
| `genderqueer` | Diamond |
| `agender` | Diamond |
| `two-spirit` | Diamond |
| `other` | Diamond |
| `unknown` | Triangle (down) |

### Auxiliary Node Styling

Donors and surrogates are visually de-emphasized:
- Reduced opacity (0.6)
- Smaller node size (75% of standard)
- Dashed border
- Role label ("Donor", "Surrogate")

## Adapter Layer

`storeToPedigreeInput` changes:

1. For each node, collect all edges where the node is a target (child)
2. Group source nodes by edge type into `ParentConnection[]`
3. Build `parents` array — no sex-based assignment
4. Build `relation` array — partner edges become code 4, co-parent edges become code 5
5. Pass `gender` array from store nodes (default `'unknown'`)
6. Remove "0 or 2 parents" enforcement — pass through whatever the store contains

## Scenario Walkthrough

### Same-sex couple with adopted child
- Parent group: [Parent A, Parent B] both `social-parent`
- Solid connectors, identical to traditional 2-parent rendering

### Same-sex couple with donor
- Parent group: [Parent A, Parent B] both `social-parent`
- Donor node offset to side, dotted line to child

### Single parent by choice with sperm donor
- Parent group: [Parent A] single `social-parent`
- Parent link drops directly from A
- Donor node offset, dotted connector

### Surrogacy with two fathers
- Parent group: [Father A, Father B] both `social-parent`
- Surrogate + egg donor as auxiliary nodes, dotted connectors

### Blended family (step-parent)
- Social parents grouped (bio + step as `social-parent`)
- Non-custodial bio-parent as auxiliary `bio-parent` node, dashed connector

### Three co-parents
- Parent group: [A, B, C] — social-parent + social-parent + co-parent
- Parent group bar spans all three, parent link drops from midpoint

### Traditional two-parent family
- Two `social-parent` edges — renders identically to current behavior

## Migration

1. **`PedigreeInput`**: breaking change — new `parents` array replaces `fatherIndex`/`motherIndex`. Only the adapter layer consumes this, so migration is contained.
2. **`PedigreeLayout` output**: `spouse` matrix becomes `group` matrix indicating parent group membership.
3. **Store edges**: expand from `'parent' | 'partner'` to full edge type set. Existing `'parent'` edges default to `'social-parent'`.
4. **Tests**: update fixtures to use new `parents` format. Existing structures should produce equivalent layouts.

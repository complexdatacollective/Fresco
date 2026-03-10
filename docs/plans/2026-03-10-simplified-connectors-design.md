# Simplified Connector Rendering Design

## Goal

Simplify pedigree connector rendering to focus on the subjective (social) family,
reduce heteronormative assumptions, and provide a clearer visual hierarchy.

## Principles

1. The social family is primary — solid lines for all active parenting relationships
2. Biological ties are secondary — dashed/dotted for non-parenting genetic contributors
3. Structure drives rendering — partner status determines connector shape, not edge type
4. Biology is tracked for computation — `biological` flag on parent edges enables
   bio-relative analysis without affecting the visual hierarchy

## Data Model

### Edge Types

```
ParentEdgeType = 'parent' | 'donor' | 'surrogate'
```

| Old Type        | New Type    | Notes                                                      |
| --------------- | ----------- | ---------------------------------------------------------- |
| `social-parent` | `parent`    | Default. `biological` flag added.                          |
| `bio-parent`    | `parent`    | Use `biological: true`. Rendering determined by structure. |
| `co-parent`     | `parent`    | Partner status determines rendering.                       |
| `donor`         | `donor`     | Unchanged.                                                 |
| `surrogate`     | `surrogate` | Unchanged.                                                 |

### Parent Connection

```typescript
type ParentConnection = {
  parentIndex: number;
  edgeType: ParentEdgeType;
  biological?: boolean; // defaults to true. Only meaningful for 'parent' edges.
};
```

### Partner Edge

```typescript
// StoreEdge partner variant
{
  type: 'partner';
  active: boolean;
}

// PartnerConnection (layout layer)
type PartnerConnection = {
  partnerIndex1: number;
  partnerIndex2: number;
  active: boolean;
};
```

The `current` field on partner edges is renamed to `active`.

### Bio-Relative Flag

Each node receives an `isBioRelative: boolean` flag computed by traversing from ego:

- Follow `parent` edges where `biological !== false` (up and down)
- Follow `donor` edges (up only — donors don't have children through that edge)
- Skip `surrogate` edges

## Connector Rendering Rules

### Between partner parents (horizontal line)

A single solid horizontal line connects two nodes that:

1. Share one or more children (`parent` edges to the same child)
2. Have a `partner` edge between them

No double lines. No visual distinction between active and ex partnerships
(the `active` flag is stored but not currently rendered differently).

### Between non-partner co-parents (diagonal join)

When two or more parents share children but have NO partner edge between them,
AND no other parents of those children are in a partner group:

Each parent gets a diagonal line from their node that joins the vertical
descending line to the children. No horizontal line between the co-parents.

### Non-partnered parent with partnered co-parents (dashed auxiliary)

**Key rule:** A `parent` receives dashed auxiliary treatment (3px, 0.8 opacity)
ONLY when:

1. The parent has NO partner edge with ANY other parent of the same child, AND
2. At least one OTHER parent of the same child IS in a partner group

This covers the case of a non-custodial biological parent who is separate from
the child's primary family unit (e.g., a known birth father where the child is
raised by their mother and her partner).

**This rule does NOT apply when:**

- The parent is the ONLY parent (single parent) — solid line
- ALL parents of the child lack partner edges (co-parents) — solid diagonal joins

### Donor (dotted auxiliary)

Dotted line (2px, 0.6 opacity) from donor node to child. Unchanged.

### Surrogate (dotted auxiliary)

Dotted line (2px, 0.6 opacity) from surrogate node to child. Unchanged.

## PedigreeKey Entries

| Label              | Visual           |
| ------------------ | ---------------- |
| Parent             | Solid line, 5px  |
| Biological parent  | Dashed line, 3px |
| Egg or Sperm Donor | Dotted line, 2px |
| Surrogate Carrier  | Dotted line, 2px |

## New Storybook Example

**"Known Bio Parent"** — demonstrates a biological parent separate from named
social parents:

- Child raised by Mom (social, `biological: false`) and Step-Dad (social, `biological: false`)
- Mom and Step-Dad are partners
- Known Bio-Dad (`biological: true`) shown separately with dashed connector
- Bio-Dad's parents (maternal grandparents through biology) shown above

## Migration Scope

247 occurrences of `social-parent`, `bio-parent`, `co-parent` across 23 files.
All in `/lib/*` — no application route changes needed.

### High-impact areas

- Type definitions: `types.ts`, `session.ts`
- Layout algorithm: `alignPedigree.ts` (auxiliary edge filtering)
- Connector rendering: `connectors.ts`, `EdgeRenderer.tsx`
- Store: `store.ts`, `FamilyTreeProvider.tsx`
- Wizard steps: `ParentsDetailStep.tsx`, `BioParentsStep.tsx`, `fieldOptions.ts`
- Tests: 6 test files (~62 occurrences)
- Stories: `PedigreeLayout.stories.tsx` (~83 occurrences)

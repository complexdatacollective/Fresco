# QuickStart Wizard Design

## Goal

Replace the single-page QuickStartForm with a multi-step wizard that collects names, sex, gender, and relationship types for all family members before generating the pedigree.

## Architecture

Uses the existing `WizardDialog` system (`useDialog({ type: 'wizard' })`). Each wizard step is a standalone component that reads/writes accumulated data via `useWizard()`. Conditional steps are skipped using `goToStep()` and `setBeforeNext()`.

## Wizard Steps

### Step 1: Parents — Count

- NumberCounterField: "How many parents do you have?" (0-20, default 2)

### Step 2: Parents — Details (conditional: parentCount > 0)

For each parent:

- Name (InputField)
- Sex (RadioGroup: Male / Female)
- Gender (RadioGroup: Man / Woman / Unknown)
- Relationship type (RadioGroup: Biological parent / Social parent / Donor / Surrogate / Co-parent)

### Step 3: Biological Parents (conditional: fewer than 2 parents marked `bio-parent`)

Asks about missing biological parents (up to 2 minus bio-parent count from step 2).

For each missing bio-parent:

- "Do you know this person's name?" toggle
- Name (InputField, conditional on toggle)
- Sex (RadioGroup)
- Gender (RadioGroup)

Unknown-name parents are created as nodes with empty labels.

### Step 4: Siblings — Count

- NumberCounterField: "How many siblings do you have?" (0-20, default 0)

### Step 5: Siblings — Details (conditional: siblingCount > 0)

For each sibling:

- Name (InputField)
- Sex (RadioGroup)
- Gender (RadioGroup)

### Step 6: Partner

- ToggleField: "Do you have a partner?"
- If yes: Name, Sex, Gender fields

### Step 7: Children with Partner — Count (conditional: hasPartner)

- NumberCounterField (0-20, default 0)

### Step 8: Children with Partner — Details (conditional: count > 0)

For each child: Name, Sex, Gender

### Step 9: Other Children — Count

- NumberCounterField (0-20, default 0)

### Step 10: Other Children — Details (conditional: count > 0)

For each child: Name, Sex, Gender

## Data Flow

1. Wizard accumulates data via `useWizard().setStepData()`.
2. `onFinish` transforms wizard data into `addNode`/`addEdge` calls on the family tree store.
3. `generateQuickStartNetwork` is updated to accept the richer data structure.

## Edge Types Generated

| Source | Edge Type |
|--------|-----------|
| Parent marked bio-parent | `bio-parent` |
| Parent marked social-parent | `social-parent` |
| Parent marked donor | `donor` |
| Parent marked surrogate | `surrogate` |
| Parent marked co-parent | `co-parent` |
| Bio-parent from follow-up step | `bio-parent` |
| Partner | `partner` (current: true) |
| All parents paired as partners | `partner` (current: true) |

## Model Changes

- `NodeData`: add `gender?: 'man' | 'woman' | 'unknown'` alongside existing `sex`
- `QuickStartData`: expand to carry per-person detail (name, sex, gender, relationship type)

## Files Affected

- `QuickStartForm.tsx` — replace with wizard dialog trigger
- New: `QuickStartWizardSteps.tsx` — one component per wizard step
- `store.ts` — expand `QuickStartData`, update `generateQuickStartNetwork`

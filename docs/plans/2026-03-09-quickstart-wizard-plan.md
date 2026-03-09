# QuickStart Wizard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single-page QuickStartForm with a multi-step wizard dialog that collects names, sex, gender, and relationship types for all family members.

**Architecture:** Uses the existing `WizardDialog` system (`useDialog({ type: 'wizard' })`). Each wizard step is a standalone component using `useWizard()` context with `UnconnectedField` for state management. The wizard accumulates data via `setStepData()`, and `onFinish` transforms it into `addNode`/`addEdge` calls. Conditional steps (bio-parent follow-up, detail steps for zero-count categories) use `setBeforeNext` + `goToStep` to skip.

**Tech Stack:** React, TypeScript, `@base-ui/react`, existing wizard dialog system (`~/lib/dialogs`), existing form field components (`~/lib/form`)

---

## Key Reference Files

Before starting, familiarize yourself with these files:

- **Wizard dialog API:** `lib/dialogs/DialogProvider.tsx` (types: `WizardDialog`, `WizardStep`)
- **Wizard hook:** `lib/dialogs/useWizard.tsx` (context: `data`, `setStepData`, `setBeforeNext`, `goToStep`, `setNextEnabled`)
- **Wizard examples:** `lib/dialogs/WizardDialog.stories.tsx` (patterns for `UnconnectedField` in wizard steps)
- **Form fields:** `lib/form/components/Field/UnconnectedField.tsx`, `lib/form/components/fields/InputField.tsx`, `lib/form/components/fields/RadioGroup.tsx`, `lib/form/components/fields/ToggleField.tsx`, `lib/form/components/fields/NumberCounterField.tsx`
- **Store:** `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts` (types: `QuickStartData`, `NodeData`, `StoreEdge`, `generateQuickStartNetwork`)
- **Pedigree types:** `lib/pedigree-layout/types.ts` (types: `Sex`, `Gender`, `ParentEdgeType`)
- **Current QuickStartForm:** `lib/interviewer/Interfaces/FamilyTreeCensus/components/QuickStartForm.tsx`
- **Current consumer:** `lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeCensus.tsx`

## Important Patterns

**Wizard step pattern** (from `WizardDialog.stories.tsx`):

```tsx
function MyStep() {
  const { data, setStepData, setNextEnabled } = useWizard();
  const [value, setValue] = useState((data.myKey as string) ?? '');

  return (
    <UnconnectedField
      name="myField"
      label="My Label"
      component={InputField}
      value={value}
      onChange={(v) => {
        const newVal = v ?? '';
        setValue(newVal);
        setStepData({ myKey: newVal });
      }}
    />
  );
}
```

**Conditional step skipping** (via `setBeforeNext`):

```tsx
function CountStep() {
  const { data, setStepData, setBeforeNext, goToStep, currentStep } = useWizard();
  // ...
  useEffect(() => {
    setBeforeNext(() => {
      if (count === 0) {
        goToStep(currentStep + 2); // skip details step
        return false;
      }
      return true;
    });
  }, [count, setBeforeNext, goToStep, currentStep]);
}
```

**Sex/Gender types** (from `lib/pedigree-layout/types.ts`):
- `Sex`: `'male' | 'female' | 'unknown' | 'terminated'`
- `Gender`: `'man' | 'woman' | 'non-binary' | 'transgender-man' | 'transgender-woman' | 'genderqueer' | 'agender' | 'two-spirit' | 'other' | 'unknown'`
- `ParentEdgeType`: `'social-parent' | 'bio-parent' | 'donor' | 'surrogate' | 'co-parent'`

**NodeData** currently has `sex?: 'male' | 'female'` — needs expanding.

---

## Task 1: Expand NodeData and QuickStartData types

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts`

**Step 1: Update NodeData type**

In `store.ts`, change the `sex` field and add `gender`:

```typescript
// Before:
export type Sex = 'male' | 'female';

export type NodeData = {
  label: string;
  sex?: Sex;
  isEgo: boolean;
  readOnly?: boolean;
  interviewNetworkId?: string;
  diseases?: Map<string, boolean>;
};

// After:
import { type Gender, type ParentEdgeType, type Sex } from '~/lib/pedigree-layout/types';

// Remove the local Sex type — use the one from pedigree-layout/types instead.
// Note: pedigree-layout Sex includes 'unknown' | 'terminated' in addition to 'male' | 'female'.

export type NodeData = {
  label: string;
  sex?: Sex;
  gender?: Gender;
  isEgo: boolean;
  readOnly?: boolean;
  interviewNetworkId?: string;
  diseases?: Map<string, boolean>;
};
```

Remove the local `export type Sex = 'male' | 'female';` line. Update the existing `import { type ParentEdgeType } from '~/lib/pedigree-layout/types';` to also import `Sex` and `Gender`.

**Step 2: Define new QuickStartData type**

Replace the existing `QuickStartData` with a richer structure:

```typescript
export type PersonDetail = {
  name: string;
  sex?: Sex;
  gender?: Gender;
};

export type ParentDetail = PersonDetail & {
  edgeType: ParentEdgeType;
};

export type BioParentDetail = PersonDetail & {
  nameKnown: boolean;
};

export type QuickStartData = {
  parents: ParentDetail[];
  bioParents: BioParentDetail[];
  siblings: PersonDetail[];
  partner: (PersonDetail & { hasPartner: true }) | { hasPartner: false };
  childrenWithPartner: PersonDetail[];
  otherChildren: PersonDetail[];
};
```

**Step 3: Check for other references to the old Sex type**

Search the codebase for imports of `Sex` from `store.ts`. If any exist, update them to import from `~/lib/pedigree-layout/types` instead. Also check `pedigreeAdapter.ts` which has its own `mapSex` function — it should still work since pedigree-layout `Sex` is a superset.

**Step 4: Update syncMetadata to include gender**

In the `syncMetadata` action, add `gender` to the serialized node data:

```typescript
syncMetadata: () => {
  const { nodes, edges } = get().network;

  const serializedNodes = [...nodes.entries()].map(([id, node]) => ({
    id,
    interviewNetworkId: node.interviewNetworkId,
    label: node.label,
    sex: node.sex,
    gender: node.gender,
    isEgo: node.isEgo,
  }));
  // ... rest unchanged
```

**Step 5: Run typecheck**

Run: `pnpm typecheck`
Expected: May have errors in files that imported the local `Sex` type — fix those.

**Step 6: Run lint and format**

Run: `pnpm lint --fix && pnpm prettier --write lib/interviewer/Interfaces/FamilyTreeCensus/store.ts`

**Step 7: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/store.ts
git commit -m "feat: expand NodeData with gender, define rich QuickStartData types"
```

---

## Task 2: Shared field options and PersonFields component

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/fieldOptions.ts`
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PersonFields.tsx`

**Step 1: Create field options constants**

Create `fieldOptions.ts` with reusable radio option arrays:

```typescript
import { type Gender, type ParentEdgeType, type Sex } from '~/lib/pedigree-layout/types';

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'transgender-man', label: 'Transgender man' },
  { value: 'transgender-woman', label: 'Transgender woman' },
  { value: 'genderqueer', label: 'Genderqueer' },
  { value: 'agender', label: 'Agender' },
  { value: 'two-spirit', label: 'Two-spirit' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];

export const PARENT_EDGE_TYPE_OPTIONS: { value: ParentEdgeType; label: string }[] = [
  { value: 'bio-parent', label: 'Biological parent' },
  { value: 'social-parent', label: 'Social parent' },
  { value: 'donor', label: 'Donor' },
  { value: 'surrogate', label: 'Surrogate' },
  { value: 'co-parent', label: 'Co-parent' },
];
```

**Step 2: Create PersonFields component**

Create `PersonFields.tsx` — a reusable set of Name + Sex + Gender fields for a single person. Uses `UnconnectedField` since wizard steps manage their own state.

```tsx
'use client';

import { type Gender, type Sex } from '~/lib/pedigree-layout/types';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import { GENDER_OPTIONS, SEX_OPTIONS } from './fieldOptions';

type PersonFieldsProps = {
  index: number;
  prefix: string;
  name: string;
  sex: Sex | undefined;
  gender: Gender | undefined;
  onNameChange: (value: string) => void;
  onSexChange: (value: Sex) => void;
  onGenderChange: (value: Gender) => void;
};

export default function PersonFields({
  index,
  prefix,
  name,
  sex,
  gender,
  onNameChange,
  onSexChange,
  onGenderChange,
}: PersonFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <UnconnectedField
        name={`${prefix}-${index}-name`}
        label="Name"
        component={InputField}
        placeholder="Enter name"
        value={name}
        onChange={(v) => onNameChange(v ?? '')}
      />
      <UnconnectedField
        name={`${prefix}-${index}-sex`}
        label="Sex"
        component={RadioGroupField}
        options={SEX_OPTIONS}
        orientation="horizontal"
        value={sex ?? ''}
        onChange={(v) => {
          if (typeof v === 'string' && (v === 'male' || v === 'female')) {
            onSexChange(v);
          }
        }}
      />
      <UnconnectedField
        name={`${prefix}-${index}-gender`}
        label="Gender"
        component={RadioGroupField}
        options={GENDER_OPTIONS}
        value={gender ?? ''}
        onChange={(v) => {
          if (typeof v === 'string') {
            onGenderChange(v as Gender);
          }
        }}
      />
    </div>
  );
}
```

Note: The `as Gender` assertion on the last onChange is acceptable here because the RadioGroupField only emits values from the `GENDER_OPTIONS` array, which are all `Gender` values. However, if the linter flags it, create a type guard function instead:

```typescript
function isGender(value: string): value is Gender {
  return GENDER_OPTIONS.some((o) => o.value === value);
}
```

**Step 3: Run lint and format**

Run: `pnpm lint --fix && pnpm prettier --write lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/`

**Step 4: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/
git commit -m "feat: add shared field options and PersonFields component for wizard"
```

---

## Task 3: Parents Count step and Parents Details step

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ParentsCountStep.tsx`
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ParentsDetailStep.tsx`

**Step 1: Create ParentsCountStep**

This step shows a NumberCounterField for parent count. It uses `setBeforeNext` to skip the details step if count is 0.

```tsx
'use client';

import { useEffect, useState } from 'react';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import { useWizard } from '~/lib/dialogs/useWizard';
import { STEP_INDICES } from './stepIndices';

export default function ParentsCountStep() {
  const { data, setStepData, setBeforeNext, goToStep, currentStep } = useWizard();
  const [count, setCount] = useState((data.parentCount as number | undefined) ?? 2);

  useEffect(() => {
    setStepData({ parentCount: count });
  }, []); // Set initial value on mount

  useEffect(() => {
    setBeforeNext(() => {
      if (count === 0) {
        // Skip parents detail, go to bio-parent follow-up
        goToStep(STEP_INDICES.BIO_PARENTS);
        return false;
      }
      return true;
    });
  }, [count, setBeforeNext, goToStep]);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        name="parentCount"
        label="How many parents do you have?"
        component={NumberCounterField}
        value={count}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setCount(newCount);
          setStepData({ parentCount: newCount });
        }}
      />
    </div>
  );
}
```

**Step 2: Create ParentsDetailStep**

This step renders PersonFields for each parent, plus a ParentEdgeType radio for each.

```tsx
'use client';

import { useEffect, useState } from 'react';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import { useWizard } from '~/lib/dialogs/useWizard';
import { type Gender, type ParentEdgeType, type Sex } from '~/lib/pedigree-layout/types';
import { type ParentDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import PersonFields from './PersonFields';
import { PARENT_EDGE_TYPE_OPTIONS } from './fieldOptions';

export default function ParentsDetailStep() {
  const { data, setStepData } = useWizard();
  const parentCount = (data.parentCount as number | undefined) ?? 0;

  const [parents, setParents] = useState<ParentDetail[]>(() => {
    const existing = data.parents as ParentDetail[] | undefined;
    if (existing && existing.length === parentCount) return existing;
    return Array.from({ length: parentCount }, (_, i) => ({
      name: existing?.[i]?.name ?? '',
      sex: existing?.[i]?.sex,
      gender: existing?.[i]?.gender,
      edgeType: existing?.[i]?.edgeType ?? 'social-parent',
    }));
  });

  useEffect(() => {
    setStepData({ parents });
  }, [parents, setStepData]);

  const updateParent = (index: number, updates: Partial<ParentDetail>) => {
    setParents((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      {parents.map((parent, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">Parent {i + 1}</h3>
          <PersonFields
            index={i}
            prefix="parent"
            name={parent.name}
            sex={parent.sex}
            gender={parent.gender}
            onNameChange={(name) => updateParent(i, { name })}
            onSexChange={(sex) => updateParent(i, { sex })}
            onGenderChange={(gender) => updateParent(i, { gender })}
          />
          <UnconnectedField
            name={`parent-${i}-edgeType`}
            label="Relationship type"
            component={RadioGroupField}
            options={PARENT_EDGE_TYPE_OPTIONS}
            value={parent.edgeType}
            onChange={(v) => {
              if (typeof v === 'string') {
                updateParent(i, { edgeType: v as ParentEdgeType });
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}
```

Note on `as ParentEdgeType`: same situation as Gender — the RadioGroupField only emits values from the options array. If linter flags it, add a type guard.

**Step 3: Run lint and format**

Run: `pnpm lint --fix && pnpm prettier --write lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/`

**Step 4: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/
git commit -m "feat: add parents count and detail wizard steps"
```

---

## Task 4: Step indices constant and Bio-Parents step

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/stepIndices.ts`
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/BioParentsStep.tsx`

**Step 1: Create stepIndices.ts**

A single source of truth for step ordering. Every step that uses `goToStep` references these constants.

```typescript
export const STEP_INDICES = {
  PARENTS_COUNT: 0,
  PARENTS_DETAIL: 1,
  BIO_PARENTS: 2,
  SIBLINGS_COUNT: 3,
  SIBLINGS_DETAIL: 4,
  PARTNER: 5,
  CHILDREN_WITH_PARTNER_COUNT: 6,
  CHILDREN_WITH_PARTNER_DETAIL: 7,
  OTHER_CHILDREN_COUNT: 8,
  OTHER_CHILDREN_DETAIL: 9,
} as const;
```

**Step 2: Create BioParentsStep**

This step only appears when fewer than 2 parents were marked `bio-parent` in the parents detail step. It asks about the missing biological parents.

```tsx
'use client';

import { useEffect, useState } from 'react';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import { useWizard } from '~/lib/dialogs/useWizard';
import { type Gender, type Sex } from '~/lib/pedigree-layout/types';
import { type BioParentDetail, type ParentDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import PersonFields from './PersonFields';

export default function BioParentsStep() {
  const { data, setStepData } = useWizard();

  const parents = (data.parents as ParentDetail[] | undefined) ?? [];
  const bioParentCount = parents.filter((p) => p.edgeType === 'bio-parent').length;
  const missingCount = Math.max(0, 2 - bioParentCount);

  const [bioParents, setBioParents] = useState<BioParentDetail[]>(() => {
    const existing = data.bioParents as BioParentDetail[] | undefined;
    if (existing && existing.length === missingCount) return existing;
    return Array.from({ length: missingCount }, (_, i) => ({
      name: existing?.[i]?.name ?? '',
      sex: existing?.[i]?.sex,
      gender: existing?.[i]?.gender,
      nameKnown: existing?.[i]?.nameKnown ?? false,
    }));
  });

  useEffect(() => {
    setStepData({ bioParents });
  }, [bioParents, setStepData]);

  const updateBioParent = (index: number, updates: Partial<BioParentDetail>) => {
    setBioParents((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      <p className="text-sm text-current/70">
        For the pedigree, we need information about biological parents.
        {bioParentCount > 0
          ? ` You identified ${bioParentCount} biological parent${bioParentCount === 1 ? '' : 's'} above.`
          : ''}
        {' '}Please tell us about the {missingCount === 1 ? 'other' : ''} biological parent{missingCount > 1 ? 's' : ''}.
      </p>
      {bioParents.map((bp, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">Biological parent {bioParentCount + i + 1}</h3>
          <UnconnectedField
            name={`bioParent-${i}-nameKnown`}
            label="Do you know this person's name?"
            component={ToggleField}
            value={bp.nameKnown}
            onChange={(v) => {
              updateBioParent(i, { nameKnown: v ?? false, name: v ? bp.name : '' });
            }}
          />
          {bp.nameKnown && (
            <PersonFields
              index={i}
              prefix="bioParent"
              name={bp.name}
              sex={bp.sex}
              gender={bp.gender}
              onNameChange={(name) => updateBioParent(i, { name })}
              onSexChange={(sex) => updateBioParent(i, { sex })}
              onGenderChange={(gender) => updateBioParent(i, { gender })}
            />
          )}
          {!bp.nameKnown && (
            <>
              <PersonFields
                index={i}
                prefix="bioParent"
                name=""
                sex={bp.sex}
                gender={bp.gender}
                onNameChange={() => {}} // no-op, name field hidden
                onSexChange={(sex) => updateBioParent(i, { sex })}
                onGenderChange={(gender) => updateBioParent(i, { gender })}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
```

Wait — the above is awkward. When `nameKnown` is false, we still want Sex + Gender but not the Name field. `PersonFields` always shows all three. We should make the name field optional in `PersonFields`, or just render Sex and Gender fields inline here.

**Revised approach:** Add a `showName` prop (default `true`) to `PersonFields`:

In `PersonFields.tsx`, add:

```tsx
type PersonFieldsProps = {
  index: number;
  prefix: string;
  name: string;
  sex: Sex | undefined;
  gender: Gender | undefined;
  onNameChange: (value: string) => void;
  onSexChange: (value: Sex) => void;
  onGenderChange: (value: Gender) => void;
  showName?: boolean; // default true
};

export default function PersonFields({
  // ...
  showName = true,
}: PersonFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      {showName && (
        <UnconnectedField
          name={`${prefix}-${index}-name`}
          label="Name"
          // ...
        />
      )}
      {/* Sex and Gender fields unchanged */}
    </div>
  );
}
```

Then in `BioParentsStep`, simplify to:

```tsx
<PersonFields
  index={i}
  prefix="bioParent"
  name={bp.name}
  sex={bp.sex}
  gender={bp.gender}
  showName={bp.nameKnown}
  onNameChange={(name) => updateBioParent(i, { name })}
  onSexChange={(sex) => updateBioParent(i, { sex })}
  onGenderChange={(gender) => updateBioParent(i, { gender })}
/>
```

**Step 3: Update ParentsCountStep to import STEP_INDICES**

The `ParentsCountStep` created in Task 3 references `STEP_INDICES.BIO_PARENTS`. Make sure that import is in place.

**Step 4: Run lint and format**

Run: `pnpm lint --fix && pnpm prettier --write lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/`

**Step 5: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/
git commit -m "feat: add step indices and bio-parents wizard step"
```

---

## Task 5: Siblings steps

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/SiblingsCountStep.tsx`
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/SiblingsDetailStep.tsx`

**Step 1: Create SiblingsCountStep**

Same pattern as ParentsCountStep. Uses `setBeforeNext` to skip details when count is 0.

```tsx
'use client';

import { useEffect, useState } from 'react';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import { useWizard } from '~/lib/dialogs/useWizard';
import { STEP_INDICES } from './stepIndices';

export default function SiblingsCountStep() {
  const { data, setStepData, setBeforeNext, goToStep } = useWizard();
  const [count, setCount] = useState((data.siblingCount as number | undefined) ?? 0);

  useEffect(() => {
    setStepData({ siblingCount: count });
  }, []);

  useEffect(() => {
    setBeforeNext(() => {
      if (count === 0) {
        goToStep(STEP_INDICES.PARTNER);
        return false;
      }
      return true;
    });
  }, [count, setBeforeNext, goToStep]);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        name="siblingCount"
        label="How many siblings do you have?"
        component={NumberCounterField}
        value={count}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setCount(newCount);
          setStepData({ siblingCount: newCount });
        }}
      />
    </div>
  );
}
```

**Step 2: Create SiblingsDetailStep**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import { type PersonDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import PersonFields from './PersonFields';

export default function SiblingsDetailStep() {
  const { data, setStepData } = useWizard();
  const siblingCount = (data.siblingCount as number | undefined) ?? 0;

  const [siblings, setSiblings] = useState<PersonDetail[]>(() => {
    const existing = data.siblings as PersonDetail[] | undefined;
    if (existing && existing.length === siblingCount) return existing;
    return Array.from({ length: siblingCount }, (_, i) => ({
      name: existing?.[i]?.name ?? '',
      sex: existing?.[i]?.sex,
      gender: existing?.[i]?.gender,
    }));
  });

  useEffect(() => {
    setStepData({ siblings });
  }, [siblings, setStepData]);

  const updateSibling = (index: number, updates: Partial<PersonDetail>) => {
    setSiblings((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    );
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      {siblings.map((sibling, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">Sibling {i + 1}</h3>
          <PersonFields
            index={i}
            prefix="sibling"
            name={sibling.name}
            sex={sibling.sex}
            gender={sibling.gender}
            onNameChange={(name) => updateSibling(i, { name })}
            onSexChange={(sex) => updateSibling(i, { sex })}
            onGenderChange={(gender) => updateSibling(i, { gender })}
          />
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Run lint and format**

Run: `pnpm lint --fix && pnpm prettier --write lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/`

**Step 4: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/
git commit -m "feat: add siblings count and detail wizard steps"
```

---

## Task 6: Partner step

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PartnerStep.tsx`

**Step 1: Create PartnerStep**

Combines the toggle and the detail fields in a single step. Uses `setBeforeNext` to skip children-with-partner steps if no partner.

```tsx
'use client';

import { useEffect, useState } from 'react';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import { useWizard } from '~/lib/dialogs/useWizard';
import { type Gender, type Sex } from '~/lib/pedigree-layout/types';
import PersonFields from './PersonFields';
import { STEP_INDICES } from './stepIndices';

export default function PartnerStep() {
  const { data, setStepData, setBeforeNext, goToStep } = useWizard();

  const [hasPartner, setHasPartner] = useState(
    (data.hasPartner as boolean | undefined) ?? false,
  );
  const [name, setName] = useState((data.partnerName as string | undefined) ?? '');
  const [sex, setSex] = useState<Sex | undefined>(data.partnerSex as Sex | undefined);
  const [gender, setGender] = useState<Gender | undefined>(data.partnerGender as Gender | undefined);

  useEffect(() => {
    setStepData({
      hasPartner,
      partnerName: name,
      partnerSex: sex,
      partnerGender: gender,
    });
  }, [hasPartner, name, sex, gender, setStepData]);

  useEffect(() => {
    setBeforeNext(() => {
      if (!hasPartner) {
        // Skip children-with-partner count + detail, go to other children count
        goToStep(STEP_INDICES.OTHER_CHILDREN_COUNT);
        return false;
      }
      return true;
    });
  }, [hasPartner, setBeforeNext, goToStep]);

  return (
    <div className="flex flex-col gap-4 pt-4">
      <UnconnectedField
        name="hasPartner"
        label="Do you have a partner?"
        component={ToggleField}
        value={hasPartner}
        onChange={(v) => setHasPartner(v ?? false)}
      />
      {hasPartner && (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <PersonFields
            index={0}
            prefix="partner"
            name={name}
            sex={sex}
            gender={gender}
            onNameChange={setName}
            onSexChange={setSex}
            onGenderChange={setGender}
          />
        </div>
      )}
    </div>
  );
}
```

**Step 2: Run lint and format**

Run: `pnpm lint --fix && pnpm prettier --write lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PartnerStep.tsx`

**Step 3: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PartnerStep.tsx
git commit -m "feat: add partner wizard step"
```

---

## Task 7: Children steps

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ChildrenWithPartnerCountStep.tsx`
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ChildrenWithPartnerDetailStep.tsx`
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/OtherChildrenCountStep.tsx`
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/OtherChildrenDetailStep.tsx`

**Step 1: Create ChildrenWithPartnerCountStep**

Same counter pattern. Skips detail step when count is 0.

```tsx
'use client';

import { useEffect, useState } from 'react';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import { useWizard } from '~/lib/dialogs/useWizard';
import { STEP_INDICES } from './stepIndices';

export default function ChildrenWithPartnerCountStep() {
  const { data, setStepData, setBeforeNext, goToStep } = useWizard();
  const [count, setCount] = useState(
    (data.childrenWithPartnerCount as number | undefined) ?? 0,
  );

  useEffect(() => {
    setStepData({ childrenWithPartnerCount: count });
  }, []);

  useEffect(() => {
    setBeforeNext(() => {
      if (count === 0) {
        goToStep(STEP_INDICES.OTHER_CHILDREN_COUNT);
        return false;
      }
      return true;
    });
  }, [count, setBeforeNext, goToStep]);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        name="childrenWithPartnerCount"
        label="How many children do you have with your partner?"
        component={NumberCounterField}
        value={count}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setCount(newCount);
          setStepData({ childrenWithPartnerCount: newCount });
        }}
      />
    </div>
  );
}
```

**Step 2: Create ChildrenWithPartnerDetailStep**

Same detail pattern as SiblingsDetailStep.

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import { type PersonDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import PersonFields from './PersonFields';

export default function ChildrenWithPartnerDetailStep() {
  const { data, setStepData } = useWizard();
  const count = (data.childrenWithPartnerCount as number | undefined) ?? 0;

  const [children, setChildren] = useState<PersonDetail[]>(() => {
    const existing = data.childrenWithPartner as PersonDetail[] | undefined;
    if (existing && existing.length === count) return existing;
    return Array.from({ length: count }, (_, i) => ({
      name: existing?.[i]?.name ?? '',
      sex: existing?.[i]?.sex,
      gender: existing?.[i]?.gender,
    }));
  });

  useEffect(() => {
    setStepData({ childrenWithPartner: children });
  }, [children, setStepData]);

  const updateChild = (index: number, updates: Partial<PersonDetail>) => {
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    );
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      {children.map((child, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">Child {i + 1}</h3>
          <PersonFields
            index={i}
            prefix="childWithPartner"
            name={child.name}
            sex={child.sex}
            gender={child.gender}
            onNameChange={(name) => updateChild(i, { name })}
            onSexChange={(sex) => updateChild(i, { sex })}
            onGenderChange={(gender) => updateChild(i, { gender })}
          />
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Create OtherChildrenCountStep**

Same counter pattern. Last count step — skips detail when 0, which means going to the end (wizard finishes from the last step).

```tsx
'use client';

import { useEffect, useState } from 'react';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import { useWizard } from '~/lib/dialogs/useWizard';

export default function OtherChildrenCountStep() {
  const { data, setStepData, setBeforeNext, goToStep, totalSteps } = useWizard();
  const [count, setCount] = useState(
    (data.otherChildrenCount as number | undefined) ?? 0,
  );

  useEffect(() => {
    setStepData({ otherChildrenCount: count });
  }, []);

  useEffect(() => {
    setBeforeNext(() => {
      if (count === 0) {
        // Skip detail step — jump to last step + 1 to trigger finish
        // Actually the wizard's handleNext handles isLastStep.
        // Since this is the second-to-last step, skipping means going to
        // totalSteps (which is out of bounds), so we need to handle this
        // differently. The wizard's goToStep clamps to valid range.
        // Instead, let's just go to the last step index.
        goToStep(totalSteps - 1);
        return false;
      }
      return true;
    });
  }, [count, setBeforeNext, goToStep, totalSteps]);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        name="otherChildrenCount"
        label="How many children do you have from other relationships?"
        component={NumberCounterField}
        value={count}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setCount(newCount);
          setStepData({ otherChildrenCount: newCount });
        }}
      />
    </div>
  );
}
```

Wait — when OtherChildrenCount is the second-to-last step and count is 0, we want to skip the detail step and finish. But `goToStep(totalSteps - 1)` goes to OtherChildrenDetailStep (which IS the last step), and then the user would click Finish on an empty step. Better approach: when count is 0, mark the detail step data as empty and let `setBeforeNext` return `true` — then on the detail step, use `setNextLabel('Finish')` and it auto-finishes since it's the last step.

Actually, simpler: if OtherChildrenCount is step index 8 and OtherChildrenDetail is step index 9 (the last step), and count is 0, we want the "Continue" on step 8 to act as "Finish". The cleanest way: use `setNextLabel('Finish')` when count is 0, and in `setBeforeNext`, set empty `otherChildren` data and return `true`. The detail step (step 9) will just be skipped via `goToStep` in `setBeforeNext`. But goToStep beyond bounds won't work.

Actually let's look at `useWizardState.tsx` line 97-101: when `isLastStep` is true, `handleNext` calls `onFinish`. So if we make OtherChildrenCountStep skip the detail step, we need the count step itself to trigger finish. The simplest solution: **make the detail step handle the empty case gracefully** (show nothing, button says "Finish") OR **use `setNextLabel('Get started')` on the count step when count is 0 and handle finish there**.

Simplest approach: **When count is 0, go to the last step (detail step), which will show "No children to add" and have a Finish button.** Let's make the detail step handle `count === 0` gracefully:

```tsx
// In OtherChildrenDetailStep:
if (children.length === 0) {
  return (
    <div className="pt-4">
      <p className="text-sm text-current/70">No additional children to add.</p>
    </div>
  );
}
```

This is the cleanest approach — the detail step is the last step, so the wizard naturally shows "Finish" on it. Revise OtherChildrenCountStep to NOT use `setBeforeNext` for skipping — just always advance normally:

```tsx
// OtherChildrenCountStep — no setBeforeNext needed, always advances to detail step
export default function OtherChildrenCountStep() {
  const { data, setStepData } = useWizard();
  const [count, setCount] = useState(
    (data.otherChildrenCount as number | undefined) ?? 0,
  );

  useEffect(() => {
    setStepData({ otherChildrenCount: count });
  }, []);

  return (
    <div className="flex flex-col gap-3 pt-4">
      <UnconnectedField
        name="otherChildrenCount"
        label="How many children do you have from other relationships?"
        component={NumberCounterField}
        value={count}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          const newCount = v ?? 0;
          setCount(newCount);
          setStepData({ otherChildrenCount: newCount });
        }}
      />
    </div>
  );
}
```

**Step 4: Create OtherChildrenDetailStep**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import { type PersonDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import PersonFields from './PersonFields';

export default function OtherChildrenDetailStep() {
  const { data, setStepData } = useWizard();
  const count = (data.otherChildrenCount as number | undefined) ?? 0;

  const [children, setChildren] = useState<PersonDetail[]>(() => {
    const existing = data.otherChildren as PersonDetail[] | undefined;
    if (existing && existing.length === count) return existing;
    return Array.from({ length: count }, (_, i) => ({
      name: existing?.[i]?.name ?? '',
      sex: existing?.[i]?.sex,
      gender: existing?.[i]?.gender,
    }));
  });

  useEffect(() => {
    setStepData({ otherChildren: children });
  }, [children, setStepData]);

  const updateChild = (index: number, updates: Partial<PersonDetail>) => {
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    );
  };

  if (children.length === 0) {
    return (
      <div className="pt-4">
        <p className="text-sm text-current/70">
          No additional children to add. Click Finish to generate your family tree.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      {children.map((child, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">Child {i + 1}</h3>
          <PersonFields
            index={i}
            prefix="otherChild"
            name={child.name}
            sex={child.sex}
            gender={child.gender}
            onNameChange={(name) => updateChild(i, { name })}
            onSexChange={(sex) => updateChild(i, { sex })}
            onGenderChange={(gender) => updateChild(i, { gender })}
          />
        </div>
      ))}
    </div>
  );
}
```

**Step 5: Run lint and format**

Run: `pnpm lint --fix && pnpm prettier --write lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/`

**Step 6: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/
git commit -m "feat: add children wizard steps (with-partner and other)"
```

---

## Task 8: Wire up QuickStartForm to open the wizard

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/QuickStartForm.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeCensus.tsx`

**Step 1: Rewrite QuickStartForm**

Replace the current form with a button that opens the wizard dialog. The `onFinish` callback transforms wizard data into `QuickStartData`.

```tsx
'use client';

import { useCallback } from 'react';
import Button from '~/components/ui/Button';
import Surface from '~/components/layout/Surface';
import useDialog from '~/lib/dialogs/useDialog';
import { type QuickStartData, type ParentDetail, type BioParentDetail, type PersonDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { type Gender, type Sex } from '~/lib/pedigree-layout/types';
import ParentsCountStep from './quickStartWizard/ParentsCountStep';
import ParentsDetailStep from './quickStartWizard/ParentsDetailStep';
import BioParentsStep from './quickStartWizard/BioParentsStep';
import SiblingsCountStep from './quickStartWizard/SiblingsCountStep';
import SiblingsDetailStep from './quickStartWizard/SiblingsDetailStep';
import PartnerStep from './quickStartWizard/PartnerStep';
import ChildrenWithPartnerCountStep from './quickStartWizard/ChildrenWithPartnerCountStep';
import ChildrenWithPartnerDetailStep from './quickStartWizard/ChildrenWithPartnerDetailStep';
import OtherChildrenCountStep from './quickStartWizard/OtherChildrenCountStep';
import OtherChildrenDetailStep from './quickStartWizard/OtherChildrenDetailStep';

type QuickStartFormProps = {
  onSubmit: (data: QuickStartData) => void;
};

export default function QuickStartForm({ onSubmit }: QuickStartFormProps) {
  const { openDialog } = useDialog();

  const handleOpen = useCallback(async () => {
    const result = await openDialog({
      type: 'wizard',
      title: 'Build your family tree',
      steps: [
        {
          title: 'Parents',
          description: 'How many parents do you have?',
          content: ParentsCountStep,
        },
        {
          title: 'Parent details',
          description: 'Tell us about each parent.',
          content: ParentsDetailStep,
        },
        {
          title: 'Biological parents',
          description: 'Information about biological parents for the pedigree.',
          content: BioParentsStep,
        },
        {
          title: 'Siblings',
          description: 'How many siblings do you have?',
          content: SiblingsCountStep,
        },
        {
          title: 'Sibling details',
          description: 'Tell us about each sibling.',
          content: SiblingsDetailStep,
        },
        {
          title: 'Partner',
          description: 'Do you have a partner?',
          content: PartnerStep,
        },
        {
          title: 'Children with partner',
          description: 'How many children do you have with your partner?',
          content: ChildrenWithPartnerCountStep,
        },
        {
          title: 'Children with partner details',
          description: 'Tell us about each child.',
          content: ChildrenWithPartnerDetailStep,
        },
        {
          title: 'Other children',
          description: 'Children from other relationships.',
          content: OtherChildrenCountStep,
        },
        {
          title: 'Other children details',
          description: 'Tell us about each child.',
          content: OtherChildrenDetailStep,
          nextLabel: 'Get started',
        },
      ],
      onFinish: (data: Record<string, unknown>) => {
        const parents = (data.parents as ParentDetail[] | undefined) ?? [];
        const bioParents = (data.bioParents as BioParentDetail[] | undefined) ?? [];
        const siblings = (data.siblings as PersonDetail[] | undefined) ?? [];
        const hasPartner = (data.hasPartner as boolean | undefined) ?? false;
        const childrenWithPartner = (data.childrenWithPartner as PersonDetail[] | undefined) ?? [];
        const otherChildren = (data.otherChildren as PersonDetail[] | undefined) ?? [];

        const quickStartData: QuickStartData = {
          parents,
          bioParents,
          siblings,
          partner: hasPartner
            ? {
                hasPartner: true,
                name: typeof data.partnerName === 'string' ? data.partnerName : '',
                sex: data.partnerSex as Sex | undefined,
                gender: data.partnerGender as Gender | undefined,
              }
            : { hasPartner: false },
          childrenWithPartner,
          otherChildren,
        };

        return quickStartData;
      },
    });

    if (result) {
      onSubmit(result as QuickStartData);
    }
  }, [openDialog, onSubmit]);

  return (
    <Surface noContainer maxWidth="md">
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-center text-sm text-current/70">
          Let&apos;s build your family tree. We&apos;ll ask you about your family members step by step.
        </p>
        <Button color="primary" onClick={() => void handleOpen()}>
          Get started
        </Button>
      </div>
    </Surface>
  );
}
```

**Step 2: Handle the bio-parents step skip**

The bio-parents step needs to handle the case where it's not needed (all parents are already bio-parents). Add `setBeforeNext` to the **ParentsDetailStep** to skip the bio-parents step when 2+ parents are marked `bio-parent`:

In `ParentsDetailStep.tsx`, add:

```tsx
import { STEP_INDICES } from './stepIndices';

// Inside the component:
const { data, setStepData, setBeforeNext, goToStep } = useWizard();

useEffect(() => {
  const bioCount = parents.filter((p) => p.edgeType === 'bio-parent').length;
  setBeforeNext(() => {
    if (bioCount >= 2) {
      // Skip bio-parents step, go to siblings count
      goToStep(STEP_INDICES.SIBLINGS_COUNT);
      return false;
    }
    return true;
  });
}, [parents, setBeforeNext, goToStep]);
```

**Step 3: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint --fix`

Fix any errors.

**Step 4: Format**

Run: `pnpm prettier --write lib/interviewer/Interfaces/FamilyTreeCensus/components/QuickStartForm.tsx lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/`

**Step 5: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/
git commit -m "feat: wire up QuickStartForm to open wizard dialog"
```

---

## Task 9: Update generateQuickStartNetwork

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts`

**Step 1: Rewrite generateQuickStartNetwork**

Replace the current implementation that uses simple counts with one that uses the rich `QuickStartData`. The function needs to:

1. Create ego node
2. Create parent nodes with names, sex, gender, and correct edge types
3. Link parents as partners
4. Create bio-parent nodes from the follow-up step (with empty labels when name unknown)
5. Create sibling nodes linked to all parents
6. Create partner node if applicable
7. Create children nodes linked to ego (and partner if applicable)
8. Create other children linked to ego only

```typescript
generateQuickStartNetwork: (data) => {
  get().clearNetwork();

  const egoId = get().addNode({ label: '', isEgo: true });

  // Parents
  const parentIds: string[] = [];
  for (const parent of data.parents) {
    const parentId = get().addNode({
      label: parent.name,
      sex: parent.sex,
      gender: parent.gender,
      isEgo: false,
    });
    parentIds.push(parentId);
    get().addEdge({
      source: parentId,
      target: egoId,
      type: 'parent',
      edgeType: parent.edgeType,
    });
  }

  // Link parents as partners (each consecutive pair)
  for (let i = 1; i < parentIds.length; i++) {
    get().addEdge({
      source: parentIds[i - 1]!,
      target: parentIds[i]!,
      type: 'partner',
      current: true,
    });
  }

  // Bio-parents from follow-up
  for (const bioParent of data.bioParents) {
    const bioParentId = get().addNode({
      label: bioParent.nameKnown ? bioParent.name : '',
      sex: bioParent.sex,
      gender: bioParent.gender,
      isEgo: false,
    });
    get().addEdge({
      source: bioParentId,
      target: egoId,
      type: 'parent',
      edgeType: 'bio-parent',
    });
  }

  // Siblings — linked to all parents (including bio-parents from step 2, not follow-up)
  for (const sibling of data.siblings) {
    const siblingId = get().addNode({
      label: sibling.name,
      sex: sibling.sex,
      gender: sibling.gender,
      isEgo: false,
    });
    for (const parentId of parentIds) {
      const parentNode = get().network.nodes.get(parentId);
      // Find the edge type from ego to this parent
      const parentEdge = [...get().network.edges.values()].find(
        (e) => e.type === 'parent' && e.source === parentId && e.target === egoId,
      );
      if (parentEdge && parentEdge.type === 'parent') {
        get().addEdge({
          source: parentId,
          target: siblingId,
          type: 'parent',
          edgeType: parentEdge.edgeType,
        });
      }
    }
  }

  // Partner
  let partnerId: string | undefined;
  if (data.partner.hasPartner) {
    partnerId = get().addNode({
      label: data.partner.name,
      sex: data.partner.sex,
      gender: data.partner.gender,
      isEgo: false,
    });
    get().addEdge({
      source: egoId,
      target: partnerId,
      type: 'partner',
      current: true,
    });
  }

  // Children with partner
  for (const child of data.childrenWithPartner) {
    const childId = get().addNode({
      label: child.name,
      sex: child.sex,
      gender: child.gender,
      isEgo: false,
    });
    get().addEdge({
      source: egoId,
      target: childId,
      type: 'parent',
      edgeType: 'social-parent',
    });
    if (partnerId) {
      get().addEdge({
        source: partnerId,
        target: childId,
        type: 'parent',
        edgeType: 'social-parent',
      });
    }
  }

  // Other children (ego only)
  for (const child of data.otherChildren) {
    const childId = get().addNode({
      label: child.name,
      sex: child.sex,
      gender: child.gender,
      isEgo: false,
    });
    get().addEdge({
      source: egoId,
      target: childId,
      type: 'parent',
      edgeType: 'social-parent',
    });
  }
},
```

Note: The unused `parentNode` variable in the siblings section is a mistake — remove that line. The sibling loop just needs to find the parent edge and reuse its edge type.

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (for store.ts at least)

**Step 3: Run lint and format**

Run: `pnpm lint --fix && pnpm prettier --write lib/interviewer/Interfaces/FamilyTreeCensus/store.ts`

**Step 4: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/store.ts
git commit -m "feat: update generateQuickStartNetwork for rich QuickStartData"
```

---

## Task 10: Update pedigreeAdapter for new NodeData

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter.ts`

**Step 1: Update mapGender to use NodeData.gender**

Currently `pedigreeAdapter.ts` maps gender from `sex` via `mapGender(nodes.get(nid)?.sex)`. Now that `NodeData` has a `gender` field, use it directly when available:

```typescript
// Before:
const gender: Gender[] = indexToId.map((nid) =>
  mapGender(nodes.get(nid)?.sex),
);

// After:
const gender: Gender[] = indexToId.map((nid) => {
  const node = nodes.get(nid);
  if (node?.gender) return node.gender;
  return mapGender(node?.sex);
});
```

This preserves backward compatibility — if `gender` isn't set, it falls back to inferring from `sex`.

**Step 2: Remove local Sex import if needed**

If `pedigreeAdapter.ts` imports `Sex` from the store, update it to import from `~/lib/pedigree-layout/types`. Check current imports.

**Step 3: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint --fix`

**Step 4: Format**

Run: `pnpm prettier --write lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter.ts`

**Step 5: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter.ts
git commit -m "feat: use NodeData.gender in pedigree adapter when available"
```

---

## Task 11: Update AddPersonForm to use shared field options

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/AddPersonForm.tsx`

**Step 1: Replace local PARENT_EDGE_TYPE_OPTIONS with shared import**

```typescript
// Before:
const PARENT_EDGE_TYPE_OPTIONS: { value: ParentEdgeType; label: string }[] = [
  { value: 'social-parent', label: 'Social parent' },
  // ...
];

// After:
import { PARENT_EDGE_TYPE_OPTIONS } from './quickStartWizard/fieldOptions';
// Remove the local constant and the ParentEdgeType import (if no longer needed)
```

**Step 2: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint --fix`

**Step 3: Format**

Run: `pnpm prettier --write lib/interviewer/Interfaces/FamilyTreeCensus/components/AddPersonForm.tsx`

**Step 4: Commit**

```bash
git add lib/interviewer/Interfaces/FamilyTreeCensus/components/AddPersonForm.tsx
git commit -m "refactor: use shared field options in AddPersonForm"
```

---

## Task 12: Final verification

**Step 1: Run full typecheck**

Run: `pnpm typecheck`
Expected: No new errors in FamilyTreeCensus files.

**Step 2: Run full lint**

Run: `pnpm lint`
Expected: No new errors in FamilyTreeCensus files.

**Step 3: Run tests**

Run: `pnpm test`
Expected: All existing tests pass. The `pedigreeAdapter.test.ts` should still pass since the types are backward-compatible.

**Step 4: Manual verification in Storybook**

If Storybook is running, check:
- The PedigreeLayout story still renders correctly
- No console errors

**Step 5: Commit any remaining fixes**

If any fixes were needed, commit them.

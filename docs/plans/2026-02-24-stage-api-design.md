# Stage API Refactor Design

Replace `useStageValidation`, `useBeforeNext`, `useReadyForNextStage`, and `StageMetadataContext` with a single props-based `StageApi` object passed to all stage components.

## Problem

1. DyadCensus/TieStrengthCensus need both `useStageValidation` (constraint checking) and `useBeforeNext` (sub-stage pair stepping) — two separate systems that both register handlers on the same `beforeNextHandlers` Map.
2. `useStageValidation` doesn't integrate with the "ready for next stage" concept. Stages manually call `updateReady()` via a separate Redux-driven hook.
3. Three separate mechanisms (`useStageValidation`, `useBeforeNext`, `updateReady`) that all relate to "can/should the user navigate?" are disconnected from each other.

## Design

### Core Types

```typescript
type Direction = 'forwards' | 'backwards';

type ConstraintContext = {
  direction: Direction;
};

type Constraint = {
  direction: 'forwards' | 'backwards' | 'both';
  test: (ctx: ConstraintContext) => boolean;
  action: (ctx: ConstraintContext) => Promise<boolean | void> | boolean | void;
  skipPromptBoundary?: boolean;
};

type StageApi = {
  moveForward: () => void;
  moveBackward: () => void;
  registerConstraints: (constraints: Constraint[]) => void;
};

type StageProps<T extends TStage['type'] = TStage['type']> = {
  stage: Extract<TStage, { type: T }>;
  stageApi: StageApi;
};
```

### Constraint Model

A constraint has three parts:

- **`test(ctx)`** — sync function returning `boolean`. Returns `true` when the stage is ready for stage-level navigation in the given direction. Evaluated both at navigation time AND for `readyForNext` derivation.
- **`action(ctx)`** — called when `test` returns `false`. Can be sync or async. Runs side effects (show toast, advance sub-step, open dialog). Return value controls navigation:
  - `void`/`undefined` — navigation blocked (default)
  - `false` — navigation blocked (explicit)
  - `true` — navigation allowed despite test failing (e.g., EgoForm "discard changes" dialog)
- **`skipPromptBoundary`** — when `true` and `test` passes, the shell skips prompt boundaries and navigates directly to the next stage. Used for DyadCensus/TieStrengthCensus with 0 pairs.

### Execution Flow on Navigation

1. Filter constraints matching the navigation direction
2. For each matching constraint, call `test(ctx)`:
   - `true` → constraint passes. If `skipPromptBoundary` is set, flag it.
   - `false` → call `action(ctx)`:
     - Returns `true` → override, continue evaluation
     - Returns `false` or `void` → navigation blocked, stop
3. If all constraints pass:
   - If any had `skipPromptBoundary: true` → skip to next stage (`FORCE`)
   - Otherwise → normal navigation (advance prompt or stage)

### `readyForNext` Derivation

The shell evaluates all forward-direction constraints' `test()` synchronously whenever constraints are re-registered:

```typescript
const [constraintVersion, setConstraintVersion] = useState(0);

const registerConstraints = useCallback((constraints: Constraint[]) => {
  constraintsRef.current = constraints;
  setConstraintVersion((v) => v + 1);
}, []);

const isReadyForNextStage = useMemo(() => {
  const forward = constraintsRef.current.filter(
    (c) => c.direction === 'forwards' || c.direction === 'both',
  );
  if (forward.length === 0) return true;
  return forward.every((c) => c.test({ direction: 'forwards' }));
}, [constraintVersion]);
```

This eliminates `useReadyForNextStage`, the Redux `formIsReady` state, and all manual `updateReady` calls.

### Constraint Registration

Stages call `registerConstraints` inside a `useEffect`:

```typescript
useEffect(() => {
  stageApi.registerConstraints([...]);
}, [stageApi, ...dependencies]);

useEffect(() => {
  return () => stageApi.registerConstraints([]);
}, [stageApi]);
```

The shell stores constraints via ref. Closures are kept fresh by re-running the effect when dependencies change. The shell also clears constraints in `handleExitComplete` to prevent stale constraints from exiting stages.

### Toast Management

Stages own their toast lifecycle. The `action` function fires toasts; stages dismiss them when state changes. A `useConstraintToast` utility can optionally simplify this:

```typescript
function useConstraintToast() {
  const toastIdRef = useRef<string | null>(null);

  const show = (options: ToastOptions) => {
    if (!toastIdRef.current) {
      toastIdRef.current = toast(options);
    }
  };

  const dismiss = () => {
    if (toastIdRef.current) {
      dismissToast(toastIdRef.current);
      toastIdRef.current = null;
    }
  };

  useEffect(() => () => dismiss(), []);

  return { show, dismiss };
}
```

This is optional sugar, not part of the core API.

### StageApi Construction

In `useInterviewNavigation`:

```typescript
const stageApi: StageApi = useMemo(
  () => ({
    moveForward,
    moveBackward,
    registerConstraints,
  }),
  [moveForward, moveBackward, registerConstraints],
);
```

In `InterviewShell`:

```typescript
<CurrentInterface key={stage.id} stage={stage} stageApi={stageApi} />
```

### `canNavigate` (revised)

```typescript
const canNavigate = async (direction: Direction) => {
  const constraints = constraintsRef.current;
  const matching = constraints.filter(
    (c) => c.direction === direction || c.direction === 'both',
  );

  if (matching.length === 0) return true;

  let hasSkip = false;

  for (const constraint of matching) {
    if (constraint.test({ direction })) {
      if (constraint.skipPromptBoundary) hasSkip = true;
      continue;
    }

    const result = await constraint.action({ direction });
    if (result === true) continue;
    return false;
  }

  return hasSkip ? 'FORCE' : true;
};
```

## Stage Migration Reference

### DyadCensus / TieStrengthCensus

**Before:** `useStageValidation` + `useBeforeNext` + `getNavigationHelpers`
**After:** Single `registerConstraints` call with validation constraint, sub-step constraint (with `skipPromptBoundary`), and backward constraint. `moveForward` from `stageApi` for auto-advance.

### EgoForm

**Before:** `useBeforeNext` (async dialog + form submit) + `updateReady`
**After:** Forward constraint with async `action` that validates/submits. Backward constraint with async `action` that opens discard dialog. `readyForNext` derived from forward constraint test (`isFormValid`).

### NameGenerator / NameGeneratorRoster

**Before:** `useStageValidation` + `updateReady`
**After:** Forward constraint with `test: () => minNodesMet` and `action` that fires toast.

### SlidesForm

**Before:** `useBeforeNext` (form validation) + `getNavigationHelpers` + `updateReady`
**After:** Forward constraint for form validity. `moveForward` from `stageApi` for enter-submit.

### CategoricalBin / OrdinalBin

**Before:** `updateReady` only
**After:** Forward constraint with `test: () => allNodesCategorized`. No action needed (no blocking, just controls pulse).

### Anonymisation

**Before:** `useBeforeNext` + `updateReady`
**After:** Constraints for passphrase validation.

### Geospatial

**Before:** `useBeforeNext` + `updateReady`
**After:** Constraints for node-by-node navigation + location selection.

### FamilyTreeCensus / OneToManyDyadCensus

**Before:** `useBeforeNext`
**After:** Sub-step constraints.

### Information / Narrative / Sociogram / FinishSession

**Before:** No hooks
**After:** No constraints. Always ready.

## What Gets Deleted

| Current | Fate |
|---------|------|
| `useStageValidation` hook | Deleted |
| `useBeforeNext` hook | Deleted |
| `useReadyForNextStage` hook | Deleted |
| `StageMetadataContext` | Deleted |
| `BeforeNextFunction` type | Deleted |
| `RegisterBeforeNext` type | Deleted |
| Redux `formIsReady` state | Deleted |
| `getNavigationHelpers` prop | Deleted — `moveForward`/`moveBackward` on `stageApi` |
| `updateReady` prop | Deleted — derived from constraints |

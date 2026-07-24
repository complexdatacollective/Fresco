---
name: generate-e2e-tests
description: Generate comprehensive Playwright e2e tests from a .netcanvas protocol file and an optional recording. Invoke with /generate-e2e-tests <protocol-path> [recording-path]
user-invocable: true
---

# Generate E2E Tests from Protocol

You are generating comprehensive Playwright e2e tests for a Fresco interview protocol.

## Inputs

- **Protocol path**: `$1` — path to a `.netcanvas` file (ZIP containing `protocol.json`)
- **Recording path** (optional): `$2` — path to a recording directory (contains `actions.jsonl`, `SESSION.md`, `screenshots/`)

If no recording is provided, generate a **synthetic happy path** using the data generation strategies in STAGE_TEST_REFERENCE.md (see "Synthetic Data Generation" section).

## Step 1: Read Reference Materials

Read these files to understand the testing infrastructure and patterns:

1. `tests/e2e/docs/STAGE_TEST_REFERENCE.md` — what to test for each stage type, fixture availability, validation testing patterns
2. `tests/e2e/fixtures/stage-fixture.ts` — available fixture methods and their signatures
3. `tests/e2e/fixtures/interview-fixture.ts` — interview navigation fixture
4. `tests/e2e/fixtures/protocol-fixture.ts` — protocol installation and network state inspection
5. `tests/e2e/CLAUDE.md` — full e2e testing architecture guide
6. `tests/e2e/specs/interview/silos-protocol.spec.ts` — reference test implementation to match style/structure
7. `CLAUDE.md` — project coding conventions (path aliases, TypeScript, etc.)

## Step 2: Extract and Analyze Protocol

Extract the protocol JSON:

```bash
unzip -p "$1" protocol.json
```

From the extracted JSON, build a **stage map** — for each stage (by index), extract:

- `type` — stage type (e.g., `NameGeneratorQuickAdd`, `EgoForm`, `Sociogram`)
- `label` — display label
- `subject` — `{ entity, type }` pointing to codebook entry (null for Information/Anonymisation)
- `introductionPanel` — title and text (if present)
- `form.fields[]` — array of `{ variable }` referencing codebook variables
- `prompts[]` — array of prompt objects (with `createEdge`, `variable`, `highlight`, etc.)
- `panels[]` — side panel configuration
- `behaviours` — `maxNodes`, `minNodes`, `freeDraw`, etc.

For each form field, resolve the variable UUID against the codebook:

- Look up `codebook.[entity].[type].variables.[variableId]`
- Extract: `name`, `type`, `component`, `validation`, `options`

This gives you the field name (UUID), display name, input component type, validation rules, and available options for each form field.

## Step 3: Analyze Recording (if provided)

If `$2` is provided, read `$2/actions.jsonl` (one JSON object per line).

Group actions by stage — track URL changes via the `step=N` query parameter. For each stage visited:

- Extract the sequence of user actions (click, fill, press, select)
- Note filled values and selected options
- Note which nodes were created (names entered in quick-add or name generator forms)
- Note edge-creating interactions (sociogram clicks, dyad census selections)

The recording represents the **happy path** — the exact user journey to replay.

### If no recording

Generate a synthetic happy path from the protocol alone:

1. Walk through all stages in order (index 0 to N)
2. For each stage, use the **Synthetic Data Generation** section of STAGE_TEST_REFERENCE.md to determine what values to fill, how many nodes to create, etc.
3. For conditional/skip logic, choose the path that visits the **most stages**
4. Track synthetic state as you go — node names created on earlier stages are needed for bin/census/sociogram stages later

## Step 4: Generate Test File

Create `tests/e2e/specs/interview/<protocol-name>.spec.ts` where `<protocol-name>` is derived from the protocol name (kebab-case, lowercase).

### File Structure

Follow this exact pattern (from the reference implementation):

```typescript
/**
 * <Protocol Name> Tests
 *
 * Tests interview stage navigation using a real .netcanvas protocol file.
 */

import path from 'node:path';
import { expect, test } from '~/tests/e2e/fixtures/interview-test.js';
import { expectURL } from '~/tests/e2e/helpers/expectations.js';

const PROTOCOL_PATH = path.resolve(
  import.meta.dirname,
  '../../data/<filename>.netcanvas',
);

let sharedProtocolId: string;

test.describe('<Protocol Name>', () => {
  test.beforeAll(async ({ database, protocol }) => {
    await database.restoreSnapshot();
    const { protocolId } = await protocol.install(PROTOCOL_PATH);
    sharedProtocolId = protocolId;
  });

  test.describe('Happy Path', () => {
    test.describe.configure({ mode: 'serial' });

    let interviewId: string;

    test.beforeAll(async ({ protocol }) => {
      interviewId = await protocol.createInterview(sharedProtocolId);
    });

    test.beforeEach(({ interview }) => {
      interview.interviewId = interviewId;
    });

    test.afterEach(async ({ page, interview }) => {
      const stepMatch = /step=(\d+)/.exec(page.url());
      if (stepMatch?.[1]) {
        const step = stepMatch[1];
        // List stage indices with non-deterministic rendering
        const highToleranceStages: string[] = [/* sociogram indices */];

        await interview.capture(`stage-${step}-final`, {
          maxDiffPixelRatio: highToleranceStages.includes(step)
            ? 0.1
            : undefined,
        });
      }
    });

    // One test() per stage...
  });
});
```

### Per-Stage Test Generation

For each stage in the protocol, generate a `test()` block. Use the STAGE_TEST_REFERENCE.md to determine what to test.

#### Mapping Recording Actions to Fixture Calls

Translate recording actions to fixture method calls using these mappings:

| Recording Pattern | Fixture Call |
|---|---|
| Navigate to URL with `step=N` | `interview.goto(N)` |
| Click element matching next/forward button | `interview.nextButton.click()` |
| Fill input within `[data-field-name="UUID"]` | `stage.form.fillText(UUID, value)` or `fillNumber`/`fillDate` based on codebook component |
| Click radio within `[data-field-name="UUID"]` | `stage.form.selectRadio(UUID, optionLabel)` |
| Click checkbox within `[data-field-name="UUID"]` | `stage.form.selectCheckbox(UUID, optionLabel)` |
| Click toggle button within `[data-field-name="UUID"]` | `stage.form.selectToggleButton(UUID, optionLabel)` |
| Fill quick-add input + press Enter | `stage.quickAdd.addNode(value)` |
| Click "Add a person" button | `stage.nameGenerator.openAddForm()` |
| Click "Finished" button in dialog | `stage.nameGenerator.submitForm()` |
| Drag node from panel | `stage.nodePanel.dragNodeToMainList(label)` |
| Click node on sociogram (connecting) | `stage.sociogram.connectNodes(from, to)` |
| Drag node to ordinal bin | `stage.ordinalBin.dragNodeToBin(node, bin)` |
| Drag node to categorical bin | `stage.categoricalBin.dragNodeToBin(node, bin)` |

#### Determine Form Method from Codebook

Use the codebook variable's `component` (or `type` if no component) to pick the right form fixture method:

| Component | Method |
|---|---|
| `Text`, `TextArea` | `fillText` |
| `Number` | `fillNumber` |
| `DatePicker` | `fillDate` |
| `RadioGroup` | `selectRadio` |
| `LikertScale` | `selectLikert` |
| `CheckboxGroup` | `selectCheckbox` |
| `ToggleButtonGroup` | `selectToggleButton` |
| `Boolean` | `selectRadio` (options are "Yes"/"No" or custom labels from codebook) |

#### Comments

Add a comment above each form field interaction with the field's display name and component type:

```typescript
// 1. Date of birth (DatePicker)
await stage.form.fillDate('596c2ac2-...', '2000-06-15');

// 2. Gender identity (RadioGroup)
await stage.form.selectRadio('a06f06f5-...', 'Cisgender Male');
```

### Validation Tests

For each form stage (EgoForm, AlterForm, AlterEdgeForm), examine the codebook variables for targeted validation rules. Generate validation test assertions **within the happy path test** for that stage:

1. **Before filling fields**: Try to advance, verify validation blocks:
   ```typescript
   // Verify validation blocks advancement
   await interview.nextButton.click();
   await expectURL(page, /step=N/); // Still on same stage

   // Verify required field errors
   await expect(
     stage.form.getFieldError('field-uuid'),
   ).toBeVisible();
   ```

2. **Then fill fields normally** from the recording data.

Only test these validations (skip others):
- `required: true` — always test
- `minValue` / `maxValue` — test if present
- `minLength` / `maxLength` — test if present
- `pattern` — test if present
- `unique` — test if applicable (needs duplicate value scenario)
- `sameAs` / `differentFrom` — test if present

### Network State Verification

The sync middleware uses a 3-second debounce with leading+trailing edges. Each `interview.goto()` destroys the current page, killing any pending trailing-edge syncs. Stages that set data used by downstream skip logic or filtering must explicitly wait for that data to persist.

#### Form stages (EgoForm, AlterForm) must click Next to submit

Form data lives in React Hook Form's local state until the form is submitted. **You must click `interview.nextButton` at the end of every form stage** to flush the data to Redux. Without this, the sync middleware never sees the data.

For **EgoForm** stages, click Next as the last interaction (replaces the `toBeEnabled` assertion):

```typescript
// Submit form to flush data to Redux
await interview.nextButton.click();
```

For **AlterForm** stages with slides, click Next after filling the **last slide** (the earlier slides already submit when you click Next to advance):

```typescript
// Submit last slide to flush form data to Redux
await interview.nextButton.click();
```

Note: clicking Next navigates to the next stage, so the `afterEach` screenshot will capture the next stage's initial state rather than the current stage's final state.

#### Persistence waits for skip logic

After stages that set attributes consumed by downstream skip logic or filtering, add explicit waits using the protocol fixture. Available methods:

- `protocol.waitForNodes(interviewId, expectedCount)` — after node creation stages
- `protocol.waitForNode(interviewId, nodeName)` — when count alone is ambiguous
- `protocol.waitForNodeAttribute(interviewId, nodeName, attributeId)` — after CategoricalBin, OrdinalBin, or AlterForm stages (checks for non-null value)
- `protocol.waitForEgoAttribute(interviewId, attributeId, expectedValue)` — after EgoForm stages

Example for a CategoricalBin stage with downstream skip logic:

```typescript
test('Stage N: CategoricalBin', async ({ interview, stage, protocol }) => {
  await interview.goto(N);

  await stage.categoricalBin.dragNodeToBin('Dan', 'Yes');
  await stage.categoricalBin.dragNodeToBin('Alice', 'No');

  await expect(interview.nextButton).toBeEnabled();

  // Wait for the LAST categorized node's attribute to persist
  await protocol.waitForNodeAttribute(
    interview.interviewId,
    'Alice',
    'variable-uuid',
  );
});
```

**Always add `protocol` to the test's destructured fixtures** when using persistence waits.

### Stages With Placeholder Fixtures

Check the Fixture Availability Summary in STAGE_TEST_REFERENCE.md. If a stage type's fixture is marked **Placeholder**, generate a minimal test with a TODO referencing the placeholder:

```typescript
test('Stage N: Stage Label', async ({ page, interview }) => {
  await interview.goto(N);

  // TODO: stage.dyadCensus is a placeholder fixture — implement its
  // interaction methods before writing full test assertions.
  // See DyadCensusFixture JSDoc in stage-fixture.ts for the methods needed.
  //
  // Expected behavior from recording:
  // - Dismiss intro panel
  // - Select Yes/No for each node pair
  // - Auto-advances after 350ms
});
```

Always reference the `stage.<fixtureName>` property (e.g., `stage.dyadCensus`, `stage.narrative`) so the test structure is ready — it just needs the fixture methods implemented. Never use raw Playwright selectors as a fallback.

### Skipped Stages

If the recording skips certain stage indices (e.g., conditional stages), add a comment:

```typescript
// Stages N-M are skipped (conditional on <condition from codebook>)
```

### Browser-Specific Skips

Add `test.skip()` for known browser limitations:

```typescript
// Skip geospatial on Firefox (no WebGL in Playwright's Firefox)
test.skip(browserName === 'firefox', 'Firefox lacks WebGL support in Playwright');
```

## Step 5: Verify Protocol File Location

Check if the `.netcanvas` file is already in `tests/e2e/data/`. If not, suggest copying it there and update the path constant accordingly.

## Step 6: Output Summary

After generating the test file, output:
1. Path to the generated test file
2. Number of stages covered
3. Number of validation tests included
4. List of stages with TODO placeholders (missing fixtures)
5. Suggested next steps (copy protocol to test data, run tests, etc.)

## Important Rules

- **Always use path aliases** (`~/tests/e2e/...`) for imports, never relative paths
- **Use `.js` extensions** in import paths (TypeScript with ESM)
- **Field names are UUIDs** — always use the variable UUID from the codebook, not the display name
- **Serial mode** — interview tests MUST use `test.describe.configure({ mode: 'serial' })`
- **Soft assertions for screenshots** — the `afterEach` capture pattern handles this via `interview.capture()`
- **No `console.log`** — project ESLint rule forbids it
- **Follow existing patterns** — match the style, structure, and conventions of `silos-protocol.spec.ts` exactly

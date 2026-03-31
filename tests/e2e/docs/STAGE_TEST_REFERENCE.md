# Stage Test Reference

This document defines what to test for each stage type in e2e interview tests. It is read by the `/generate-e2e-tests` skill at runtime.

## How to Use This Document

For each stage in a protocol, look up its `type` below to find:

- **Fixture** — which `stage.*` fixture to use and whether it is **implemented** or a **placeholder**
- **UI verification** — elements to assert visible
- **Interactions** — user actions mapped to fixture methods
- **Validations** — codebook validation rules to test on form fields
- **Network state** — what nodes/edges/attributes to verify after interaction
- **Edge cases** — behavioral constraints from stage config
- **Snapshot guidance** — masking and tolerance for visual captures

Stages with **placeholder** fixtures have the fixture class registered on `StageFixture` but no interaction methods implemented yet. When generating tests for these stages, output a TODO block referencing the placeholder fixture's JSDoc (which describes the methods to implement) rather than a full test.

---

## Common Patterns

These apply across all stage types:

### Navigation

- `interview.goto(stageIndex)` navigates to a stage and auto-captures a screenshot
- `interview.nextButton` is the "Next Step" button
- `interview.nextButtonHasPulse()` returns `true` when validation is satisfied (stage is ready to advance)
- For multi-prompt stages, clicking `interview.nextButton` cycles through prompts before advancing to the next stage

### Prompts

- `stage.getPrompt()` or `stage.getPrompt('text')` locates the current prompt
- Multi-prompt stages: click `interview.nextButton` to advance to the next prompt within the same stage

### Node Assertions

- `stage.getNode(label)` finds a node by label (`role="option"`)
- `stage.deleteNode(label)` deletes via keyboard DnD to the delete bin

### Network State Verification

- `protocol.waitForNodes(interviewId, expectedCount)` — poll DB until node count matches
- `protocol.waitForNode(interviewId, nodeName)` — poll DB until a specific named node exists
- `protocol.waitForEgoAttribute(interviewId, attrId, value)` — poll for ego attribute
- `protocol.waitForNodeAttribute(interviewId, nodeName, attrId)` — poll until a node has a non-null attribute
- `protocol.getNetworkState(interviewId)` — get full network (nodes, edges, ego, currentStep)

**Data persistence**: The sync middleware uses a 3-second debounce. Each `goto()` destroys the page, killing pending trailing-edge syncs. Add persistence waits after stages whose data is used by downstream skip logic or filtering. **Form stages (EgoForm, AlterForm) must click `interview.nextButton` at the end** to submit form data to Redux before any wait can succeed.

### Visual Snapshots

- `interview.goto(N)` auto-captures on arrival
- `interview.capture('name')` for manual mid-stage captures
- `afterEach` hook captures final state: `interview.capture(\`stage-${step}-final\`)`
- Video elements are auto-masked

---

## Synthetic Data Generation

When generating tests without a recording, the skill must synthesize valid data for every interaction. Use the codebook to derive constraints, then apply these strategies.

### Form Field Values

Pick the **first valid value** that satisfies all validation rules on the field.

| Component | Strategy | Example |
|---|---|---|
| `Text`, `TextArea` | Generate a descriptive string. If `minLength`, pad to length. If `pattern`, generate a matching string. Use the variable's `name` as a hint for realistic content (e.g., "Name" → "Alex", "Email" → "test@example.com"). | `'Test response'` |
| `Number` | Use `minValue` if set, otherwise `1`. If both `minValue` and `maxValue`, use the midpoint. | `'25'` |
| `DatePicker` | Use `2000-01-15`. If `minValue`/`maxValue` dates constrain it, pick the midpoint. | `'2000-01-15'` |
| `RadioGroup`, `LikertScale` | Select the **first option** from the codebook variable's `options` array. Use `options[0].label` as the `optionLabel`. | First option label |
| `CheckboxGroup` | Select the **first option** only. | First option label |
| `ToggleButtonGroup` | Select the **first option**. | First option label |
| `Boolean` | Select `'Yes'` (or the first option label if custom labels are defined in codebook `options`). | `'Yes'` |
| `VisualAnalogScale` | Use the midpoint value. | `'50'` |

### Cross-Field Validations

When a field has `sameAs`, `differentFrom`, `greaterThanVariable`, or similar cross-field rules, ensure generated values are consistent:

- `sameAs: otherVar` → use the same value as the other field
- `differentFrom: otherVar` → use a different value (pick the second option, or append "2")
- `greaterThanVariable: otherVar` → use a value 1 greater than the other field
- `lessThanVariable: otherVar` → use a value 1 less

### Node Names

For NameGenerator and NameGeneratorQuickAdd stages, generate names based on the number needed:

- If `behaviours.minNodes` is set, create exactly that many
- If no minimum, create **3 nodes** (enough to exercise bin/census stages downstream)
- If `behaviours.maxNodes` is set, do not exceed it
- Use realistic names from this list (in order): `Alex`, `Jordan`, `Sam`, `Taylor`, `Morgan`, `Casey`, `Riley`, `Quinn`, `Avery`, `Dakota`
- If the protocol's node type has a name variable with `unique` validation, ensure names are distinct

### Stage-Specific Defaults

| Stage Type | Default Behavior |
|---|---|
| **Information** | Just advance — no data entry needed |
| **EgoForm** | Fill all fields using strategies above |
| **NameGeneratorQuickAdd** | Add nodes using `stage.quickAdd.addNode()` |
| **NameGenerator** | Open form, fill fields, submit for each node |
| **Sociogram** | Connect the first 2 nodes to create at least 1 edge |
| **OrdinalBin** | Place each node in a different bin (round-robin across options) |
| **CategoricalBin** | Place each node in a different category (round-robin) |
| **Geospatial** | Click center of map `clickOnMap(0.5, 0.5)` for each node |
| **DyadCensus** | Select "Yes" for first pair, "No" for rest (creates 1 edge minimum) |
| **TieStrengthCensus** | Select first option for first pair, negative for rest |
| **OneToManyDyadCensus** | Toggle first target for each source node |
| **AlterForm / AlterEdgeForm** | Dismiss intro, fill all fields per slide |
| **Anonymisation** | Enter passphrase `'testpassphrase123'` |
| **FinishSession** | Click finish, confirm dialog |

### Conditional/Skip Logic

When a stage has skip logic (e.g., "skip if sex = Female"), the synthetic data determines which path is taken. The skill should:

1. Identify which form fields control skip logic by examining stage `filter` or `skipLogic` properties
2. Choose values that follow the **longest path** (most stages visited)
3. Add a comment noting the conditional: `// Stages N-M skipped (conditional on field X = value Y)`

---

## Form Stages

Form stages collect attributes via form fields. The `stage.form` fixture handles all field interactions.

### Field Interaction Methods

| Variable Component | Fixture Method |
|---|---|
| `Text`, `TextArea` | `stage.form.fillText(fieldName, value)` |
| `Number` | `stage.form.fillNumber(fieldName, value)` |
| `DatePicker` | `stage.form.fillDate(fieldName, 'YYYY-MM-DD')` |
| `RadioGroup` | `stage.form.selectRadio(fieldName, optionLabel)` |
| `LikertScale` | `stage.form.selectLikert(fieldName, optionLabel)` |
| `CheckboxGroup` | `stage.form.selectCheckbox(fieldName, optionLabel)` |
| `ToggleButtonGroup` | `stage.form.selectToggleButton(fieldName, optionLabel)` |
| `Boolean` | `stage.form.selectRadio(fieldName, 'Yes')` (renders as radio group) |

The `fieldName` is the variable UUID from the codebook (found in `stage.form.fields[].variable`).

### Validation Testing

Only test these targeted validations when present in the codebook variable's `validation` object:

| Validation Rule | How to Test |
|---|---|
| `required: true` | Leave field empty, attempt to advance. Assert `stage.form.getFieldError(fieldName)` is visible. Assert next button does NOT have pulse. |
| `minLength: N` | Fill with `N-1` characters, attempt to advance. Assert error visible. |
| `maxLength: N` | Fill with `N+1` characters, attempt to advance. Assert error visible. |
| `minValue: N` | Fill number with `N-1`, attempt to advance. Assert error visible. |
| `maxValue: N` | Fill number with `N+1`, attempt to advance. Assert error visible. |
| `pattern: { regex }` | Fill with non-matching string, attempt to advance. Assert error visible. |
| `unique: true` | Create a duplicate value (requires two nodes with same field), assert error visible. |
| `sameAs: varId` | Fill both fields with different values, attempt to advance. Assert error. |
| `differentFrom: varId` | Fill both fields with same value, attempt to advance. Assert error. |

"Attempt to advance" means clicking `interview.nextButton` — the form validates on forward navigation.

### Error Display

- Field errors appear at `data-testid="${fieldName}-field-error"`
- On validation failure, the form auto-scrolls to the first error field
- The next button loses its pulse animation when the form is invalid

---

### EgoForm

Collects ego (respondent) attributes.

- **Fixture**: `stage.form` (all field methods)
- **Stage config key**: `stage.form.fields[]` — array of field definitions referencing codebook ego variables

#### UI Verification

- Introduction panel (if `stage.introductionPanel` exists): heading + markdown text
- Form fields render based on codebook variable component types
- Next button has pulse when form is valid

#### Interactions

1. Fill each form field using the appropriate `stage.form.*` method
2. Click `interview.nextButton` to submit and advance

#### Network State

- `protocol.waitForEgoAttribute(interviewId, variableId, expectedValue)` for each field filled
- Ego attributes persist across stages — verify they survive navigation

#### Edge Cases

- **Scroll nudge**: Appears after 15s inactivity when content overflows (not practically testable in e2e)
- **Backward navigation with invalid form**: Shows a discard confirmation dialog
- **Multiple EgoForm stages**: Each only writes its own fields — verify earlier ego attributes aren't overwritten

#### Snapshot Guidance

- Standard tolerance (2% default)
- No special masking needed

---

### AlterForm

Collects attributes for each alter (node) via a slide-per-node form.

- **Fixture**: `stage.form` for field interactions + `stage.slidesForm` (placeholder) for intro/slide navigation
- **Stage config key**: `stage.form.fields[]`, `stage.introductionPanel`, `stage.subject`

#### UI Verification

- Introduction panel shown first (title + markdown text)
- After dismissing intro, slide form shows one node at a time with node visualization header
- Form fields render per node

#### Interactions

1. Advance past intro panel: `interview.nextButton.click()`
2. Fill fields for current node: `stage.form.fillText(fieldName, value)`, etc.
3. Advance to next node slide: `interview.nextButton.click()`
4. Repeat for each node
5. After last node, advancing exits the stage

#### Network State

- `protocol.getNetworkState(interviewId)` — verify node attributes updated for each node
- Each slide updates one node's attributes via `updateNode`

#### Edge Cases

- **Back on first slide**: Returns to intro panel
- **Back with invalid/dirty form**: Shows discard confirmation dialog
- **Must scroll to bottom**: Next button disabled until user scrolls to bottom of form content
- **No nodes of this type**: Stage may be empty — verify graceful handling

#### Snapshot Guidance

- Standard tolerance
- Node header visualization scales down on scroll (parallax) — capture at top of scroll

---

### AlterEdgeForm

Collects attributes for each edge via a slide-per-edge form. Nearly identical to AlterForm.

- **Fixture**: `stage.form` for field interactions + `stage.slidesForm` (placeholder) for intro/slide navigation
- **Stage config key**: `stage.form.fields[]`, `stage.introductionPanel`, `stage.subject`

#### UI Verification

- Same intro panel behavior as AlterForm
- Edge header shows from-node, colored line, to-node visualization
- Form fields render per edge

#### Interactions

- Same as AlterForm but iterates over edges instead of nodes

#### Network State

- Edge attributes updated via `updateEdge` for each slide

#### Edge Cases

- Same as AlterForm (back to intro, discard dialog, scroll-to-bottom)
- **No edges of this type**: Stage may be empty

---

## Name Generator Stages

### NameGeneratorQuickAdd

Quick text entry for adding nodes.

- **Fixture**: `stage.quickAdd`, `stage.nodePanel`
- **Stage config key**: `stage.prompts[]`, `stage.panels[]`, `stage.behaviours`

#### UI Verification

- Prompt text visible via `stage.getPrompt()`
- Quick-add toggle button (`data-testid="quick-add-toggle"`)
- Quick-add input (`data-testid="quick-add-input"`)
- Side panel(s) if `stage.panels` defined (`data-testid="node-panel"`)

#### Interactions

1. Add nodes: `stage.quickAdd.addNode('Name')`
2. Verify node appears: `expect(stage.getNode('Name')).toBeVisible()`
3. Delete node: `stage.deleteNode('Name')`
4. Drag from panel: `stage.nodePanel.dragNodeToMainList('Name')`
5. Advance prompt: `interview.nextButton.click()` (if multi-prompt)

#### Network State

- `protocol.waitForNodes(interviewId, expectedCount)` after adding nodes
- Nodes have `type` matching stage subject, `stageId`, and `promptIDs` array

#### Edge Cases

- **maxNodes** (from `stage.behaviours.maxNodes`): After reaching limit, `stage.quickAdd.isDisabled()` returns `true`
- **Multi-prompt**: Each prompt may have its own panels and node type
- **Panel filtering**: Side panels filter by node attributes (e.g., age-based filtering)
- **Duplicate names**: Allowed by default unless `unique` validation on the name variable

#### Snapshot Guidance

- Standard tolerance
- No special masking

---

### NameGenerator (Form-Based)

Node creation via a dialog form.

- **Fixture**: `stage.nameGenerator`, `stage.form`, `stage.nodePanel`
- **Stage config key**: `stage.prompts[]`, `stage.form`, `stage.panels[]`, `stage.behaviours`

#### UI Verification

- Prompt text visible
- "Add a person" button visible
- Side panel(s) if defined

#### Interactions

1. Open add form: `stage.nameGenerator.openAddForm()`
2. Fill fields in dialog: `stage.form.fillText(fieldName, value)`, etc.
3. Submit form: `stage.nameGenerator.submitForm()`
4. Verify node: `expect(stage.getNode('Name')).toBeVisible()`
5. Side panel drag: `stage.nodePanel.dragNodeToMainList('Name')`

#### Network State

- Same as NameGeneratorQuickAdd — nodes created with attributes from form fields
- Form fields map to codebook variables on the node type

#### Edge Cases

- **maxNodes**: "Add a person" button disabled at limit
- **Form validation**: Dialog stays open if validation fails
- **Multi-prompt**: Different prompts may show different panels

#### Snapshot Guidance

- Capture with dialog open for form screenshots
- Standard tolerance

---

### NameGeneratorRoster

Select nodes from a pre-defined roster.

- **Fixture**: `stage.nameGeneratorRoster` (placeholder)
- **Stage config key**: `stage.prompts[]`, `stage.panels[]` (with dataSource)

Placeholder — see `NameGeneratorRosterFixture` JSDoc for methods to implement.

---

## Canvas Stages

### Sociogram

Network visualization with edge creation and node highlighting.

- **Fixture**: `stage.sociogram`
- **Stage config key**: `stage.prompts[]` (with layout, edge, highlight config), `stage.background`

#### UI Verification

- Canvas renders with nodes positioned
- Concentric circles background (if configured)
- Prompt text visible via `stage.getPrompt()`
- Node count matches expected network state

#### Interactions

1. Connect nodes: `stage.sociogram.connectNodes('Alice', 'Bob')`
2. Disconnect nodes: `stage.sociogram.disconnectNodes('Alice', 'Bob')`
3. Check edge count: `stage.sociogram.getEdgeCount()`
4. Toggle highlight: `stage.sociogram.toggleHighlight('Alice')`
5. Check highlight: `stage.sociogram.isNodeHighlighted('Alice')`
6. Click node: `stage.sociogram.clickNode('Alice')`

#### Network State

- `protocol.getNetworkState(interviewId)` — verify edges created/removed
- Edge `type` matches prompt's `createEdge` value
- Highlight sets a boolean attribute on the node (from prompt's `highlight.variable`)

#### Edge Cases

- **Multiple prompts**: Different prompts control different edge types or highlight variables
- **Edge display**: Some prompts only display existing edges, others allow creation
- **Automatic layout**: Nodes may auto-position (force simulation) — positions non-deterministic
- **Linking state**: First click puts node in "linking" mode (`data-node-linking="true"`), second click creates edge

#### Snapshot Guidance

- **High tolerance needed** (10%+ `maxDiffPixelRatio`) — node positions from force layout are non-deterministic
- Canvas-based rendering may vary across browsers

---

### Narrative

Read-only visualization with annotations and drawing. No network mutations.

- **Fixture**: `stage.narrative` (placeholder)
- **Stage config key**: `stage.presets[]`, `stage.background`, `stage.behaviours`

Placeholder — see `NarrativeFixture` JSDoc for methods to implement.

**Snapshot note**: High tolerance needed — canvas rendering and layout positions are non-deterministic.

---

## Census Stages

Census stages iterate through node pairs to collect relational data. They share common patterns:

- Introduction panel (dismissible)
- Pair-based iteration
- Auto-advance after selection (350ms delay)
- Metadata storage for "no" responses

### DyadCensus

Binary yes/no edge creation between all node pairs.

- **Fixture**: `stage.dyadCensus` (placeholder)
- **Stage config key**: `stage.prompts[]` (with `createEdge`), `stage.introductionPanel`

Placeholder — see `DyadCensusFixture` JSDoc for methods to implement.

---

### TieStrengthCensus

Ordinal edge attribute assignment between node pairs.

- **Fixture**: `stage.tieStrengthCensus` (placeholder)
- **Stage config key**: `stage.prompts[]` (with `createEdge`, `edgeVariable`, `negativeLabel`)

Placeholder — see `TieStrengthCensusFixture` JSDoc for methods to implement.

---

### OneToManyDyadCensus

Toggle edges from one source node to multiple targets.

- **Fixture**: `stage.oneToManyDyadCensus` (placeholder)
- **Stage config key**: `stage.prompts[]` (with `createEdge`), no intro panel

Placeholder — see `OneToManyDyadCensusFixture` JSDoc for methods to implement.

---

## Bin Stages

Bin stages categorize nodes by dragging them into labeled containers.

### OrdinalBin

Drag nodes into ordered bins (e.g., "Very Close" → "Not Close").

- **Fixture**: `stage.ordinalBin`
- **Stage config key**: `stage.prompts[]` (with `variable` referencing an ordinal codebook variable)

#### UI Verification

- Prompt text via `stage.getPrompt()`
- Bins rendered as columns, each with heading (`h4`) and node list
- Drawer toggle button showing unplaced count
- Each bin has `data-testid="ordinal-bin-{index}"`

#### Interactions

1. Check unplaced: `stage.ordinalBin.getUnplacedCount()`
2. Drag to bin: `stage.ordinalBin.dragNodeToBin('Alice', 'Very close')`
3. Move between bins: `stage.ordinalBin.moveNodeBetweenBins('Alice', 'Very close', 'Close')`
4. Check placement: `stage.ordinalBin.isNodeInBin('Alice', 'Close')`

#### Network State

- `updateNode` sets the ordinal variable to the bin's value
- Variable is the `prompt.variable` from stage config
- Value is the ordinal option's `value` from codebook

#### Edge Cases

- **All placed required**: Next button only has pulse when `unplacedCount === 0`
- **Multi-prompt**: Different prompts may use different ordinal variables
- **Bin labels**: Come from codebook variable options

#### Snapshot Guidance

- Standard tolerance
- Bin colors use ordinal color gradient — verify bins render correctly

---

### CategoricalBin

Drag nodes into circular category bins.

- **Fixture**: `stage.categoricalBin`
- **Stage config key**: `stage.prompts[]` (with `variable` referencing a categorical codebook variable)

#### UI Verification

- Prompt text via `stage.getPrompt()`
- Circular category bins with labels and item counts
- Drawer toggle showing uncategorized count
- Bins have `aria-label="Category {label}, {count} items"` and `aria-expanded`
- Outer container: `data-testid="categorical-bin-interface"`

#### Interactions

1. Check uncategorized: `stage.categoricalBin.getUnplacedCount()`
2. Drag to category: `stage.categoricalBin.dragNodeToBin('Alice', 'Category A')`
3. Expand bin: `stage.categoricalBin.expandBin('Category A')`
4. Collapse bin: `stage.categoricalBin.collapseBin('Category A')`
5. Check count: `stage.categoricalBin.getNodeCountInBin('Category A')`
6. Move between: `stage.categoricalBin.moveNodeBetweenBins('Alice', 'Category A', 'Category B')`

#### Network State

- `updateNode` sets the categorical variable to the category's value
- "Other" bin (if configured): Sets `otherVariable` and clears main variable

#### Edge Cases

- **All categorized required**: Next button pulse when `uncategorizedCount === 0`
- **"Other" category**: If `otherVariable` and `otherOptionLabel` in prompt, an extra bin appears. Dropping into it opens a text input dialog.
- **Expand/collapse**: Only one bin can be expanded at a time. Click the interface container to collapse.
- **Circle sizing**: Bins resize dynamically based on container dimensions

#### Snapshot Guidance

- Standard tolerance
- Circle layout responsive — capture at consistent viewport

---

## Map Stage

### Geospatial

Map-based location selection.

- **Fixture**: `stage.geospatial`
- **Stage config key**: `stage.prompts[]`, `stage.mapOptions`

#### UI Verification

- Map container (`data-testid="map-container"`) with Mapbox canvas
- Toolbar with zoom in/out (`data-testid="map-zoom-in"`, `map-zoom-out`), recenter (`map-recenter`)
- Search toggle (`data-testid="geospatial-search-toggle"`)
- "Outside Selectable Areas" button (`data-testid="outside-selectable-areas-button"`)
- Prompt text visible

#### Interactions

1. Wait for map: `stage.geospatial.waitForMapLoad()`
2. Zoom: `stage.geospatial.zoomIn()`, `stage.geospatial.zoomOut()`
3. Recenter: `stage.geospatial.recenter()`
4. Search: `stage.geospatial.search('query')`
5. Select suggestion: `stage.geospatial.selectSuggestion('Place Name')`
6. Click on map: `stage.geospatial.clickOnMap(0.5, 0.5)` (percentage coordinates)
7. Outside areas: `stage.geospatial.selectOutsideSelectableAreas()`
8. Deselect: `stage.geospatial.deselectOutsideArea()`

#### Network State

- Clicking on map or selecting a location sets geospatial coordinates on the current node
- "Outside Selectable Areas" sets a special flag attribute

#### Edge Cases

- **Map loading**: Must `waitForMapLoad()` before interacting — map loads layers asynchronously (up to 30s timeout)
- **Multi-node**: Iterates through nodes (one location per node per prompt)
- **Search debounce**: Search API calls are debounced — suggestions may take time to appear
- **Mapbox token**: Requires valid API key — may need mocking in tests

#### Snapshot Guidance

- **High tolerance** — map tiles render differently across runs/browsers
- Mask map canvas for deterministic comparison, or skip map screenshots
- Toolbar and controls are stable for capture

---

## Special Stages

### Information

Display-only stage with text, images, audio, or video.

- **Fixture**: None needed — no interactions beyond advancing
- **Stage config key**: `stage.items[]` (content items: text, image, audio, video)

#### UI Verification

- Content items render (text, images, media players)
- Next button has pulse immediately (always ready)

#### Interactions

- None — just verify content is visible, then advance with `interview.nextButton.click()`

#### Network State

- **No mutations** — information only

#### Edge Cases

- **Video in e2e**: Autoplay disabled when `NEXT_PUBLIC_E2E_TEST=true`; preload set to `'none'`
- **Assets**: Images/audio/video served from asset server (port 4200)

#### Snapshot Guidance

- Standard tolerance
- Video elements auto-masked by interview fixture

---

### Anonymisation

Passphrase entry for encrypting participant names.

- **Fixture**: `stage.anonymisation` (placeholder)
- **Stage config key**: None specific — behavior driven by codebook (encrypted variables)

Placeholder — see `AnonymisationFixture` JSDoc for methods to implement.

---

### FamilyPedigree

Multi-step wizard for building family tree data.

- **Fixture**: `stage.familyPedigree` (placeholder)
- **Stage config key**: `stage.nodeConfig`, `stage.edgeConfig`, `stage.nominationPrompts`

Placeholder — see `FamilyPedigreeFixture` JSDoc for methods to implement.

---

### FinishSession

Interview completion stage (automatically appended).

- **Fixture**: No dedicated fixture needed
- **Stage config key**: None — synthetic stage added automatically

#### UI Verification

- Finish button visible
- Confirmation dialog appears on click

#### Interactions

1. Click finish button
2. Confirm in dialog
3. Verify redirect to completion page

#### Network State

- Interview status updated to `completed` in database
- No network mutations

#### Edge Cases

- **Preview mode**: Different behavior in preview (no actual completion)
- **Confirmation required**: Must confirm in dialog before completing

#### Snapshot Guidance

- Standard tolerance
- Capture confirmation dialog

---

## Fixture Availability Summary

| Stage Type | Fixture | Status |
|---|---|---|
| EgoForm | `stage.form` | Implemented |
| AlterForm | `stage.form` + `stage.slidesForm` | Fields implemented, slides placeholder |
| AlterEdgeForm | `stage.form` + `stage.slidesForm` | Fields implemented, slides placeholder |
| NameGenerator | `stage.nameGenerator` + `stage.form` + `stage.nodePanel` | Implemented |
| NameGeneratorQuickAdd | `stage.quickAdd` + `stage.nodePanel` | Implemented |
| NameGeneratorRoster | `stage.nameGeneratorRoster` | Placeholder |
| Sociogram | `stage.sociogram` | Implemented |
| Narrative | `stage.narrative` | Placeholder |
| DyadCensus | `stage.dyadCensus` | Placeholder |
| OneToManyDyadCensus | `stage.oneToManyDyadCensus` | Placeholder |
| TieStrengthCensus | `stage.tieStrengthCensus` | Placeholder |
| OrdinalBin | `stage.ordinalBin` | Implemented |
| CategoricalBin | `stage.categoricalBin` | Implemented |
| Geospatial | `stage.geospatial` | Implemented |
| Information | None needed | N/A |
| Anonymisation | `stage.anonymisation` | Placeholder |
| FamilyPedigree | `stage.familyPedigree` | Placeholder |
| FinishSession | None needed | N/A |

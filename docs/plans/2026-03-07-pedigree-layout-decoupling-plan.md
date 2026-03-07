# Pedigree Layout Decoupling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Decouple the pedigree layout engine from FamilyTreeCensus, remove hardcoded node dimensions, and make layout reactive to measured node sizes.

**Architecture:** The layout engine becomes a set of pure functions accepting a `LayoutDimensions` parameter. The Zustand store drops all layout state (`x`, `y`, `connectorData`, `runLayout`). A new `<PedigreeLayout>` React component computes layout from store data + dimensions and renders positioned nodes + edge connectors. A `useNodeMeasurement` hook measures any React element via a portal + ResizeObserver.

**Tech Stack:** TypeScript, React, Zustand, Vitest, ResizeObserver API

---

### Task 1: Add `LayoutDimensions` type and refactor `pedigreeAdapter.ts`

**Files:**
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/layoutDimensions.ts`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter.ts`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/pedigreeAdapter.test.ts`

**Step 1: Create `LayoutDimensions` type**

Create `lib/interviewer/Interfaces/FamilyTreeCensus/layoutDimensions.ts`:

```typescript
export type LayoutDimensions = {
  nodeWidth: number;
  nodeHeight: number;
  labelWidth: number;
  labelHeight: number;
  rowGap: number;
  columnGap: number;
};

export function computeLayoutMetrics(dims: LayoutDimensions) {
  const containerWidth = Math.max(dims.nodeWidth, dims.labelWidth);
  const containerHeight = dims.nodeHeight + dims.labelHeight;
  const rowHeight = containerHeight + dims.rowGap;
  const siblingSpacing = containerWidth + dims.columnGap;
  const partnerSpacing = containerWidth + dims.columnGap;

  return {
    containerWidth,
    containerHeight,
    rowHeight,
    siblingSpacing,
    partnerSpacing,
  };
}
```

**Step 2: Update existing tests to pass `LayoutDimensions`**

In `__tests__/pedigreeAdapter.test.ts`:

- Add a `TEST_DIMENSIONS` constant that matches the current `FAMILY_TREE_CONFIG` values:
  ```typescript
  import { type LayoutDimensions } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/layoutDimensions';

  const TEST_DIMENSIONS: LayoutDimensions = {
    nodeWidth: 100,
    nodeHeight: 100,
    labelWidth: 150,
    labelHeight: 60,
    rowGap: 70,
    columnGap: 0,
  };
  ```
- Update all calls to `pedigreeLayoutToPositions(layout, indexToId)` to `pedigreeLayoutToPositions(layout, indexToId, TEST_DIMENSIONS)`
- Update all calls to `buildConnectorData(layout, edges)` to `buildConnectorData(layout, edges, TEST_DIMENSIONS)`
- Replace `FAMILY_TREE_CONFIG.siblingSpacing` with `computeLayoutMetrics(TEST_DIMENSIONS).siblingSpacing`
- Replace `FAMILY_TREE_CONFIG.rowHeight` with `computeLayoutMetrics(TEST_DIMENSIONS).rowHeight`
- Remove the `FAMILY_TREE_CONFIG` import

**Step 3: Run tests to verify they fail**

Run: `pnpm test -- lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/pedigreeAdapter.test.ts`

Expected: FAIL — `pedigreeLayoutToPositions` and `buildConnectorData` don't accept the third argument yet.

**Step 4: Refactor `pedigreeAdapter.ts` to accept `LayoutDimensions`**

In `pedigreeAdapter.ts`:

- Import `type LayoutDimensions` and `computeLayoutMetrics` from `./layoutDimensions`
- Change `pedigreeLayoutToPositions` signature to:
  ```typescript
  export function pedigreeLayoutToPositions(
    layout: PedigreeLayout,
    indexToId: string[],
    dimensions: LayoutDimensions,
  ): Map<string, { x: number; y: number }>
  ```
- Inside, replace `FAMILY_TREE_CONFIG.siblingSpacing` with `metrics.siblingSpacing` and `FAMILY_TREE_CONFIG.rowHeight` with `metrics.rowHeight` (where `const metrics = computeLayoutMetrics(dimensions)`)

- Change `buildConnectorData` signature to:
  ```typescript
  export function buildConnectorData(
    layout: PedigreeLayout,
    _edges: Map<string, Omit<Edge, 'id'>>,
    dimensions: LayoutDimensions,
  ): ConnectorRenderData
  ```
- Inside, replace all `FAMILY_TREE_CONFIG.*` references with values from `computeLayoutMetrics(dimensions)` and `dimensions` directly:
  - `FAMILY_TREE_CONFIG.nodeWidth` -> `dimensions.nodeWidth`
  - `FAMILY_TREE_CONFIG.nodeHeight` -> `dimensions.nodeHeight`
  - `FAMILY_TREE_CONFIG.siblingSpacing` -> `metrics.siblingSpacing`
  - `FAMILY_TREE_CONFIG.rowHeight` -> `metrics.rowHeight`
  - `FAMILY_TREE_CONFIG.nodeContainerWidth` -> `metrics.containerWidth`
- Remove the `FAMILY_TREE_CONFIG` import from `pedigreeAdapter.ts`

**Step 5: Run tests to verify they pass**

Run: `pnpm test -- lib/interviewer/Interfaces/FamilyTreeCensus/__tests__/pedigreeAdapter.test.ts`

Expected: PASS — all existing tests pass with the same values.

**Step 6: Commit**

```
feat: add LayoutDimensions type and refactor pedigreeAdapter to accept it
```

---

### Task 2: Remove layout state from the Zustand store

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/store.ts`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode.tsx` (remove `x`, `y` from `FamilyTreeNodeType`)

**Step 1: Remove layout-related state and actions from the store**

In `store.ts`:

- Remove `connectorData` from `FamilyTreeState`:
  ```typescript
  // Remove this line:
  connectorData: ConnectorRenderData | null;
  ```
- Remove `runLayout` from `NetworkActions` type
- Remove `runLayout` from `initialState` (`connectorData: null`)
- Remove the `runLayout` implementation (lines ~1014-1034)
- Remove the `runLayout()` calls in `removeNode` (line ~432) and `generatePlaceholderNetwork` (line ~719) and `addPlaceholderNode` (line ~1010)
- Remove imports: `buildConnectorData`, `ConnectorRenderData`, `pedigreeLayoutToPositions`, `storeToPedigreeInput`, `alignPedigree`

In `components/FamilyTreeNode.tsx`:

- Remove `x` and `y` from the `FamilyTreeNodeType` type (they're no longer stored on nodes)

**Step 2: Fix compilation errors**

After removing `x`/`y` from `FamilyTreeNodeType`, find and fix all references. The main consumers:
- `FamilyTreeShells.tsx` — will be updated in Task 4
- `PedigreeLayout.stories.tsx` — will be updated in Task 5
- `EdgeRenderer.tsx` — will be updated in Task 4

For now, temporarily comment or stub these to get the build passing. These files will be properly updated in subsequent tasks.

**Step 3: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS (or only errors in files being updated in subsequent tasks).

**Step 4: Commit**

```
refactor: remove layout state from family tree Zustand store
```

---

### Task 3: Create `useNodeMeasurement` hook and `<PedigreeLayout>` component

**Files:**
- Create: `hooks/useNodeMeasurement.ts`
- Create: `lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/EdgeRenderer.tsx`

**Step 1: Create `useNodeMeasurement` hook**

Create `hooks/useNodeMeasurement.ts`:

```typescript
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

type NodeMeasurement = {
  nodeWidth: number;
  nodeHeight: number;
};

type UseNodeMeasurementProps = {
  component: ReactElement;
};

export function useNodeMeasurement({ component }: UseNodeMeasurementProps) {
  const [measurement, setMeasurement] = useState<NodeMeasurement>({
    nodeWidth: 0,
    nodeHeight: 0,
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    // Create a hidden container for the probe
    const container = document.createElement('div');
    container.style.visibility = 'hidden';
    container.style.position = 'absolute';
    container.style.pointerEvents = 'none';
    // Place off-screen to avoid any layout interference
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    containerRef.current = container;

    return () => {
      observerRef.current?.disconnect();
      document.body.removeChild(container);
      containerRef.current = null;
    };
  }, []);

  // The portal and ResizeObserver setup
  const portal = containerRef.current
    ? createPortal(
        <div
          ref={(el) => {
            if (!el) return;
            // Disconnect previous observer
            observerRef.current?.disconnect();

            // Create new observer
            const observer = new ResizeObserver((entries) => {
              const entry = entries[0];
              if (!entry) return;
              const { width, height } = entry.contentRect;
              setMeasurement((prev) => {
                if (prev.nodeWidth === width && prev.nodeHeight === height) {
                  return prev;
                }
                return { nodeWidth: width, nodeHeight: height };
              });
            });

            observer.observe(el);
            observerRef.current = observer;
          }}
          style={{ display: 'inline-block' }}
        >
          {component}
        </div>,
        containerRef.current,
      )
    : null;

  return { ...measurement, portal };
}
```

The consumer must render `portal` in their JSX for the measurement to work (e.g., `{portal}` somewhere in the return).

**Step 2: Create `<PedigreeLayout>` component**

Create `lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout.tsx`:

```tsx
import { useMemo, type ReactNode } from 'react';
import Spinner from '~/components/Spinner';
import { type FamilyTreeNodeType } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import {
  computeLayoutMetrics,
  type LayoutDimensions,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/layoutDimensions';
import {
  buildConnectorData,
  pedigreeLayoutToPositions,
  storeToPedigreeInput,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter';
import { type Edge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { alignPedigree } from '~/lib/pedigree-layout/alignPedigree';
import { PedigreeEdgeSvg } from './EdgeRenderer';

type PedigreeLayoutNode = Omit<FamilyTreeNodeType, 'id'> & { id: string };

type PedigreeLayoutProps = {
  nodes: Map<string, Omit<FamilyTreeNodeType, 'id'>>;
  edges: Map<string, Omit<Edge, 'id'>>;
  nodeWidth: number;
  nodeHeight: number;
  labelWidth: number;
  labelHeight: number;
  rowGap: number;
  columnGap: number;
  renderNode: (node: PedigreeLayoutNode) => ReactNode;
};

export default function PedigreeLayout({
  nodes,
  edges,
  nodeWidth,
  nodeHeight,
  labelWidth,
  labelHeight,
  rowGap,
  columnGap,
  renderNode,
}: PedigreeLayoutProps) {
  const dimensions: LayoutDimensions = useMemo(
    () => ({ nodeWidth, nodeHeight, labelWidth, labelHeight, rowGap, columnGap }),
    [nodeWidth, nodeHeight, labelWidth, labelHeight, rowGap, columnGap],
  );

  const metrics = useMemo(() => computeLayoutMetrics(dimensions), [dimensions]);

  const layoutResult = useMemo(() => {
    if (nodeWidth === 0 || nodeHeight === 0) return null;
    if (nodes.size === 0) return null;

    const { input, indexToId } = storeToPedigreeInput(nodes, edges);
    if (input.id.length === 0) return null;

    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(layout, indexToId, dimensions);
    const connectorData = buildConnectorData(layout, edges, dimensions);

    return { positions, connectorData };
  }, [nodes, edges, dimensions, nodeWidth, nodeHeight]);

  if (nodeWidth === 0 || nodeHeight === 0) {
    return <Spinner />;
  }

  if (!layoutResult) return null;

  const { positions, connectorData } = layoutResult;

  // Compute tree bounds
  let maxX = 0;
  let maxY = 0;
  for (const pos of positions.values()) {
    maxX = Math.max(maxX, pos.x + metrics.containerWidth);
    maxY = Math.max(maxY, pos.y + metrics.containerHeight);
  }

  const edgeColor = 'var(--color-edge-1)';

  return (
    <div
      className="relative"
      style={{ minWidth: maxX, minHeight: maxY }}
    >
      <PedigreeEdgeSvg
        connectorData={connectorData}
        color={edgeColor}
        width={maxX}
        height={maxY}
      />
      {Array.from(nodes.entries()).map(([id, node]) => {
        const pos = positions.get(id);
        if (!pos) return null;

        return (
          <div
            key={id}
            className="absolute"
            style={{
              top: pos.y,
              left: pos.x,
              width: metrics.containerWidth,
              height: metrics.containerHeight,
            }}
          >
            {renderNode({ id, ...node })}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 3: Refactor `EdgeRenderer.tsx`**

The default `EdgeRenderer` export is no longer needed — its responsibilities are split between `PedigreeEdgeSvg` (already extracted) and `PedigreeLayout`. The `PedigreeEdgeSvg` export stays. The `getEdgeType` selector export stays if used elsewhere.

Check if the default `EdgeRenderer` export is used anywhere besides `FamilyTreeShells.tsx`:

- If only used in `FamilyTreeShells.tsx`, it will be replaced in Task 4
- Keep the file for `PedigreeEdgeSvg` and `getEdgeType` exports
- The default export can be removed once `FamilyTreeShells` is updated

**Step 4: Run typecheck**

Run: `pnpm typecheck`

Expected: May have errors in `FamilyTreeShells.tsx` (updated in next task). The new files should compile cleanly.

**Step 5: Commit**

```
feat: add useNodeMeasurement hook and PedigreeLayout component
```

---

### Task 4: Update `FamilyTreeShells` to use `PedigreeLayout`

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeShells.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode.tsx`
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/components/EdgeRenderer.tsx`

**Step 1: Update `FamilyTreeNode` to remove positioning and size overrides**

In `FamilyTreeNode.tsx`:

- Remove `x` and `y` from `FamilyTreeNodeProps`
- Remove the outer wrapper `div` that applies `position: absolute; top: y; left: x; width: nodeContainerWidth; height: nodeContainerHeight` — `PedigreeLayout` now handles this
- Remove all `style={{ width: FAMILY_TREE_CONFIG.nodeWidth, height: FAMILY_TREE_CONFIG.nodeHeight }}` from Node components — let Node use its natural `size="sm"`
- Add `size="sm"` prop to the Node components that previously relied on the style override
- Remove the `FAMILY_TREE_CONFIG` import

The component now renders its content (node + label) without worrying about positioning. The root element should be a flex column container:

```tsx
export default function FamilyTreeNode(props: FamilyTreeNodeProps) {
  // ... (remove x, y from destructuring)

  return (
    <div
      className="family-tree-node"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={() => {
        if (shouldHandleClick()) handleClick?.();
      }}
    >
      <div
        className="relative flex flex-col items-center gap-2 text-center"
        {...dragProps}
      >
        {renderNodeContent()}
      </div>
    </div>
  );
}
```

**Step 2: Update `FamilyTreeShells` to use `PedigreeLayout`**

In `FamilyTreeShells.tsx`:

- Import `PedigreeLayout` from `./PedigreeLayout`
- Import `useNodeMeasurement` from `~/hooks/useNodeMeasurement`
- Import `Node` from `~/components/Node`
- Remove import of `EdgeRenderer`
- Remove import of `FAMILY_TREE_CONFIG`
- Remove the `treeWidth` calculation (PedigreeLayout handles sizing)
- Add measurement hook:
  ```typescript
  const { nodeWidth, nodeHeight, portal } = useNodeMeasurement({
    component: <Node size="sm" />,
  });
  ```
- Replace the tree rendering section with:
  ```tsx
  <div className="census-node-canvas relative size-full overflow-x-auto pt-6">
    {portal}
    <div className="relative flex size-full min-w-fit justify-center">
      <PedigreeLayout
        nodes={nodesMap}
        edges={edgesMap}
        nodeWidth={nodeWidth}
        nodeHeight={nodeHeight}
        labelWidth={150}
        labelHeight={60}
        rowGap={70}
        columnGap={0}
        renderNode={(node) => (
          <FamilyTreeNode
            placeholderId={node.id}
            networkNode={
              node.interviewNetworkId
                ? networkNodeMap.get(node.interviewNetworkId)
                : undefined
            }
            label={node.label}
            isEgo={node.isEgo}
            allowDrag={node.readOnly !== true && stepIndex < 2}
            shape={node.sex === 'female' ? 'circle' : 'square'}
            selected={
              node.interviewNetworkId != null &&
              typeof diseaseVariable === 'string' &&
              node.diseases?.get(diseaseVariable)
            }
            handleClick={() => { /* existing click logic */ }}
          />
        )}
      />
    </div>
  </div>
  ```
- Remove the old manual node rendering loop and `<EdgeRenderer />`

**Step 3: Clean up `EdgeRenderer.tsx`**

- Remove the default `EdgeRenderer` export (no longer used)
- Keep `PedigreeEdgeSvg` and `getEdgeType` exports
- Remove `useFamilyTreeStore` import and any other unused imports
- Consider renaming file to `PedigreeEdgeSvg.tsx` if `getEdgeType` can be moved elsewhere

**Step 4: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint --fix`

Expected: PASS

**Step 5: Commit**

```
refactor: wire FamilyTreeShells to PedigreeLayout component
```

---

### Task 5: Update storybook and delete `FAMILY_TREE_CONFIG`

**Files:**
- Modify: `lib/interviewer/Interfaces/FamilyTreeCensus/PedigreeLayout.stories.tsx`
- Delete: `lib/interviewer/Interfaces/FamilyTreeCensus/config.ts`
- Modify: any remaining files importing `FAMILY_TREE_CONFIG`

**Step 1: Update storybook to use `PedigreeLayout` component**

Rewrite `PedigreeLayout.stories.tsx`:

- Remove the `PedigreeVisualization` component entirely
- Import `PedigreeLayout` from `./components/PedigreeLayout`
- Import `Node` from `~/components/Node`
- Use static dimensions (matching the old config values):
  ```typescript
  const STORY_DIMENSIONS = {
    nodeWidth: 100,
    nodeHeight: 100,
    labelWidth: 150,
    labelHeight: 60,
    rowGap: 70,
    columnGap: 0,
  };
  ```
- Each story creates a store, runs no layout (PedigreeLayout handles it), and renders:
  ```tsx
  <PedigreeLayout
    nodes={nodesMap}
    edges={edgesMap}
    {...STORY_DIMENSIONS}
    renderNode={(node) => (
      <div className="flex flex-col items-center gap-1 text-center">
        <Node
          className="shrink-0"
          color={node.isEgo ? 'node-color-seq-2' : 'node-color-seq-1'}
          label={node.isEgo ? 'You' : ''}
          shape={node.sex === 'female' ? 'circle' : 'square'}
          size="sm"
        />
        <span className="text-xs text-white">{node.label}</span>
      </div>
    )}
  />
  ```
- Remove all `runLayout()` calls from stories — PedigreeLayout computes layout internally
- The `buildStore` helper remains for creating test graph data

**Step 2: Delete `config.ts`**

Run: `git rm lib/interviewer/Interfaces/FamilyTreeCensus/config.ts`

Verify no remaining imports:

Run: `grep -rn "FAMILY_TREE_CONFIG\|from.*config" lib/interviewer/Interfaces/FamilyTreeCensus/ --include='*.ts' --include='*.tsx'`

Fix any remaining references.

**Step 3: Run full quality checks**

Run: `pnpm typecheck && pnpm lint --fix && pnpm test`

Expected: All pass.

**Step 4: Verify storybook renders**

Prompt the user to run `pnpm storybook` and verify the PedigreeLayout stories render correctly.

**Step 5: Commit**

```
refactor: update storybook to use PedigreeLayout, delete FAMILY_TREE_CONFIG
```

---

### Task 6: Clean up and verify

**Files:**
- Verify: all files in `lib/interviewer/Interfaces/FamilyTreeCensus/`

**Step 1: Run knip to find unused exports**

Run: `pnpm knip`

Remove any dead code flagged by knip that relates to the layout refactor (old imports, unused types, etc.).

**Step 2: Run full test suite**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected: All pass.

**Step 3: Commit any cleanup**

```
chore: clean up unused code from layout decoupling
```

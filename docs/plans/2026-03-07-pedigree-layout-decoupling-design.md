# Decoupled Pedigree Layout

Separate the pedigree layout engine from the FamilyTreeCensus implementation and remove hardcoded node dimensions from `FAMILY_TREE_CONFIG`, replacing them with measured or consumer-provided values.

## Goals

- Layout engine is framework-agnostic (no React, no Zustand, no config singletons)
- Node dimensions are an input, not a hardcoded constant
- Layout reflows reactively when node size changes (e.g., viewport breakpoint)
- Zustand store is purely a graph data store (nodes + edges), not a layout store

## `LayoutDimensions` type

```typescript
type LayoutDimensions = {
  nodeWidth: number;
  nodeHeight: number;
  labelWidth: number;
  labelHeight: number;
  rowGap: number;
  columnGap: number;
};
```

Derived internally by the layout engine:

- `containerWidth = Math.max(nodeWidth, labelWidth)`
- `containerHeight = nodeHeight + labelHeight`
- `rowHeight = containerHeight + rowGap`
- `siblingSpacing = containerWidth + columnGap`

## Layout engine (`pedigreeAdapter.ts`)

`pedigreeLayoutToPositions` and `buildConnectorData` accept `LayoutDimensions` as a parameter instead of reading `FAMILY_TREE_CONFIG`. They remain pure functions.

## Zustand store changes

Remove from the store:

- `x`, `y` from node data
- `connectorData` state
- `runLayout` action

The store becomes a graph data store: nodes, edges, and mutations.

## `useNodeMeasurement` hook

```tsx
const { nodeWidth, nodeHeight } = useNodeMeasurement({
  component: <Node size="sm" />,
});
```

- Renders the provided React element into a portal on `document.body`
- Portal container styled `visibility: hidden; position: absolute`
- Uses `ResizeObserver` for reactive updates on viewport changes
- Returns `{ nodeWidth: 0, nodeHeight: 0 }` before first measurement

## `<PedigreeLayout />` component

```tsx
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
    <FamilyTreeNode ... />
  )}
/>
```

Internal behavior:

- If `nodeWidth` or `nodeHeight` is 0, renders `<Spinner />`
- Computes `LayoutDimensions` from props
- Runs layout via `useMemo`: `storeToPedigreeInput` -> `alignPedigree` -> `pedigreeLayoutToPositions` + `buildConnectorData`
- Renders a relatively-positioned container div sized to the tree bounds
- For each node: renders a positioned wrapper div (`position: absolute`, `top`, `left`, `width: containerWidth`, `height: containerHeight`) and calls `renderNode(node)` inside it
- Renders `<PedigreeEdgeSvg>` internally for edge connectors

## `FAMILY_TREE_CONFIG` removal

Deleted entirely. Its values are replaced by:

- Measured values: `nodeWidth`, `nodeHeight`
- Props on `PedigreeLayout`: `labelWidth`, `labelHeight`, `rowGap`, `columnGap`
- Internal derivations in the layout engine

## Consumer usage (`FamilyTreeShells`)

```tsx
const nodesMap = useFamilyTreeStore((s) => s.network.nodes);
const edgesMap = useFamilyTreeStore((s) => s.network.edges);
const { nodeWidth, nodeHeight } = useNodeMeasurement({
  component: <Node size="sm" />,
});

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
      networkNode={networkNodeMap.get(node.interviewNetworkId)}
      label={node.label}
      shape={node.sex === 'female' ? 'circle' : 'square'}
      isEgo={node.isEgo}
      allowDrag={node.readOnly !== true && stepIndex < 2}
      selected={...}
      handleClick={() => { ... }}
    />
  )}
/>
```

Non-React consumers (tests, storybook) pass static dimension values directly without `useNodeMeasurement`.

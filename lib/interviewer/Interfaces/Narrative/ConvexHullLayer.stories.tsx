import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useRef } from 'react';
import { createCanvasStore } from '~/lib/interviewer/canvas/useCanvasStore';
import ConvexHullLayer from '~/lib/interviewer/Interfaces/Narrative/ConvexHullLayer';

const CATEGORICAL_OPTIONS = [
  { value: 1, label: 'Group A' },
  { value: 2, label: 'Group B' },
  { value: 3, label: 'Group C' },
];

function makeNode(
  id: string,
  name: string,
  groups: number[],
  x: number,
  y: number,
): NcNode {
  return {
    [entityPrimaryKeyProperty]: id,
    [entityAttributesProperty]: {
      name,
      group: groups,
      layout: { x, y },
    },
    type: 'person',
    promptIDs: [],
    stageId: 'stage-1',
  };
}

const NODES_MANY: NcNode[] = [
  makeNode('1', 'Alice', [1], 0.2, 0.3),
  makeNode('2', 'Bob', [1], 0.25, 0.35),
  makeNode('3', 'Charlie', [1], 0.3, 0.25),
  makeNode('4', 'Diana', [1], 0.22, 0.2),
  makeNode('5', 'Eve', [2], 0.6, 0.5),
  makeNode('6', 'Frank', [2], 0.65, 0.55),
  makeNode('7', 'Grace', [2], 0.7, 0.45),
  makeNode('8', 'Hank', [3], 0.5, 0.8),
  makeNode('9', 'Ivy', [3], 0.55, 0.75),
  makeNode('10', 'Jack', [3], 0.45, 0.85),
  makeNode('11', 'Kate', [3], 0.5, 0.7),
];

const NODES_FEW: NcNode[] = [
  makeNode('1', 'Alice', [1], 0.3, 0.4),
  makeNode('2', 'Bob', [2], 0.6, 0.3),
  makeNode('3', 'Charlie', [2], 0.7, 0.5),
];

/**
 * Wrapper that creates a Zustand store and syncs positions,
 * rendering ConvexHullLayer inside an SVG-compatible container.
 */
function ConvexHullLayerWrapper({ nodes }: { nodes: NcNode[] }) {
  const storeRef = useRef(createCanvasStore());
  const store = storeRef.current;

  useEffect(() => {
    store.getState().syncFromNodes(nodes, 'layout');
  }, [nodes, store]);

  return (
    <div className="relative bg-black" style={{ width: 500, height: 500 }}>
      <ConvexHullLayer
        store={store}
        nodes={nodes}
        groupVariable="group"
        categoricalOptions={CATEGORICAL_OPTIONS}
      />
      {/* Render node dots for visual reference */}
      {nodes.map((node) => {
        const attrs = node[entityAttributesProperty];
        const pos = attrs.layout as { x: number; y: number };
        const groups = attrs.group as number[];
        const colorIndex =
          CATEGORICAL_OPTIONS.findIndex((o) => o.value === groups[0]) + 1;
        return (
          <div
            key={node[entityPrimaryKeyProperty]}
            className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              backgroundColor: `var(--color-cat-color-seq-${colorIndex})`,
            }}
          />
        );
      })}
    </div>
  );
}

const meta: Meta<typeof ConvexHullLayer> = {
  title: 'Interview/Narrative/ConvexHullLayer',
  component: ConvexHullLayer,
  parameters: {
    forceTheme: 'interview',
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeGroups: Story = {
  render: () => <ConvexHullLayerWrapper nodes={NODES_MANY} />,
};

export const SingleAndPairNodes: Story = {
  render: () => <ConvexHullLayerWrapper nodes={NODES_FEW} />,
};

export const SingleNode: Story = {
  render: () => (
    <ConvexHullLayerWrapper nodes={[makeNode('1', 'Alone', [1], 0.5, 0.5)]} />
  ),
};

export const TwoNodes: Story = {
  render: () => (
    <ConvexHullLayerWrapper
      nodes={[
        makeNode('1', 'Alice', [1], 0.3, 0.5),
        makeNode('2', 'Bob', [1], 0.7, 0.5),
      ]}
    />
  ),
};

export const OverlappingGroups: Story = {
  render: () => (
    <ConvexHullLayerWrapper
      nodes={[
        makeNode('1', 'Alice', [1, 2], 0.4, 0.4),
        makeNode('2', 'Bob', [1], 0.3, 0.3),
        makeNode('3', 'Charlie', [2], 0.5, 0.5),
        makeNode('4', 'Diana', [1, 2], 0.45, 0.35),
      ]}
    />
  ),
};

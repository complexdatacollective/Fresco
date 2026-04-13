import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useRef } from 'react';
import { createCanvasStore } from '~/lib/interviewer/canvas/useCanvasStore';
import ConvexHullLayer from '~/lib/interviewer/Interfaces/Narrative/ConvexHullLayer';

type CategoricalValue = string | number | boolean;

const CATEGORICAL_OPTIONS = [
  { value: 'group-a', label: 'Group A' },
  { value: 'group-b', label: 'Group B' },
  { value: 'group-c', label: 'Group C' },
];

function makeNode(
  id: string,
  name: string,
  group: CategoricalValue | CategoricalValue[],
  x: number,
  y: number,
): NcNode {
  return {
    [entityPrimaryKeyProperty]: id,
    [entityAttributesProperty]: {
      name,
      group,
      layout: { x, y },
    },
    type: 'person',
    promptIDs: [],
    stageId: 'stage-1',
  };
}

const NODES_MANY: NcNode[] = [
  makeNode('1', 'Alice', 'group-a', 0.2, 0.3),
  makeNode('2', 'Bob', 'group-a', 0.25, 0.35),
  makeNode('3', 'Charlie', 'group-a', 0.3, 0.25),
  makeNode('4', 'Diana', 'group-a', 0.22, 0.2),
  makeNode('5', 'Eve', 'group-b', 0.6, 0.5),
  makeNode('6', 'Frank', 'group-b', 0.65, 0.55),
  makeNode('7', 'Grace', 'group-b', 0.7, 0.45),
  makeNode('8', 'Hank', 'group-c', 0.5, 0.8),
  makeNode('9', 'Ivy', 'group-c', 0.55, 0.75),
  makeNode('10', 'Jack', 'group-c', 0.45, 0.85),
  makeNode('11', 'Kate', 'group-c', 0.5, 0.7),
];

const NODES_FEW: NcNode[] = [
  makeNode('1', 'Alice', 'group-a', 0.3, 0.4),
  makeNode('2', 'Bob', 'group-b', 0.6, 0.3),
  makeNode('3', 'Charlie', 'group-b', 0.7, 0.5),
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
        const raw = attrs.group;
        const firstValue = Array.isArray(raw) ? raw[0] : raw;
        const colorIndex =
          CATEGORICAL_OPTIONS.findIndex((o) => o.value === firstValue) + 1;
        return (
          <div
            key={node[entityPrimaryKeyProperty]}
            className="absolute size-3 -translate-1/2 rounded-full"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              backgroundColor: `var(--color-cat-${colorIndex})`,
            }}
          />
        );
      })}
    </div>
  );
}

const meta: Meta<typeof ConvexHullLayer> = {
  title: 'Interview/Components/ConvexHullLayer',
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
    <ConvexHullLayerWrapper
      nodes={[makeNode('1', 'Alone', 'group-a', 0.5, 0.5)]}
    />
  ),
};

export const TwoNodes: Story = {
  render: () => (
    <ConvexHullLayerWrapper
      nodes={[
        makeNode('1', 'Alice', 'group-a', 0.3, 0.5),
        makeNode('2', 'Bob', 'group-a', 0.7, 0.5),
      ]}
    />
  ),
};

/** Nodes belonging to multiple groups via array values (CheckboxGroup path). */
export const OverlappingGroups: Story = {
  render: () => (
    <ConvexHullLayerWrapper
      nodes={[
        makeNode('1', 'Alice', ['group-a', 'group-b'], 0.4, 0.4),
        makeNode('2', 'Bob', 'group-a', 0.3, 0.3),
        makeNode('3', 'Charlie', 'group-b', 0.5, 0.5),
        makeNode('4', 'Diana', ['group-a', 'group-b'], 0.45, 0.35),
      ]}
    />
  ),
};

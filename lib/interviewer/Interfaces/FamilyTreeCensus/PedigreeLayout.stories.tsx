import { faker } from '@faker-js/faker';
import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import Node from '~/components/Node';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';
import { type FamilyTreeNodeType } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import PedigreeLayout from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout';
import { type Edge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

const meta: Meta = {
  title: 'Systems/PedigreeLayout',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: { source: { type: 'code' } },
  },
  argTypes: {
    network: {
      control: 'select',
      options: [
        'Simple Couple',
        'Nuclear Family',
        'Three Generations',
        'Extended Family',
      ],
    },
    nodeStyle: {
      control: 'select',
      options: ['Colored Node', 'Labeled Node', 'Node with Subtitle', 'Dot'],
    },
  },
  args: {
    network: 'Three Generations',
    nodeStyle: 'Labeled Node',
  },
};

export default meta;

faker.seed(42);

type NodeData = Omit<FamilyTreeNodeType, 'id'>;
type EdgeData = Omit<Edge, 'id'>;

type NetworkData = {
  nodes: Map<string, NodeData>;
  edges: Map<string, EdgeData>;
};

function fakeName(sex?: 'male' | 'female') {
  return faker.person.fullName({ sex });
}

function buildNetwork(
  nodeDefs: {
    id: string;
    label: string;
    sex?: 'male' | 'female';
    isEgo?: boolean;
  }[],
  edgeDefs: {
    source: string;
    target: string;
    relationship: Edge['relationship'];
  }[],
): NetworkData {
  const nodes = new Map<string, NodeData>();
  for (const { id, label, sex, isEgo } of nodeDefs) {
    nodes.set(id, { label, sex, isEgo, readOnly: false });
  }

  const edges = new Map<string, EdgeData>();
  for (let i = 0; i < edgeDefs.length; i++) {
    const e = edgeDefs[i]!;
    edges.set(`e${i}`, {
      source: e.source,
      target: e.target,
      relationship: e.relationship,
    });
  }

  return { nodes, edges };
}

const NETWORKS: Record<string, NetworkData> = {
  'Simple Couple': buildNetwork(
    [
      { id: 'ego', label: fakeName('male'), sex: 'male', isEgo: true },
      { id: 'partner', label: fakeName('female'), sex: 'female' },
    ],
    [{ source: 'ego', target: 'partner', relationship: 'partner' }],
  ),
  'Nuclear Family': buildNetwork(
    [
      { id: 'father', label: fakeName('male'), sex: 'male' },
      { id: 'mother', label: fakeName('female'), sex: 'female' },
      { id: 'ego', label: fakeName('male'), sex: 'male', isEgo: true },
      { id: 'sister', label: fakeName('female'), sex: 'female' },
      { id: 'brother', label: fakeName('male'), sex: 'male' },
    ],
    [
      { source: 'father', target: 'mother', relationship: 'partner' },
      { source: 'father', target: 'ego', relationship: 'parent' },
      { source: 'mother', target: 'ego', relationship: 'parent' },
      { source: 'father', target: 'sister', relationship: 'parent' },
      { source: 'mother', target: 'sister', relationship: 'parent' },
      { source: 'father', target: 'brother', relationship: 'parent' },
      { source: 'mother', target: 'brother', relationship: 'parent' },
    ],
  ),
  'Three Generations': buildNetwork(
    [
      { id: 'pgf', label: fakeName('male'), sex: 'male' },
      { id: 'pgm', label: fakeName('female'), sex: 'female' },
      { id: 'mgf', label: fakeName('male'), sex: 'male' },
      { id: 'mgm', label: fakeName('female'), sex: 'female' },
      { id: 'father', label: fakeName('male'), sex: 'male' },
      { id: 'mother', label: fakeName('female'), sex: 'female' },
      { id: 'ego', label: fakeName('male'), sex: 'male', isEgo: true },
      { id: 'sister', label: fakeName('female'), sex: 'female' },
    ],
    [
      { source: 'pgf', target: 'pgm', relationship: 'partner' },
      { source: 'mgf', target: 'mgm', relationship: 'partner' },
      { source: 'pgf', target: 'father', relationship: 'parent' },
      { source: 'pgm', target: 'father', relationship: 'parent' },
      { source: 'mgf', target: 'mother', relationship: 'parent' },
      { source: 'mgm', target: 'mother', relationship: 'parent' },
      { source: 'father', target: 'mother', relationship: 'partner' },
      { source: 'father', target: 'ego', relationship: 'parent' },
      { source: 'mother', target: 'ego', relationship: 'parent' },
      { source: 'father', target: 'sister', relationship: 'parent' },
      { source: 'mother', target: 'sister', relationship: 'parent' },
    ],
  ),
  'Extended Family': buildNetwork(
    [
      { id: 'pgf', label: fakeName('male'), sex: 'male' },
      { id: 'pgm', label: fakeName('female'), sex: 'female' },
      { id: 'mgf', label: fakeName('male'), sex: 'male' },
      { id: 'mgm', label: fakeName('female'), sex: 'female' },
      { id: 'father', label: fakeName('male'), sex: 'male' },
      { id: 'mother', label: fakeName('female'), sex: 'female' },
      { id: 'aunt', label: fakeName('female'), sex: 'female' },
      { id: 'uncle-spouse', label: fakeName('male'), sex: 'male' },
      { id: 'p-uncle', label: fakeName('male'), sex: 'male' },
      { id: 'ego', label: fakeName('male'), sex: 'male', isEgo: true },
      { id: 'partner', label: fakeName('female'), sex: 'female' },
      { id: 'sister', label: fakeName('female'), sex: 'female' },
      { id: 'cousin1', label: fakeName('male'), sex: 'male' },
      { id: 'cousin2', label: fakeName('female'), sex: 'female' },
      { id: 'son', label: fakeName('male'), sex: 'male' },
      { id: 'daughter', label: fakeName('female'), sex: 'female' },
    ],
    [
      { source: 'pgf', target: 'pgm', relationship: 'partner' },
      { source: 'mgf', target: 'mgm', relationship: 'partner' },
      { source: 'pgf', target: 'father', relationship: 'parent' },
      { source: 'pgm', target: 'father', relationship: 'parent' },
      { source: 'pgf', target: 'p-uncle', relationship: 'parent' },
      { source: 'pgm', target: 'p-uncle', relationship: 'parent' },
      { source: 'mgf', target: 'mother', relationship: 'parent' },
      { source: 'mgm', target: 'mother', relationship: 'parent' },
      { source: 'mgf', target: 'aunt', relationship: 'parent' },
      { source: 'mgm', target: 'aunt', relationship: 'parent' },
      { source: 'father', target: 'mother', relationship: 'partner' },
      { source: 'uncle-spouse', target: 'aunt', relationship: 'partner' },
      { source: 'ego', target: 'partner', relationship: 'partner' },
      { source: 'father', target: 'ego', relationship: 'parent' },
      { source: 'mother', target: 'ego', relationship: 'parent' },
      { source: 'father', target: 'sister', relationship: 'parent' },
      { source: 'mother', target: 'sister', relationship: 'parent' },
      { source: 'uncle-spouse', target: 'cousin1', relationship: 'parent' },
      { source: 'aunt', target: 'cousin1', relationship: 'parent' },
      { source: 'uncle-spouse', target: 'cousin2', relationship: 'parent' },
      { source: 'aunt', target: 'cousin2', relationship: 'parent' },
      { source: 'ego', target: 'son', relationship: 'parent' },
      { source: 'partner', target: 'son', relationship: 'parent' },
      { source: 'ego', target: 'daughter', relationship: 'parent' },
      { source: 'partner', target: 'daughter', relationship: 'parent' },
    ],
  ),
};

type NodeRenderer = (node: {
  id: string;
  label: string;
  sex?: 'male' | 'female';
  isEgo?: boolean;
}) => React.ReactNode;

const NODE_MEASUREMENT_COMPONENTS: Record<string, React.ReactElement> = {
  'Colored Node': <Node size="sm" />,
  'Labeled Node': (
    <div className="flex flex-col items-center gap-1">
      <Node size="sm" />
      <span className="text-xs text-white">placeholder</span>
    </div>
  ),
  'Node with Subtitle': (
    <div className="flex flex-col items-center gap-1">
      <Node size="sm" />
      <span className="text-xs text-white">placeholder</span>
      <span className="text-[10px] text-white/60">subtitle</span>
    </div>
  ),
  'Dot': <div className="size-4 rounded-full bg-white" />,
};

const NODE_RENDERERS: Record<string, NodeRenderer> = {
  'Colored Node': (node) => (
    <Node
      color={node.isEgo ? 'node-color-seq-2' : 'node-color-seq-1'}
      shape={node.sex === 'female' ? 'circle' : 'square'}
      size="sm"
    />
  ),
  'Labeled Node': (node) => (
    <div className="flex flex-col items-center gap-1 text-center">
      <Node
        className="shrink-0"
        color={node.isEgo ? 'node-color-seq-2' : 'node-color-seq-1'}
        label={node.label}
        shape={node.sex === 'female' ? 'circle' : 'square'}
        size="sm"
      />
      <span className="max-w-24 truncate text-xs text-white">{node.label}</span>
    </div>
  ),
  'Node with Subtitle': (node) => (
    <div className="flex flex-col items-center gap-1 text-center">
      <Node
        className="shrink-0"
        color={node.isEgo ? 'node-color-seq-2' : 'node-color-seq-1'}
        label={node.label}
        shape={node.sex === 'female' ? 'circle' : 'square'}
        size="sm"
      />
      <span className="max-w-24 truncate text-xs text-white">{node.label}</span>
      <span className="text-[10px] text-white/60">
        {node.isEgo ? 'Ego' : (node.sex ?? 'unknown')}
      </span>
    </div>
  ),
  'Dot': (node) => (
    <div
      className={`size-4 rounded-full ${node.isEgo ? 'bg-yellow-400' : 'bg-white'}`}
      title={node.label}
    />
  ),
};

type StoryArgs = {
  network: string;
  nodeStyle: string;
};

export const Playground: StoryFn<StoryArgs> = ({ network, nodeStyle }) => {
  const data = NETWORKS[network] ?? NETWORKS['Three Generations']!;
  const renderNode =
    NODE_RENDERERS[nodeStyle] ?? NODE_RENDERERS['Labeled Node']!;
  const measureComponent =
    NODE_MEASUREMENT_COMPONENTS[nodeStyle] ??
    NODE_MEASUREMENT_COMPONENTS['Labeled Node']!;

  const { nodeWidth, nodeHeight, portal } = useNodeMeasurement({
    component: measureComponent,
  });

  const stableNodes = useMemo(() => data.nodes, [data]);
  const stableEdges = useMemo(() => data.edges, [data]);

  return (
    <div className="flex size-full items-center justify-center overflow-auto p-8">
      {portal}
      <PedigreeLayout
        nodes={stableNodes}
        edges={stableEdges}
        nodeWidth={nodeWidth}
        nodeHeight={nodeHeight}
        renderNode={renderNode}
      />
    </div>
  );
};

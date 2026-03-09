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
        'Same-Sex Mothers',
        'Same-Sex Fathers',
        'Single Parent',
        'Three Co-Parents',
        'Blended Family',
        'Non-Binary Parent',
        'Sperm Donor',
        'Surrogacy',
        'Donor + Surrogate',
      ],
    },
    nodeStyle: {
      control: 'select',
      options: ['Colored Node', 'Labeled Node', 'Responsive', 'Dot'],
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
  'Same-Sex Mothers': buildNetwork(
    [
      { id: 'momA', label: fakeName('female'), sex: 'female' },
      { id: 'momB', label: fakeName('female'), sex: 'female' },
      { id: 'daughter', label: fakeName('female'), sex: 'female', isEgo: true },
      { id: 'son', label: fakeName('male'), sex: 'male' },
    ],
    [
      { source: 'momA', target: 'momB', relationship: 'partner' },
      { source: 'momA', target: 'daughter', relationship: 'parent' },
      { source: 'momB', target: 'daughter', relationship: 'parent' },
      { source: 'momA', target: 'son', relationship: 'parent' },
      { source: 'momB', target: 'son', relationship: 'parent' },
    ],
  ),
  'Same-Sex Fathers': buildNetwork(
    [
      { id: 'dadA', label: fakeName('male'), sex: 'male' },
      { id: 'dadB', label: fakeName('male'), sex: 'male' },
      { id: 'child', label: fakeName('female'), sex: 'female', isEgo: true },
    ],
    [
      { source: 'dadA', target: 'dadB', relationship: 'partner' },
      { source: 'dadA', target: 'child', relationship: 'parent' },
      { source: 'dadB', target: 'child', relationship: 'parent' },
    ],
  ),
  'Single Parent': buildNetwork(
    [
      { id: 'parent', label: fakeName('female'), sex: 'female' },
      { id: 'child1', label: fakeName('male'), sex: 'male', isEgo: true },
      { id: 'child2', label: fakeName('female'), sex: 'female' },
    ],
    [
      { source: 'parent', target: 'child1', relationship: 'parent' },
      { source: 'parent', target: 'child2', relationship: 'parent' },
    ],
  ),
  'Three Co-Parents': buildNetwork(
    [
      { id: 'parentA', label: fakeName('female'), sex: 'female' },
      { id: 'parentB', label: fakeName('female'), sex: 'female' },
      { id: 'parentC', label: fakeName('male'), sex: 'male' },
      { id: 'child', label: fakeName('male'), sex: 'male', isEgo: true },
    ],
    [
      { source: 'parentA', target: 'parentB', relationship: 'partner' },
      { source: 'parentA', target: 'child', relationship: 'parent' },
      { source: 'parentB', target: 'child', relationship: 'parent' },
      { source: 'parentC', target: 'child', relationship: 'parent' },
    ],
  ),
  'Blended Family': buildNetwork(
    [
      // Custodial parent and step-parent (social parents)
      { id: 'custodialMom', label: fakeName('female'), sex: 'female' },
      { id: 'stepDad', label: fakeName('male'), sex: 'male' },
      // Non-custodial bio-parent (auxiliary)
      { id: 'bioDad', label: 'Bio Father', sex: 'male' },
      // Children
      {
        id: 'child1',
        label: fakeName('female'),
        sex: 'female',
        isEgo: true,
      },
      { id: 'child2', label: fakeName('male'), sex: 'male' },
      // Step-parent's child from previous relationship
      { id: 'stepChild', label: fakeName('male'), sex: 'male' },
      { id: 'exPartner', label: fakeName('female'), sex: 'female' },
    ],
    [
      // Custodial parents (social parents to child1 and child2)
      {
        source: 'custodialMom',
        target: 'stepDad',
        relationship: 'partner',
      },
      { source: 'custodialMom', target: 'child1', relationship: 'parent' },
      { source: 'stepDad', target: 'child1', relationship: 'parent' },
      { source: 'custodialMom', target: 'child2', relationship: 'parent' },
      { source: 'stepDad', target: 'child2', relationship: 'parent' },
      // Bio-parent (auxiliary dashed connector)
      { source: 'bioDad', target: 'child1', relationship: 'bio-parent' },
      { source: 'bioDad', target: 'child2', relationship: 'bio-parent' },
      // Step-parent's previous relationship
      { source: 'stepDad', target: 'exPartner', relationship: 'partner' },
      { source: 'stepDad', target: 'stepChild', relationship: 'parent' },
      { source: 'exPartner', target: 'stepChild', relationship: 'parent' },
    ],
  ),
  'Non-Binary Parent': buildNetwork(
    [
      { id: 'nbParent', label: 'Alex' },
      { id: 'partner', label: fakeName('female'), sex: 'female' },
      { id: 'child1', label: fakeName('male'), sex: 'male', isEgo: true },
      { id: 'child2', label: fakeName('female'), sex: 'female' },
    ],
    [
      { source: 'nbParent', target: 'partner', relationship: 'partner' },
      { source: 'nbParent', target: 'child1', relationship: 'parent' },
      { source: 'partner', target: 'child1', relationship: 'parent' },
      { source: 'nbParent', target: 'child2', relationship: 'parent' },
      { source: 'partner', target: 'child2', relationship: 'parent' },
    ],
  ),
  'Sperm Donor': buildNetwork(
    [
      // Grandparents of momA
      { id: 'gfA', label: fakeName('male'), sex: 'male' },
      { id: 'gmA', label: fakeName('female'), sex: 'female' },
      // Social parents
      { id: 'momA', label: fakeName('female'), sex: 'female' },
      { id: 'momB', label: fakeName('female'), sex: 'female' },
      // Donor
      { id: 'donor', label: 'Sperm Donor', sex: 'male' },
      // Children
      { id: 'ego', label: fakeName('female'), sex: 'female', isEgo: true },
      { id: 'sibling', label: fakeName('male'), sex: 'male' },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('male'), sex: 'male' },
      { id: 'grandchild', label: fakeName('female'), sex: 'female' },
    ],
    [
      // Grandparents
      { source: 'gfA', target: 'gmA', relationship: 'partner' },
      { source: 'gfA', target: 'momA', relationship: 'parent' },
      { source: 'gmA', target: 'momA', relationship: 'parent' },
      // Social parents
      { source: 'momA', target: 'momB', relationship: 'partner' },
      { source: 'momA', target: 'ego', relationship: 'parent' },
      { source: 'momB', target: 'ego', relationship: 'parent' },
      { source: 'momA', target: 'sibling', relationship: 'parent' },
      { source: 'momB', target: 'sibling', relationship: 'parent' },
      // Donor connection
      { source: 'donor', target: 'ego', relationship: 'donor' },
      { source: 'donor', target: 'sibling', relationship: 'donor' },
      // Ego's family
      { source: 'ego', target: 'egoPartner', relationship: 'partner' },
      { source: 'ego', target: 'grandchild', relationship: 'parent' },
      { source: 'egoPartner', target: 'grandchild', relationship: 'parent' },
    ],
  ),
  'Surrogacy': buildNetwork(
    [
      // Grandparents
      { id: 'gfF', label: fakeName('male'), sex: 'male' },
      { id: 'gmF', label: fakeName('female'), sex: 'female' },
      // Social parents
      { id: 'dadA', label: fakeName('male'), sex: 'male' },
      { id: 'dadB', label: fakeName('male'), sex: 'male' },
      // Surrogate and egg donor
      { id: 'surrogate', label: 'Surrogate', sex: 'female' },
      { id: 'eggDonor', label: 'Egg Donor', sex: 'female' },
      // Children
      { id: 'ego', label: fakeName('male'), sex: 'male', isEgo: true },
      { id: 'sibling', label: fakeName('female'), sex: 'female' },
      // Uncle (dadA's brother)
      { id: 'uncle', label: fakeName('male'), sex: 'male' },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('female'), sex: 'female' },
      { id: 'grandchild', label: fakeName('male'), sex: 'male' },
    ],
    [
      // Grandparents
      { source: 'gfF', target: 'gmF', relationship: 'partner' },
      { source: 'gfF', target: 'dadA', relationship: 'parent' },
      { source: 'gmF', target: 'dadA', relationship: 'parent' },
      { source: 'gfF', target: 'uncle', relationship: 'parent' },
      { source: 'gmF', target: 'uncle', relationship: 'parent' },
      // Social parents
      { source: 'dadA', target: 'dadB', relationship: 'partner' },
      { source: 'dadA', target: 'ego', relationship: 'parent' },
      { source: 'dadB', target: 'ego', relationship: 'parent' },
      { source: 'dadA', target: 'sibling', relationship: 'parent' },
      { source: 'dadB', target: 'sibling', relationship: 'parent' },
      // Surrogate + egg donor connections
      { source: 'surrogate', target: 'ego', relationship: 'surrogate' },
      { source: 'surrogate', target: 'sibling', relationship: 'surrogate' },
      { source: 'eggDonor', target: 'ego', relationship: 'donor' },
      { source: 'eggDonor', target: 'sibling', relationship: 'donor' },
      // Ego's family
      { source: 'ego', target: 'egoPartner', relationship: 'partner' },
      { source: 'ego', target: 'grandchild', relationship: 'parent' },
      { source: 'egoPartner', target: 'grandchild', relationship: 'parent' },
    ],
  ),
  'Donor + Surrogate': buildNetwork(
    [
      // Maternal grandparents of parentA
      { id: 'mgf', label: fakeName('male'), sex: 'male' },
      { id: 'mgm', label: fakeName('female'), sex: 'female' },
      // Social parents
      { id: 'parentA', label: fakeName('female'), sex: 'female' },
      { id: 'parentB', label: fakeName('female'), sex: 'female' },
      // Donor and surrogate
      { id: 'donor', label: 'Sperm Donor', sex: 'male' },
      { id: 'surrogate', label: 'Surrogate', sex: 'female' },
      // Children
      { id: 'ego', label: fakeName('female'), sex: 'female', isEgo: true },
      { id: 'sibling', label: fakeName('male'), sex: 'male' },
      // ParentA's sister and her family
      { id: 'aunt', label: fakeName('female'), sex: 'female' },
      { id: 'auntPartner', label: fakeName('male'), sex: 'male' },
      { id: 'cousin', label: fakeName('male'), sex: 'male' },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('male'), sex: 'male' },
      { id: 'grandchild', label: fakeName('female'), sex: 'female' },
    ],
    [
      // Grandparents
      { source: 'mgf', target: 'mgm', relationship: 'partner' },
      { source: 'mgf', target: 'parentA', relationship: 'parent' },
      { source: 'mgm', target: 'parentA', relationship: 'parent' },
      { source: 'mgf', target: 'aunt', relationship: 'parent' },
      { source: 'mgm', target: 'aunt', relationship: 'parent' },
      // Social parents
      { source: 'parentA', target: 'parentB', relationship: 'partner' },
      { source: 'parentA', target: 'ego', relationship: 'parent' },
      { source: 'parentB', target: 'ego', relationship: 'parent' },
      { source: 'parentA', target: 'sibling', relationship: 'parent' },
      { source: 'parentB', target: 'sibling', relationship: 'parent' },
      // Donor + surrogate connections
      { source: 'donor', target: 'ego', relationship: 'donor' },
      { source: 'donor', target: 'sibling', relationship: 'donor' },
      { source: 'surrogate', target: 'ego', relationship: 'surrogate' },
      { source: 'surrogate', target: 'sibling', relationship: 'surrogate' },
      // Aunt's family
      { source: 'aunt', target: 'auntPartner', relationship: 'partner' },
      { source: 'aunt', target: 'cousin', relationship: 'parent' },
      { source: 'auntPartner', target: 'cousin', relationship: 'parent' },
      // Ego's family
      { source: 'ego', target: 'egoPartner', relationship: 'partner' },
      { source: 'ego', target: 'grandchild', relationship: 'parent' },
      { source: 'egoPartner', target: 'grandchild', relationship: 'parent' },
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
      <span className="invisible text-xs">placeholder</span>
      <Node size="sm" />
      <span className="text-xs text-white">placeholder</span>
    </div>
  ),
  'Responsive': (
    <div
      className="bg-node-1 rounded-full"
      style={{
        width: 'clamp(24px, 5vw, 80px)',
        height: 'clamp(24px, 5vw, 80px)',
      }}
    />
  ),
  'Dot': <div className="m-4 size-4 rounded-full bg-white" />,
};

const NODE_RENDERERS: Record<string, NodeRenderer> = {
  'Colored Node': (node) => (
    <Node
      color={node.isEgo ? 'node-color-seq-2' : 'node-color-seq-1'}
      label={node.label}
      shape={node.sex === 'female' ? 'circle' : 'square'}
      size="sm"
    />
  ),
  'Labeled Node': (node) => (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="invisible max-w-24 truncate text-xs">{node.label}</span>
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
  'Responsive': (node) => (
    <div
      className={`rounded-full ${node.isEgo ? 'bg-node-2' : 'bg-node-1'}`}
      style={{
        width: 'clamp(24px, 5vw, 80px)',
        height: 'clamp(24px, 5vw, 80px)',
      }}
      title={node.label}
    />
  ),
  'Dot': (node) => (
    <div
      className={`m-4 size-4 rounded-full ${node.isEgo ? 'bg-yellow-400' : 'bg-white'}`}
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

  const { nodeWidth, nodeHeight } = useNodeMeasurement({
    component: measureComponent,
  });

  const stableNodes = useMemo(() => data.nodes, [data]);
  const stableEdges = useMemo(() => data.edges, [data]);

  return (
    <div className="flex size-full items-center justify-center overflow-auto p-8">
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

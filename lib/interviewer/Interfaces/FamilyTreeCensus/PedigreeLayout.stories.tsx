import { faker } from '@faker-js/faker';
import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import Node from '~/components/Node';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';
import PedigreeKey from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeKey';
import PedigreeLayout from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout';
import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

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
        'Known Bio Parent',
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

type NetworkData = {
  nodes: Map<string, NodeData>;
  edges: Map<string, StoreEdge>;
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
  edgeDefs: StoreEdge[],
): NetworkData {
  const nodes = new Map<string, NodeData>();
  for (const { id, label, sex, isEgo } of nodeDefs) {
    nodes.set(id, { label, sex, isEgo: isEgo ?? false, readOnly: false });
  }

  const edges = new Map<string, StoreEdge>();
  for (let i = 0; i < edgeDefs.length; i++) {
    const e = edgeDefs[i]!;
    edges.set(`e${i}`, e);
  }

  return { nodes, edges };
}

const NETWORKS: Record<string, NetworkData> = {
  'Simple Couple': buildNetwork(
    [
      { id: 'ego', label: fakeName('male'), sex: 'male', isEgo: true },
      { id: 'partner', label: fakeName('female'), sex: 'female' },
    ],
    [{ source: 'ego', target: 'partner', type: 'partner', active: true }],
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
      { source: 'father', target: 'mother', type: 'partner', active: true },
      {
        source: 'father',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mother',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'father',
        target: 'sister',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mother',
        target: 'sister',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'father',
        target: 'brother',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mother',
        target: 'brother',
        type: 'parent',
        edgeType: 'parent',
      },
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
      { source: 'pgf', target: 'pgm', type: 'partner', active: true },
      { source: 'mgf', target: 'mgm', type: 'partner', active: true },
      {
        source: 'pgf',
        target: 'father',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'pgm',
        target: 'father',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mgf',
        target: 'mother',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mgm',
        target: 'mother',
        type: 'parent',
        edgeType: 'parent',
      },
      { source: 'father', target: 'mother', type: 'partner', active: true },
      {
        source: 'father',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mother',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'father',
        target: 'sister',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mother',
        target: 'sister',
        type: 'parent',
        edgeType: 'parent',
      },
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
      { source: 'pgf', target: 'pgm', type: 'partner', active: true },
      { source: 'mgf', target: 'mgm', type: 'partner', active: true },
      {
        source: 'pgf',
        target: 'father',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'pgm',
        target: 'father',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'pgf',
        target: 'p-uncle',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'pgm',
        target: 'p-uncle',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mgf',
        target: 'mother',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mgm',
        target: 'mother',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mgf',
        target: 'aunt',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mgm',
        target: 'aunt',
        type: 'parent',
        edgeType: 'parent',
      },
      { source: 'father', target: 'mother', type: 'partner', active: true },
      {
        source: 'uncle-spouse',
        target: 'aunt',
        type: 'partner',
        active: true,
      },
      { source: 'ego', target: 'partner', type: 'partner', active: true },
      {
        source: 'father',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mother',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'father',
        target: 'sister',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mother',
        target: 'sister',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'uncle-spouse',
        target: 'cousin1',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'aunt',
        target: 'cousin1',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'uncle-spouse',
        target: 'cousin2',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'aunt',
        target: 'cousin2',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'ego',
        target: 'son',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'partner',
        target: 'son',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'ego',
        target: 'daughter',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'partner',
        target: 'daughter',
        type: 'parent',
        edgeType: 'parent',
      },
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
      { source: 'momA', target: 'momB', type: 'partner', active: true },
      {
        source: 'momA',
        target: 'daughter',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'momB',
        target: 'daughter',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'momA',
        target: 'son',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'momB',
        target: 'son',
        type: 'parent',
        edgeType: 'parent',
      },
    ],
  ),
  'Same-Sex Fathers': buildNetwork(
    [
      { id: 'dadA', label: fakeName('male'), sex: 'male' },
      { id: 'dadB', label: fakeName('male'), sex: 'male' },
      { id: 'child', label: fakeName('female'), sex: 'female', isEgo: true },
    ],
    [
      { source: 'dadA', target: 'dadB', type: 'partner', active: true },
      {
        source: 'dadA',
        target: 'child',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'dadB',
        target: 'child',
        type: 'parent',
        edgeType: 'parent',
      },
    ],
  ),
  'Single Parent': buildNetwork(
    [
      { id: 'parent', label: fakeName('female'), sex: 'female' },
      { id: 'child1', label: fakeName('male'), sex: 'male', isEgo: true },
      { id: 'child2', label: fakeName('female'), sex: 'female' },
    ],
    [
      {
        source: 'parent',
        target: 'child1',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'parent',
        target: 'child2',
        type: 'parent',
        edgeType: 'parent',
      },
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
      { source: 'parentA', target: 'parentB', type: 'partner', active: true },
      {
        source: 'parentA',
        target: 'child',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'parentB',
        target: 'child',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'parentC',
        target: 'child',
        type: 'parent',
        edgeType: 'parent',
      },
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
        type: 'partner',
        current: true,
      },
      {
        source: 'custodialMom',
        target: 'child1',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'stepDad',
        target: 'child1',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'custodialMom',
        target: 'child2',
        type: 'parent',
        edgeType: 'social-parent',
      },
      {
        source: 'stepDad',
        target: 'child2',
        type: 'parent',
        edgeType: 'social-parent',
      },
      // Bio-parent (auxiliary dashed connector)
      {
        source: 'bioDad',
        target: 'child1',
        type: 'parent',
        edgeType: 'bio-parent',
      },
      {
        source: 'bioDad',
        target: 'child2',
        type: 'parent',
        edgeType: 'bio-parent',
      },
      // Step-parent's previous relationship
      {
        source: 'stepDad',
        target: 'exPartner',
        type: 'partner',
        active: false,
      },
      {
        source: 'stepDad',
        target: 'stepChild',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'exPartner',
        target: 'stepChild',
        type: 'parent',
        edgeType: 'parent',
      },
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
      { source: 'nbParent', target: 'partner', type: 'partner', active: true },
      {
        source: 'nbParent',
        target: 'child1',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'partner',
        target: 'child1',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'nbParent',
        target: 'child2',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'partner',
        target: 'child2',
        type: 'parent',
        edgeType: 'parent',
      },
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
      { source: 'gfA', target: 'gmA', type: 'partner', active: true },
      {
        source: 'gfA',
        target: 'momA',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'gmA',
        target: 'momA',
        type: 'parent',
        edgeType: 'parent',
      },
      // Social parents
      { source: 'momA', target: 'momB', type: 'partner', active: true },
      {
        source: 'momA',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'momB',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'momA',
        target: 'sibling',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'momB',
        target: 'sibling',
        type: 'parent',
        edgeType: 'parent',
      },
      // Donor connection
      { source: 'donor', target: 'ego', type: 'parent', edgeType: 'donor' },
      { source: 'donor', target: 'sibling', type: 'parent', edgeType: 'donor' },
      // Ego's family
      { source: 'ego', target: 'egoPartner', type: 'partner', active: true },
      {
        source: 'ego',
        target: 'grandchild',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'egoPartner',
        target: 'grandchild',
        type: 'parent',
        edgeType: 'parent',
      },
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
      { source: 'gfF', target: 'gmF', type: 'partner', active: true },
      {
        source: 'gfF',
        target: 'dadA',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'gmF',
        target: 'dadA',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'gfF',
        target: 'uncle',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'gmF',
        target: 'uncle',
        type: 'parent',
        edgeType: 'parent',
      },
      // Social parents
      { source: 'dadA', target: 'dadB', type: 'partner', active: true },
      {
        source: 'dadA',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'dadB',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'dadA',
        target: 'sibling',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'dadB',
        target: 'sibling',
        type: 'parent',
        edgeType: 'parent',
      },
      // Surrogate + egg donor connections
      {
        source: 'surrogate',
        target: 'ego',
        type: 'parent',
        edgeType: 'surrogate',
      },
      {
        source: 'surrogate',
        target: 'sibling',
        type: 'parent',
        edgeType: 'surrogate',
      },
      { source: 'eggDonor', target: 'ego', type: 'parent', edgeType: 'donor' },
      {
        source: 'eggDonor',
        target: 'sibling',
        type: 'parent',
        edgeType: 'donor',
      },
      // Ego's family
      { source: 'ego', target: 'egoPartner', type: 'partner', active: true },
      {
        source: 'ego',
        target: 'grandchild',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'egoPartner',
        target: 'grandchild',
        type: 'parent',
        edgeType: 'parent',
      },
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
      { source: 'mgf', target: 'mgm', type: 'partner', active: true },
      {
        source: 'mgf',
        target: 'parentA',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mgm',
        target: 'parentA',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mgf',
        target: 'aunt',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'mgm',
        target: 'aunt',
        type: 'parent',
        edgeType: 'parent',
      },
      // Social parents
      { source: 'parentA', target: 'parentB', type: 'partner', active: true },
      {
        source: 'parentA',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'parentB',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'parentA',
        target: 'sibling',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'parentB',
        target: 'sibling',
        type: 'parent',
        edgeType: 'parent',
      },
      // Donor + surrogate connections
      { source: 'donor', target: 'ego', type: 'parent', edgeType: 'donor' },
      { source: 'donor', target: 'sibling', type: 'parent', edgeType: 'donor' },
      {
        source: 'surrogate',
        target: 'ego',
        type: 'parent',
        edgeType: 'surrogate',
      },
      {
        source: 'surrogate',
        target: 'sibling',
        type: 'parent',
        edgeType: 'surrogate',
      },
      // Aunt's family
      { source: 'aunt', target: 'auntPartner', type: 'partner', active: true },
      {
        source: 'aunt',
        target: 'cousin',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'auntPartner',
        target: 'cousin',
        type: 'parent',
        edgeType: 'parent',
      },
      // Ego's family
      { source: 'ego', target: 'egoPartner', type: 'partner', active: true },
      {
        source: 'ego',
        target: 'grandchild',
        type: 'parent',
        edgeType: 'parent',
      },
      {
        source: 'egoPartner',
        target: 'grandchild',
        type: 'parent',
        edgeType: 'parent',
      },
    ],
  ),
  'Known Bio Parent': buildNetwork(
    [
      { id: 'mom', label: fakeName('female'), sex: 'female' },
      { id: 'stepdad', label: fakeName('male'), sex: 'male' },
      { id: 'biodad', label: fakeName('male'), sex: 'male' },
      { id: 'ego', label: fakeName('female'), sex: 'female', isEgo: true },
      { id: 'sibling', label: fakeName('male'), sex: 'male' },
    ],
    [
      { source: 'mom', target: 'stepdad', type: 'partner', active: true },
      {
        source: 'mom',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
        biological: true,
      },
      {
        source: 'stepdad',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
        biological: false,
      },
      {
        source: 'biodad',
        target: 'ego',
        type: 'parent',
        edgeType: 'parent',
        biological: true,
      },
      {
        source: 'mom',
        target: 'sibling',
        type: 'parent',
        edgeType: 'parent',
        biological: true,
      },
      {
        source: 'stepdad',
        target: 'sibling',
        type: 'parent',
        edgeType: 'parent',
        biological: false,
      },
      {
        source: 'biodad',
        target: 'sibling',
        type: 'parent',
        edgeType: 'parent',
        biological: true,
      },
    ],
  ),
};

type NodeRenderer = (node: NodeData & { id: string }) => React.ReactNode;

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
      <span className="max-w-24 truncate text-xs">{node.label}</span>
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
    <div className="flex size-full flex-col items-center justify-center gap-8 overflow-auto p-8">
      <PedigreeLayout
        nodes={stableNodes}
        edges={stableEdges}
        nodeWidth={nodeWidth}
        nodeHeight={nodeHeight}
        renderNode={renderNode}
      />
      <PedigreeKey
        color="var(--color-edge-1)"
        className="rounded-lg bg-white/10 p-4"
      />
    </div>
  );
};

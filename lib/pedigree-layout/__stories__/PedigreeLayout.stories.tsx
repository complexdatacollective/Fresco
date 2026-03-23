import { faker } from '@faker-js/faker';
import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import Node from '~/components/Node';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';
import PedigreeKey from '~/lib/pedigree-layout/components/PedigreeKey';
import PedigreeLayout from '~/lib/pedigree-layout/components/PedigreeLayout';
import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

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
        'Single Parent Donor',
        'ART 1a: Donor Sperm (Cis Couple)',
        'ART 1b: Donor Sperm (Women Couple)',
        'ART 1c: Unpartnered Woman, Same Donor',
        'ART 1d: Trans Man Pregnant',
        'ART 1e: Nonbinary Person Pregnant',
        'ART 1f: Donated Embryo',
        'ART 2: Donor Egg',
        'ART 3: Surrogate Only',
        'ART 4a: Traditional Surrogacy',
        'ART 4b: Inseminate Sister',
        'ART 5: Reciprocal IVF',
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
    shape?: 'square' | 'circle';
    isEgo?: boolean;
  }[],
  edgeDefs: StoreEdge[],
): NetworkData {
  const nodes = new Map<string, NodeData>();
  for (const { id, label, shape, isEgo } of nodeDefs) {
    nodes.set(id, { label, shape, isEgo: isEgo ?? false, readOnly: false });
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
      { id: 'ego', label: fakeName('male'), shape: 'square', isEgo: true },
      { id: 'partner', label: fakeName('female'), shape: 'circle' },
    ],
    [
      {
        source: 'ego',
        target: 'partner',
        relationshipType: 'partner',
        isActive: true,
      },
    ],
  ),
  'Nuclear Family': buildNetwork(
    [
      { id: 'father', label: fakeName('male'), shape: 'square' },
      { id: 'mother', label: fakeName('female'), shape: 'circle' },
      { id: 'ego', label: fakeName('male'), shape: 'square', isEgo: true },
      { id: 'sister', label: fakeName('female'), shape: 'circle' },
      { id: 'brother', label: fakeName('male'), shape: 'square' },
    ],
    [
      {
        source: 'father',
        target: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'father',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'father',
        target: 'sister',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'sister',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'father',
        target: 'brother',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'brother',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Three Generations': buildNetwork(
    [
      { id: 'pgf', label: fakeName('male'), shape: 'square' },
      { id: 'pgm', label: fakeName('female'), shape: 'circle' },
      { id: 'mgf', label: fakeName('male'), shape: 'square' },
      { id: 'mgm', label: fakeName('female'), shape: 'circle' },
      { id: 'father', label: fakeName('male'), shape: 'square' },
      { id: 'mother', label: fakeName('female'), shape: 'circle' },
      { id: 'ego', label: fakeName('male'), shape: 'square', isEgo: true },
      { id: 'sister', label: fakeName('female'), shape: 'circle' },
    ],
    [
      {
        source: 'pgf',
        target: 'pgm',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'mgf',
        target: 'mgm',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'pgf',
        target: 'father',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'pgm',
        target: 'father',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mgf',
        target: 'mother',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mgm',
        target: 'mother',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'father',
        target: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'father',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'father',
        target: 'sister',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'sister',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Extended Family': buildNetwork(
    [
      { id: 'pgf', label: fakeName('male'), shape: 'square' },
      { id: 'pgm', label: fakeName('female'), shape: 'circle' },
      { id: 'mgf', label: fakeName('male'), shape: 'square' },
      { id: 'mgm', label: fakeName('female'), shape: 'circle' },
      { id: 'father', label: fakeName('male'), shape: 'square' },
      { id: 'mother', label: fakeName('female'), shape: 'circle' },
      { id: 'aunt', label: fakeName('female'), shape: 'circle' },
      { id: 'uncle-spouse', label: fakeName('male'), shape: 'square' },
      { id: 'p-uncle', label: fakeName('male'), shape: 'square' },
      { id: 'ego', label: fakeName('male'), shape: 'square', isEgo: true },
      { id: 'partner', label: fakeName('female'), shape: 'circle' },
      { id: 'sister', label: fakeName('female'), shape: 'circle' },
      { id: 'cousin1', label: fakeName('male'), shape: 'square' },
      { id: 'cousin2', label: fakeName('female'), shape: 'circle' },
      { id: 'son', label: fakeName('male'), shape: 'square' },
      { id: 'daughter', label: fakeName('female'), shape: 'circle' },
    ],
    [
      {
        source: 'pgf',
        target: 'pgm',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'mgf',
        target: 'mgm',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'pgf',
        target: 'father',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'pgm',
        target: 'father',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'pgf',
        target: 'p-uncle',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'pgm',
        target: 'p-uncle',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mgf',
        target: 'mother',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mgm',
        target: 'mother',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mgf',
        target: 'aunt',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mgm',
        target: 'aunt',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'father',
        target: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'uncle-spouse',
        target: 'aunt',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'ego',
        target: 'partner',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'father',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'father',
        target: 'sister',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'sister',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'uncle-spouse',
        target: 'cousin1',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'aunt',
        target: 'cousin1',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'uncle-spouse',
        target: 'cousin2',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'aunt',
        target: 'cousin2',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'ego',
        target: 'son',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'partner',
        target: 'son',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'ego',
        target: 'daughter',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'partner',
        target: 'daughter',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Same-Sex Mothers': buildNetwork(
    [
      { id: 'momA', label: fakeName('female'), shape: 'circle' },
      { id: 'momB', label: fakeName('female'), shape: 'circle' },
      {
        id: 'daughter',
        label: fakeName('female'),
        shape: 'circle',
        isEgo: true,
      },
      { id: 'son', label: fakeName('male'), shape: 'square' },
    ],
    [
      {
        source: 'momA',
        target: 'momB',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'momA',
        target: 'daughter',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'momB',
        target: 'daughter',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'momA',
        target: 'son',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'momB',
        target: 'son',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Same-Sex Fathers': buildNetwork(
    [
      { id: 'dadA', label: fakeName('male'), shape: 'square' },
      { id: 'dadB', label: fakeName('male'), shape: 'square' },
      { id: 'child', label: fakeName('female'), shape: 'circle', isEgo: true },
    ],
    [
      {
        source: 'dadA',
        target: 'dadB',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'dadA',
        target: 'child',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'dadB',
        target: 'child',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Single Parent': buildNetwork(
    [
      { id: 'parent', label: fakeName('female'), shape: 'circle' },
      { id: 'child1', label: fakeName('male'), shape: 'square', isEgo: true },
      { id: 'child2', label: fakeName('female'), shape: 'circle' },
    ],
    [
      {
        source: 'parent',
        target: 'child1',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'parent',
        target: 'child2',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Three Co-Parents': buildNetwork(
    [
      { id: 'parentA', label: fakeName('female'), shape: 'circle' },
      { id: 'parentB', label: fakeName('female'), shape: 'circle' },
      { id: 'parentC', label: fakeName('male'), shape: 'square' },
      { id: 'child', label: fakeName('male'), shape: 'square', isEgo: true },
    ],
    [
      {
        source: 'parentA',
        target: 'parentB',
        relationshipType: 'partner',
        isActive: false,
      },
      {
        source: 'parentA',
        target: 'parentC',
        relationshipType: 'partner',
        isActive: false,
      },
      {
        source: 'parentA',
        target: 'child',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'parentB',
        target: 'child',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'parentC',
        target: 'child',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Blended Family': buildNetwork(
    [
      { id: 'parentA', label: fakeName('male'), shape: 'square' },
      { id: 'exPartner', label: fakeName('female'), shape: 'circle' },
      { id: 'newPartner', label: fakeName('female'), shape: 'circle' },
      {
        id: 'child1st',
        label: fakeName('female'),
        shape: 'circle',
        isEgo: true,
      },
      { id: 'child2nd', label: fakeName('male'), shape: 'square' },
    ],
    [
      {
        source: 'parentA',
        target: 'exPartner',
        relationshipType: 'partner',
        isActive: false,
      },
      {
        source: 'parentA',
        target: 'newPartner',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'parentA',
        target: 'child1st',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'exPartner',
        target: 'child1st',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'parentA',
        target: 'child2nd',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'newPartner',
        target: 'child2nd',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Non-Binary Parent': buildNetwork(
    [
      { id: 'nbParent', label: 'Alex' },
      { id: 'partner', label: fakeName('female'), shape: 'circle' },
      { id: 'child1', label: fakeName('male'), shape: 'square', isEgo: true },
      { id: 'child2', label: fakeName('female'), shape: 'circle' },
    ],
    [
      {
        source: 'nbParent',
        target: 'partner',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'nbParent',
        target: 'child1',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'partner',
        target: 'child1',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'nbParent',
        target: 'child2',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'partner',
        target: 'child2',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Sperm Donor': buildNetwork(
    [
      // Grandparents of momA
      { id: 'gfA', label: fakeName('male'), shape: 'square' },
      { id: 'gmA', label: fakeName('female'), shape: 'circle' },
      // Social parents
      { id: 'momA', label: fakeName('female'), shape: 'circle' },
      { id: 'momB', label: fakeName('female'), shape: 'circle' },
      // Donor
      { id: 'donor', label: 'Sperm Donor', shape: 'square' },
      // Children
      { id: 'ego', label: fakeName('female'), shape: 'circle', isEgo: true },
      { id: 'sibling', label: fakeName('male'), shape: 'square' },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('male'), shape: 'square' },
      { id: 'grandchild', label: fakeName('female'), shape: 'circle' },
    ],
    [
      // Grandparents
      {
        source: 'gfA',
        target: 'gmA',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'gfA',
        target: 'momA',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'gmA',
        target: 'momA',
        relationshipType: 'biological',
        isActive: true,
      },
      // Social parents
      {
        source: 'momA',
        target: 'momB',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'momA',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'momB',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'momA',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'momB',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
      },
      // Donor connection
      {
        source: 'donor',
        target: 'ego',
        relationshipType: 'donor',
        isActive: true,
      },
      {
        source: 'donor',
        target: 'sibling',
        relationshipType: 'donor',
        isActive: true,
      },
      // Ego's family
      {
        source: 'ego',
        target: 'egoPartner',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'ego',
        target: 'grandchild',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'egoPartner',
        target: 'grandchild',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Surrogacy': buildNetwork(
    [
      // Grandparents
      { id: 'gfF', label: fakeName('male'), shape: 'square' },
      { id: 'gmF', label: fakeName('female'), shape: 'circle' },
      // Social parents
      { id: 'dadA', label: fakeName('male'), shape: 'square' },
      { id: 'dadB', label: fakeName('male'), shape: 'square' },
      // Surrogate and egg donor
      { id: 'surrogate', label: 'Surrogate', shape: 'circle' },
      { id: 'eggDonor', label: 'Egg Donor', shape: 'circle' },
      // Children
      { id: 'ego', label: fakeName('male'), shape: 'square', isEgo: true },
      { id: 'sibling', label: fakeName('female'), shape: 'circle' },
      // Uncle (dadA's brother)
      { id: 'uncle', label: fakeName('male'), shape: 'square' },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('female'), shape: 'circle' },
      { id: 'grandchild', label: fakeName('male'), shape: 'square' },
    ],
    [
      // Grandparents
      {
        source: 'gfF',
        target: 'gmF',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'gfF',
        target: 'dadA',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'gmF',
        target: 'dadA',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'gfF',
        target: 'uncle',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'gmF',
        target: 'uncle',
        relationshipType: 'biological',
        isActive: true,
      },
      // Social parents
      {
        source: 'dadA',
        target: 'dadB',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'dadA',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'dadB',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'dadA',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'dadB',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
      },
      // Surrogate + egg donor connections
      {
        source: 'surrogate',
        target: 'ego',
        relationshipType: 'surrogate',
        isActive: true,
      },
      {
        source: 'surrogate',
        target: 'sibling',
        relationshipType: 'surrogate',
        isActive: true,
      },
      {
        source: 'eggDonor',
        target: 'ego',
        relationshipType: 'donor',
        isActive: true,
      },
      {
        source: 'eggDonor',
        target: 'sibling',
        relationshipType: 'donor',
        isActive: true,
      },
      // Ego's family
      {
        source: 'ego',
        target: 'egoPartner',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'ego',
        target: 'grandchild',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'egoPartner',
        target: 'grandchild',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Donor + Surrogate': buildNetwork(
    [
      // Maternal grandparents of parentA
      { id: 'mgf', label: fakeName('male'), shape: 'square' },
      { id: 'mgm', label: fakeName('female'), shape: 'circle' },
      // Social parents
      { id: 'parentA', label: fakeName('female'), shape: 'circle' },
      { id: 'parentB', label: fakeName('female'), shape: 'circle' },
      // Donor and surrogate
      { id: 'donor', label: 'Sperm Donor', shape: 'square' },
      { id: 'surrogate', label: 'Surrogate', shape: 'circle' },
      // Children
      { id: 'ego', label: fakeName('female'), shape: 'circle', isEgo: true },
      { id: 'sibling', label: fakeName('male'), shape: 'square' },
      // ParentA's sister and her family
      { id: 'aunt', label: fakeName('female'), shape: 'circle' },
      { id: 'auntPartner', label: fakeName('male'), shape: 'square' },
      { id: 'cousin', label: fakeName('male'), shape: 'square' },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('male'), shape: 'square' },
      { id: 'grandchild', label: fakeName('female'), shape: 'circle' },
    ],
    [
      // Grandparents
      {
        source: 'mgf',
        target: 'mgm',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'mgf',
        target: 'parentA',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mgm',
        target: 'parentA',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mgf',
        target: 'aunt',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mgm',
        target: 'aunt',
        relationshipType: 'biological',
        isActive: true,
      },
      // Social parents
      {
        source: 'parentA',
        target: 'parentB',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'parentA',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'parentB',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'parentA',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'parentB',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
      },
      // Donor + surrogate connections
      {
        source: 'donor',
        target: 'ego',
        relationshipType: 'donor',
        isActive: true,
      },
      {
        source: 'donor',
        target: 'sibling',
        relationshipType: 'donor',
        isActive: true,
      },
      {
        source: 'surrogate',
        target: 'ego',
        relationshipType: 'surrogate',
        isActive: true,
      },
      {
        source: 'surrogate',
        target: 'sibling',
        relationshipType: 'surrogate',
        isActive: true,
      },
      // Aunt's family
      {
        source: 'aunt',
        target: 'auntPartner',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'aunt',
        target: 'cousin',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'auntPartner',
        target: 'cousin',
        relationshipType: 'biological',
        isActive: true,
      },
      // Ego's family
      {
        source: 'ego',
        target: 'egoPartner',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'ego',
        target: 'grandchild',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'egoPartner',
        target: 'grandchild',
        relationshipType: 'biological',
        isActive: true,
      },
    ],
  ),
  'Single Parent Donor': buildNetwork(
    [
      { id: 'mom', label: fakeName('female'), shape: 'circle' },
      { id: 'donor', label: 'Sperm Donor', shape: 'square' },
      { id: 'ego', label: fakeName('female'), shape: 'circle', isEgo: true },
      { id: 'sibling', label: fakeName('male'), shape: 'square' },
    ],
    [
      {
        source: 'mom',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mom',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'donor',
        target: 'ego',
        relationshipType: 'donor',
        isActive: true,
      },
      {
        source: 'donor',
        target: 'sibling',
        relationshipType: 'donor',
        isActive: true,
      },
    ],
  ),
  'ART 1a: Donor Sperm (Cis Couple)': buildNetwork(
    [
      { id: 'man', label: 'Man', shape: 'square' },
      { id: 'woman', label: 'Woman', shape: 'circle' },
      { id: 'donor', label: 'Sperm Donor', shape: 'square' },
      { id: 'pregnancy', label: 'Pregnancy', shape: 'circle' },
    ],
    [
      {
        source: 'man',
        target: 'woman',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'woman',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
        isGestationalCarrier: true,
      },
      {
        source: 'man',
        target: 'pregnancy',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'donor',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
      },
    ],
  ),
  'ART 1b: Donor Sperm (Women Couple)': buildNetwork(
    [
      { id: 'woman1', label: 'Woman 1', shape: 'circle' },
      { id: 'woman2', label: 'Woman 2', shape: 'circle' },
      { id: 'donor', label: 'Sperm Donor', shape: 'square' },
      { id: 'pregnancy', label: 'Pregnancy', shape: 'circle' },
    ],
    [
      {
        source: 'woman1',
        target: 'woman2',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'woman1',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
        isGestationalCarrier: true,
      },
      {
        source: 'woman2',
        target: 'pregnancy',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'donor',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
      },
    ],
  ),
  'ART 1c: Unpartnered Woman, Same Donor': buildNetwork(
    [
      { id: 'woman', label: 'Woman', shape: 'circle' },
      { id: 'donor', label: 'Donor', shape: 'square' },
      { id: 'son', label: 'Son', shape: 'square' },
      { id: 'pregnancy', label: 'Pregnancy', shape: 'circle' },
    ],
    [
      {
        source: 'woman',
        target: 'son',
        relationshipType: 'biological',
        isActive: true,
        isGestationalCarrier: true,
      },
      {
        source: 'woman',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
        isGestationalCarrier: true,
      },
      {
        source: 'donor',
        target: 'son',
        relationshipType: 'donor',
        isActive: true,
      },
      {
        source: 'donor',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
      },
    ],
  ),
  'ART 1d: Trans Man Pregnant': buildNetwork(
    [
      { id: 'transMan', label: 'Trans Man', shape: 'square' },
      { id: 'cisWoman', label: 'Cis Woman', shape: 'circle' },
      { id: 'donor', label: 'Sperm Donor', shape: 'square' },
      { id: 'pregnancy', label: 'Pregnancy', shape: 'square' },
    ],
    [
      {
        source: 'transMan',
        target: 'cisWoman',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'transMan',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
        isGestationalCarrier: true,
      },
      {
        source: 'cisWoman',
        target: 'pregnancy',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'donor',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
      },
    ],
  ),
  'ART 1e: Nonbinary Person Pregnant': buildNetwork(
    [
      { id: 'nonbinary', label: 'Nonbinary' },
      { id: 'transWoman', label: 'Trans Woman', shape: 'circle' },
      { id: 'donor', label: 'Sperm Donor', shape: 'square' },
      { id: 'pregnancy', label: 'Pregnancy' },
    ],
    [
      {
        source: 'nonbinary',
        target: 'transWoman',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'nonbinary',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
        isGestationalCarrier: true,
      },
      {
        source: 'transWoman',
        target: 'pregnancy',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'donor',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
      },
    ],
  ),
  'ART 1f: Donated Embryo': buildNetwork(
    [
      { id: 'man', label: 'Man', shape: 'square' },
      { id: 'woman', label: 'Woman', shape: 'circle' },
      { id: 'eggDonor', label: 'Egg Donor', shape: 'circle' },
      { id: 'spermDonor', label: 'Sperm Donor', shape: 'square' },
      { id: 'pregnancy', label: 'Pregnancy', shape: 'circle' },
    ],
    [
      {
        source: 'man',
        target: 'woman',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'woman',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
        isGestationalCarrier: true,
      },
      {
        source: 'man',
        target: 'pregnancy',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'eggDonor',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
      },
      {
        source: 'spermDonor',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
      },
    ],
  ),
  'ART 2: Donor Egg': buildNetwork(
    [
      { id: 'man', label: 'Man', shape: 'square' },
      { id: 'woman', label: 'Woman', shape: 'circle' },
      { id: 'eggDonor', label: 'Egg Donor', shape: 'circle' },
      { id: 'pregnancy', label: 'Pregnancy', shape: 'circle' },
    ],
    [
      {
        source: 'man',
        target: 'woman',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'man',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'woman',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
        isGestationalCarrier: true,
      },
      {
        source: 'eggDonor',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
      },
    ],
  ),
  'ART 3: Surrogate Only': buildNetwork(
    [
      { id: 'transMan', label: 'Trans Man', shape: 'square' },
      { id: 'cisMan', label: 'Cis Man', shape: 'square' },
      { id: 'surrogate', label: 'Surrogate', shape: 'circle' },
      { id: 'pregnancy', label: 'Pregnancy', shape: 'square' },
    ],
    [
      {
        source: 'transMan',
        target: 'cisMan',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'transMan',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'cisMan',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'surrogate',
        target: 'pregnancy',
        relationshipType: 'surrogate',
        isActive: true,
      },
    ],
  ),
  'ART 4a: Traditional Surrogacy': buildNetwork(
    [
      { id: 'man', label: 'Man', shape: 'square' },
      { id: 'woman', label: 'Woman', shape: 'circle' },
      { id: 'donorCarrier', label: 'Donor/Carrier', shape: 'circle' },
      { id: 'pregnancy', label: 'Pregnancy', shape: 'circle' },
    ],
    [
      {
        source: 'man',
        target: 'woman',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'man',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'woman',
        target: 'pregnancy',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'donorCarrier',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
        isGestationalCarrier: true,
      },
    ],
  ),
  'ART 4b: Inseminate Sister': buildNetwork(
    [
      { id: 'cisMan', label: 'Cis Man', shape: 'square' },
      { id: 'transWoman', label: 'Trans Woman', shape: 'circle' },
      { id: 'sister', label: 'Sister', shape: 'circle' },
      { id: 'pregnancy', label: 'Pregnancy', shape: 'circle' },
    ],
    [
      {
        source: 'cisMan',
        target: 'transWoman',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'cisMan',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'transWoman',
        target: 'pregnancy',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'sister',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
        isGestationalCarrier: true,
      },
    ],
  ),
  'ART 5: Reciprocal IVF': buildNetwork(
    [
      { id: 'partnerA', label: 'Partner A', shape: 'circle' },
      { id: 'partnerB', label: 'Partner B', shape: 'circle' },
      { id: 'spermDonor', label: 'Sperm Donor', shape: 'square' },
      { id: 'pregnancy', label: 'Pregnancy', shape: 'circle' },
    ],
    [
      {
        source: 'partnerA',
        target: 'partnerB',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'partnerA',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
      },
      {
        source: 'partnerB',
        target: 'pregnancy',
        relationshipType: 'biological',
        isActive: true,
        isGestationalCarrier: true,
      },
      {
        source: 'spermDonor',
        target: 'pregnancy',
        relationshipType: 'donor',
        isActive: true,
      },
    ],
  ),
  'Known Bio Parent': buildNetwork(
    [
      { id: 'mom', label: fakeName('female'), shape: 'circle' },
      { id: 'stepdad', label: fakeName('male'), shape: 'square' },
      { id: 'biodad', label: fakeName('male'), shape: 'square' },
      { id: 'ego', label: fakeName('female'), shape: 'circle', isEgo: true },
      { id: 'sibling', label: fakeName('male'), shape: 'square' },
    ],
    [
      {
        source: 'mom',
        target: 'stepdad',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'mom',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'stepdad',
        target: 'ego',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'biodad',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mom',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'stepdad',
        target: 'sibling',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'biodad',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
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
      shape={node.shape ?? 'square'}
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
        shape={node.shape ?? 'square'}
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

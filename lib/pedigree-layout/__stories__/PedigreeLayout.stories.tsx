import { faker } from '@faker-js/faker';
import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import Node, { type NodeShape } from '~/components/Node';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';
import {
  type AdoptionStatus,
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

function bioSexToShape(sex: string | undefined): NodeShape {
  if (sex === 'female') return 'circle';
  if (sex === 'male') return 'square';
  return 'diamond';
}
import {
  AdoptionBrackets,
  EgoIcon,
} from '~/lib/pedigree-layout/components/PedigreeNode';
import PedigreeKey from '~/lib/pedigree-layout/components/PedigreeKey';
import PedigreeLayout from '~/lib/pedigree-layout/components/PedigreeLayout';

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
        'Single Parent Two Donors',
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
        'Adoption: Adopted In',
        'Adoption: Adopted Out',
        'Adoption: By Relative',
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

const STORY_BIO_SEX_VAR = 'biologicalSex';
const STORY_LABEL_VAR = 'label';

function buildNetwork(
  nodeDefs: {
    id: string;
    label: string;
    biologicalSex?: string;
    isEgo?: boolean;
    adoptionStatus?: AdoptionStatus;
  }[],
  edgeDefs: StoreEdge[],
): NetworkData {
  const nodes = new Map<string, NodeData>();
  for (const { id, label, biologicalSex, isEgo, adoptionStatus } of nodeDefs) {
    const attributes: Record<string, unknown> = {
      [STORY_LABEL_VAR]: label,
    };
    if (biologicalSex !== undefined) {
      attributes[STORY_BIO_SEX_VAR] = biologicalSex;
    }
    nodes.set(id, {
      attributes,
      isEgo: isEgo ?? false,
      readOnly: false,
      adoptionStatus,
    });
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
      {
        id: 'ego',
        label: fakeName('male'),
        biologicalSex: 'male',
        isEgo: true,
      },
      { id: 'partner', label: fakeName('female'), biologicalSex: 'female' },
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
      { id: 'father', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'mother', label: fakeName('female'), biologicalSex: 'female' },
      {
        id: 'ego',
        label: fakeName('male'),
        biologicalSex: 'male',
        isEgo: true,
      },
      { id: 'sister', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'brother', label: fakeName('male'), biologicalSex: 'male' },
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
      { id: 'pgf', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'pgm', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'mgf', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'mgm', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'father', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'mother', label: fakeName('female'), biologicalSex: 'female' },
      {
        id: 'ego',
        label: fakeName('male'),
        biologicalSex: 'male',
        isEgo: true,
      },
      { id: 'sister', label: fakeName('female'), biologicalSex: 'female' },
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
      { id: 'pgf', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'pgm', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'mgf', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'mgm', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'father', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'mother', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'aunt', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'uncle-spouse', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'p-uncle', label: fakeName('male'), biologicalSex: 'male' },
      {
        id: 'ego',
        label: fakeName('male'),
        biologicalSex: 'male',
        isEgo: true,
      },
      { id: 'partner', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'sister', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'cousin1', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'cousin2', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'son', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'daughter', label: fakeName('female'), biologicalSex: 'female' },
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
      { id: 'momA', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'momB', label: fakeName('female'), biologicalSex: 'female' },
      {
        id: 'daughter',
        label: fakeName('female'),
        biologicalSex: 'female',
        isEgo: true,
      },
      { id: 'son', label: fakeName('male'), biologicalSex: 'male' },
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
      { id: 'dadA', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'dadB', label: fakeName('male'), biologicalSex: 'male' },
      {
        id: 'child',
        label: fakeName('female'),
        biologicalSex: 'female',
        isEgo: true,
      },
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
      { id: 'parent', label: fakeName('female'), biologicalSex: 'female' },
      {
        id: 'child1',
        label: fakeName('male'),
        biologicalSex: 'male',
        isEgo: true,
      },
      { id: 'child2', label: fakeName('female'), biologicalSex: 'female' },
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
      { id: 'parentA', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'parentB', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'parentC', label: fakeName('male'), biologicalSex: 'male' },
      {
        id: 'child',
        label: fakeName('male'),
        biologicalSex: 'male',
        isEgo: true,
      },
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
      { id: 'parentA', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'exPartner', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'newPartner', label: fakeName('female'), biologicalSex: 'female' },
      {
        id: 'child1st',
        label: fakeName('female'),
        biologicalSex: 'female',
        isEgo: true,
      },
      { id: 'child2nd', label: fakeName('male'), biologicalSex: 'male' },
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
      { id: 'nbParent', label: 'Alex', biologicalSex: 'intersex' },
      { id: 'partner', label: fakeName('female'), biologicalSex: 'female' },
      {
        id: 'child1',
        label: fakeName('male'),
        biologicalSex: 'male',
        isEgo: true,
      },
      { id: 'child2', label: fakeName('female'), biologicalSex: 'female' },
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
      { id: 'gfA', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'gmA', label: fakeName('female'), biologicalSex: 'female' },
      // Social parents
      { id: 'momA', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'momB', label: fakeName('female'), biologicalSex: 'female' },
      // Donor
      { id: 'donor', label: 'Sperm Donor', biologicalSex: 'male' },
      // Children
      {
        id: 'ego',
        label: fakeName('female'),
        biologicalSex: 'female',
        isEgo: true,
      },
      { id: 'sibling', label: fakeName('male'), biologicalSex: 'male' },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'grandchild', label: fakeName('female'), biologicalSex: 'female' },
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
      { id: 'gfF', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'gmF', label: fakeName('female'), biologicalSex: 'female' },
      // Social parents
      { id: 'dadA', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'dadB', label: fakeName('male'), biologicalSex: 'male' },
      // Surrogate and egg donor
      { id: 'surrogate', label: 'Surrogate', biologicalSex: 'female' },
      { id: 'eggDonor', label: 'Egg Donor', biologicalSex: 'female' },
      // Children
      {
        id: 'ego',
        label: fakeName('male'),
        biologicalSex: 'male',
        isEgo: true,
      },
      { id: 'sibling', label: fakeName('female'), biologicalSex: 'female' },
      // Uncle (dadA's brother)
      { id: 'uncle', label: fakeName('male'), biologicalSex: 'male' },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'grandchild', label: fakeName('male'), biologicalSex: 'male' },
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
      { id: 'mgf', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'mgm', label: fakeName('female'), biologicalSex: 'female' },
      // Social parents
      { id: 'parentA', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'parentB', label: fakeName('female'), biologicalSex: 'female' },
      // Donor and surrogate
      { id: 'donor', label: 'Sperm Donor', biologicalSex: 'male' },
      { id: 'surrogate', label: 'Surrogate', biologicalSex: 'female' },
      // Children
      {
        id: 'ego',
        label: fakeName('female'),
        biologicalSex: 'female',
        isEgo: true,
      },
      { id: 'sibling', label: fakeName('male'), biologicalSex: 'male' },
      // ParentA's sister and her family
      { id: 'aunt', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'auntPartner', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'cousin', label: fakeName('male'), biologicalSex: 'male' },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'grandchild', label: fakeName('female'), biologicalSex: 'female' },
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
      { id: 'mom', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'donor', label: 'Sperm Donor', biologicalSex: 'male' },
      {
        id: 'ego',
        label: fakeName('female'),
        biologicalSex: 'female',
        isEgo: true,
      },
      { id: 'sibling', label: fakeName('male'), biologicalSex: 'male' },
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
  'Single Parent Two Donors': buildNetwork(
    [
      { id: 'mom', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'donor1', label: 'Sperm Donor 1', biologicalSex: 'male' },
      { id: 'donor2', label: 'Sperm Donor 2', biologicalSex: 'male' },
      {
        id: 'ego',
        label: fakeName('female'),
        biologicalSex: 'female',
        isEgo: true,
      },
      { id: 'sibling', label: fakeName('male'), biologicalSex: 'male' },
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
        source: 'donor1',
        target: 'ego',
        relationshipType: 'donor',
        isActive: true,
      },
      {
        source: 'donor2',
        target: 'sibling',
        relationshipType: 'donor',
        isActive: true,
      },
    ],
  ),
  'ART 1a: Donor Sperm (Cis Couple)': buildNetwork(
    [
      { id: 'man', label: 'Man', biologicalSex: 'male' },
      { id: 'woman', label: 'Woman', biologicalSex: 'female' },
      { id: 'donor', label: 'Sperm Donor', biologicalSex: 'male' },
      { id: 'pregnancy', label: 'Pregnancy', biologicalSex: 'female' },
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
      { id: 'woman1', label: 'Woman 1', biologicalSex: 'female' },
      { id: 'woman2', label: 'Woman 2', biologicalSex: 'female' },
      { id: 'donor', label: 'Sperm Donor', biologicalSex: 'male' },
      { id: 'pregnancy', label: 'Pregnancy', biologicalSex: 'female' },
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
      { id: 'woman', label: 'Woman', biologicalSex: 'female' },
      { id: 'donor', label: 'Donor', biologicalSex: 'male' },
      { id: 'son', label: 'Son', biologicalSex: 'male' },
      { id: 'pregnancy', label: 'Pregnancy', biologicalSex: 'female' },
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
      { id: 'transMan', label: 'Trans Man', biologicalSex: 'male' },
      { id: 'cisWoman', label: 'Cis Woman', biologicalSex: 'female' },
      { id: 'donor', label: 'Sperm Donor', biologicalSex: 'male' },
      { id: 'pregnancy', label: 'Pregnancy', biologicalSex: 'male' },
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
      { id: 'nonbinary', label: 'Nonbinary', biologicalSex: 'intersex' },
      { id: 'transWoman', label: 'Trans Woman', biologicalSex: 'female' },
      { id: 'donor', label: 'Sperm Donor', biologicalSex: 'male' },
      { id: 'pregnancy', label: 'Pregnancy', biologicalSex: 'intersex' },
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
      { id: 'man', label: 'Man', biologicalSex: 'male' },
      { id: 'woman', label: 'Woman', biologicalSex: 'female' },
      { id: 'eggDonor', label: 'Egg Donor', biologicalSex: 'female' },
      { id: 'spermDonor', label: 'Sperm Donor', biologicalSex: 'male' },
      { id: 'pregnancy', label: 'Pregnancy', biologicalSex: 'female' },
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
      { id: 'man', label: 'Man', biologicalSex: 'male' },
      { id: 'woman', label: 'Woman', biologicalSex: 'female' },
      { id: 'eggDonor', label: 'Egg Donor', biologicalSex: 'female' },
      { id: 'pregnancy', label: 'Pregnancy', biologicalSex: 'female' },
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
      { id: 'transMan', label: 'Trans Man', biologicalSex: 'male' },
      { id: 'cisMan', label: 'Cis Man', biologicalSex: 'male' },
      { id: 'surrogate', label: 'Surrogate', biologicalSex: 'female' },
      { id: 'pregnancy', label: 'Pregnancy', biologicalSex: 'male' },
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
      { id: 'man', label: 'Man', biologicalSex: 'male' },
      { id: 'woman', label: 'Woman', biologicalSex: 'female' },
      { id: 'donorCarrier', label: 'Donor/Carrier', biologicalSex: 'female' },
      { id: 'pregnancy', label: 'Pregnancy', biologicalSex: 'female' },
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
      { id: 'father', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'mother', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'cisMan', label: 'Cis Man', biologicalSex: 'male' },
      { id: 'transWoman', label: 'Trans Woman', biologicalSex: 'female' },
      { id: 'sister', label: 'Sister', biologicalSex: 'female' },
      { id: 'pregnancy', label: 'Pregnancy', biologicalSex: 'female' },
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
        target: 'transWoman',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'transWoman',
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
      { id: 'partnerA', label: 'Partner A', biologicalSex: 'female' },
      { id: 'partnerB', label: 'Partner B', biologicalSex: 'female' },
      { id: 'spermDonor', label: 'Sperm Donor', biologicalSex: 'male' },
      { id: 'pregnancy', label: 'Pregnancy', biologicalSex: 'female' },
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
      { id: 'biodad', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'mom', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'stepdad', label: fakeName('male'), biologicalSex: 'male' },
      {
        id: 'ego',
        label: fakeName('female'),
        biologicalSex: 'female',
        isEgo: true,
      },
      { id: 'sibling', label: fakeName('male'), biologicalSex: 'male' },
    ],
    [
      {
        source: 'biodad',
        target: 'mom',
        relationshipType: 'partner',
        isActive: false,
      },
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
        source: 'biodad',
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
        source: 'mom',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'biodad',
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
    ],
  ),
  'Adoption: Adopted In': buildNetwork(
    [
      { id: 'bioDad', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'bioMom', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'adoptDad', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'adoptMom', label: fakeName('female'), biologicalSex: 'female' },
      {
        id: 'child',
        label: fakeName('female'),
        biologicalSex: 'female',
        isEgo: true,
        adoptionStatus: 'in',
      },
    ],
    [
      {
        source: 'bioDad',
        target: 'bioMom',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'adoptDad',
        target: 'adoptMom',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'bioDad',
        target: 'child',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'bioMom',
        target: 'child',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'adoptDad',
        target: 'child',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'adoptMom',
        target: 'child',
        relationshipType: 'social',
        isActive: true,
      },
    ],
  ),
  'Adoption: Adopted Out': buildNetwork(
    [
      { id: 'bioFather', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'bioMother', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'sibling', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'adoptFather', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'adoptMother', label: fakeName('female'), biologicalSex: 'female' },
      {
        id: 'ego',
        label: fakeName('male'),
        biologicalSex: 'male',
        isEgo: true,
        adoptionStatus: 'out',
      },
    ],
    [
      {
        source: 'bioFather',
        target: 'bioMother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'adoptFather',
        target: 'adoptMother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'bioFather',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'bioMother',
        target: 'sibling',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'bioFather',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'bioMother',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'adoptFather',
        target: 'ego',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'adoptMother',
        target: 'ego',
        relationshipType: 'social',
        isActive: true,
      },
    ],
  ),
  'Adoption: By Relative': buildNetwork(
    [
      { id: 'grandpa', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'grandma', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'father', label: fakeName('male'), biologicalSex: 'male' },
      { id: 'aunt', label: fakeName('female'), biologicalSex: 'female' },
      { id: 'uncle', label: fakeName('male'), biologicalSex: 'male' },
      {
        id: 'child',
        label: fakeName('female'),
        biologicalSex: 'female',
        isEgo: true,
        adoptionStatus: 'by-relative',
      },
    ],
    [
      {
        source: 'grandpa',
        target: 'grandma',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'grandpa',
        target: 'father',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'grandma',
        target: 'father',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'grandpa',
        target: 'aunt',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'grandma',
        target: 'aunt',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'uncle',
        target: 'aunt',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'father',
        target: 'child',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'aunt',
        target: 'child',
        relationshipType: 'social',
        isActive: true,
      },
      {
        source: 'uncle',
        target: 'child',
        relationshipType: 'social',
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
  'Colored Node': (node) => {
    const label = node.attributes[STORY_LABEL_VAR] as string | undefined;
    const biologicalSex = node.attributes[STORY_BIO_SEX_VAR] as
      | string
      | undefined;
    const nodeEl = (
      <Node
        color="node-color-seq-1"
        label={!node.isEgo ? (label ?? '') : ''}
        shape={bioSexToShape(biologicalSex)}
        size="sm"
      >
        {node.isEgo && (
          <EgoIcon
            className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-1/2"
            variant="platinum"
          />
        )}
      </Node>
    );
    if (node.adoptionStatus) {
      return (
        <AdoptionBrackets status={node.adoptionStatus}>
          {nodeEl}
        </AdoptionBrackets>
      );
    }
    return nodeEl;
  },
  'Labeled Node': (node) => {
    const label = node.attributes[STORY_LABEL_VAR] as string | undefined;
    const biologicalSex = node.attributes[STORY_BIO_SEX_VAR] as
      | string
      | undefined;
    const nodeEl = (
      <Node
        className="shrink-0"
        color="node-color-seq-1"
        label={!node.isEgo ? (label ?? '') : ''}
        shape={bioSexToShape(biologicalSex)}
        size="sm"
      >
        {node.isEgo && (
          <EgoIcon
            className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-1/2"
            variant="platinum"
          />
        )}
      </Node>
    );
    const wrappedNode = node.adoptionStatus ? (
      <AdoptionBrackets status={node.adoptionStatus}>{nodeEl}</AdoptionBrackets>
    ) : (
      nodeEl
    );
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="invisible max-w-24 truncate text-xs">{label}</span>
        {wrappedNode}
        <span className="max-w-24 truncate text-xs">{label}</span>
      </div>
    );
  },
  'Responsive': (node) => (
    <div
      className={`rounded-full ${node.isEgo ? 'bg-node-2' : 'bg-node-1'}`}
      style={{
        width: 'clamp(24px, 5vw, 80px)',
        height: 'clamp(24px, 5vw, 80px)',
      }}
      title={node.attributes[STORY_LABEL_VAR] as string | undefined}
    />
  ),
  'Dot': (node) => (
    <div
      className={`m-4 size-4 rounded-full ${node.isEgo ? 'bg-mustard' : 'bg-white'}`}
      title={node.attributes[STORY_LABEL_VAR] as string | undefined}
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
    <div className="flex size-full flex-col items-start gap-8 overflow-auto p-8">
      <div className="mx-auto">
        <PedigreeLayout
          nodes={stableNodes}
          edges={stableEdges}
          biologicalSexVariable={STORY_BIO_SEX_VAR}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
          renderNode={renderNode}
        />
      </div>
      <PedigreeKey
        color="var(--color-edge-1)"
        className="mx-auto rounded-lg bg-white/10 p-4"
      />
    </div>
  );
};

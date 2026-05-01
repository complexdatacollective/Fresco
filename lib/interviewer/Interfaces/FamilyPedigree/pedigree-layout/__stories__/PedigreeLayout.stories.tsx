import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { faker } from '@faker-js/faker';
import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import Node from '@codaco/fresco-ui/Node';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

import PedigreeKey from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/components/PedigreeKey';
import PedigreeLayout from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/components/PedigreeLayout';
import {
    AdoptionBrackets,
    EgoIcon,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/components/PedigreeNode';

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
  nodes: Map<string, NcNode>;
  edges: Map<string, NcEdge>;
};

type EdgeDef = {
  source: string;
  target: string;
  relationshipType: string;
  isActive: boolean;
  isGestationalCarrier?: boolean;
};

function fakeName(sex?: 'male' | 'female') {
  return faker.person.fullName({ sex });
}

const STORY_LABEL_VAR = 'label';
const STORY_EGO_VAR = 'isEgo';
const STORY_REL_TYPE_VAR = 'relationshipType';
const STORY_IS_ACTIVE_VAR = 'isActive';
const STORY_IS_GC_VAR = 'isGestationalCarrier';

const storyVariableConfig: VariableConfig = {
  nodeType: 'person',
  edgeType: 'relationship',
  nodeLabelVariable: STORY_LABEL_VAR,
  egoVariable: STORY_EGO_VAR,
  relationshipTypeVariable: STORY_REL_TYPE_VAR,
  isActiveVariable: STORY_IS_ACTIVE_VAR,
  isGestationalCarrierVariable: STORY_IS_GC_VAR,
};

function buildNetwork(
  nodeDefs: {
    id: string;
    label: string;
    isEgo?: boolean;
  }[],
  edgeDefs: EdgeDef[],
): NetworkData {
  const nodes = new Map<string, NcNode>();
  for (const { id, label, isEgo } of nodeDefs) {
    nodes.set(id, {
      _uid: id,
      type: 'person',
      attributes: {
        [STORY_LABEL_VAR]: label,
        [STORY_EGO_VAR]: isEgo ?? false,
      },
    });
  }

  const edges = new Map<string, NcEdge>();
  for (let i = 0; i < edgeDefs.length; i++) {
    const e = edgeDefs[i]!;
    const eid = `e${i}`;
    const attrs: NcEdge['attributes'] = {
      [STORY_REL_TYPE_VAR]: e.relationshipType,
      [STORY_IS_ACTIVE_VAR]: e.isActive,
    };
    if (e.isGestationalCarrier !== undefined) {
      attrs[STORY_IS_GC_VAR] = e.isGestationalCarrier;
    }
    edges.set(eid, {
      _uid: eid,
      type: 'relationship',
      from: e.source,
      to: e.target,
      attributes: attrs,
    });
  }

  return { nodes, edges };
}

const NETWORKS: Record<string, NetworkData> = {
  'Simple Couple': buildNetwork(
    [
      {
        id: 'ego',
        label: fakeName('male'),

        isEgo: true,
      },
      { id: 'partner', label: fakeName('female') },
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
      { id: 'father', label: fakeName('male') },
      { id: 'mother', label: fakeName('female') },
      {
        id: 'ego',
        label: fakeName('male'),

        isEgo: true,
      },
      { id: 'sister', label: fakeName('female') },
      { id: 'brother', label: fakeName('male') },
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
      { id: 'pgf', label: fakeName('male') },
      { id: 'pgm', label: fakeName('female') },
      { id: 'mgf', label: fakeName('male') },
      { id: 'mgm', label: fakeName('female') },
      { id: 'father', label: fakeName('male') },
      { id: 'mother', label: fakeName('female') },
      {
        id: 'ego',
        label: fakeName('male'),

        isEgo: true,
      },
      { id: 'sister', label: fakeName('female') },
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
      { id: 'pgf', label: fakeName('male') },
      { id: 'pgm', label: fakeName('female') },
      { id: 'mgf', label: fakeName('male') },
      { id: 'mgm', label: fakeName('female') },
      { id: 'father', label: fakeName('male') },
      { id: 'mother', label: fakeName('female') },
      { id: 'aunt', label: fakeName('female') },
      { id: 'uncle-spouse', label: fakeName('male') },
      { id: 'p-uncle', label: fakeName('male') },
      {
        id: 'ego',
        label: fakeName('male'),

        isEgo: true,
      },
      { id: 'partner', label: fakeName('female') },
      { id: 'sister', label: fakeName('female') },
      { id: 'cousin1', label: fakeName('male') },
      { id: 'cousin2', label: fakeName('female') },
      { id: 'son', label: fakeName('male') },
      { id: 'daughter', label: fakeName('female') },
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
      { id: 'momA', label: fakeName('female') },
      { id: 'momB', label: fakeName('female') },
      {
        id: 'daughter',
        label: fakeName('female'),

        isEgo: true,
      },
      { id: 'son', label: fakeName('male') },
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
      { id: 'dadA', label: fakeName('male') },
      { id: 'dadB', label: fakeName('male') },
      {
        id: 'child',
        label: fakeName('female'),

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
      { id: 'parent', label: fakeName('female') },
      {
        id: 'child1',
        label: fakeName('male'),

        isEgo: true,
      },
      { id: 'child2', label: fakeName('female') },
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
      { id: 'parentA', label: fakeName('female') },
      { id: 'parentB', label: fakeName('female') },
      { id: 'parentC', label: fakeName('male') },
      {
        id: 'child',
        label: fakeName('male'),

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
      { id: 'parentA', label: fakeName('male') },
      { id: 'exPartner', label: fakeName('female') },
      { id: 'newPartner', label: fakeName('female') },
      {
        id: 'child1st',
        label: fakeName('female'),

        isEgo: true,
      },
      { id: 'child2nd', label: fakeName('male') },
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
      { id: 'partner', label: fakeName('female') },
      {
        id: 'child1',
        label: fakeName('male'),

        isEgo: true,
      },
      { id: 'child2', label: fakeName('female') },
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
      { id: 'gfA', label: fakeName('male') },
      { id: 'gmA', label: fakeName('female') },
      // Social parents
      { id: 'momA', label: fakeName('female') },
      { id: 'momB', label: fakeName('female') },
      // Donor
      { id: 'donor', label: 'Sperm Donor' },
      // Children
      {
        id: 'ego',
        label: fakeName('female'),

        isEgo: true,
      },
      { id: 'sibling', label: fakeName('male') },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('male') },
      { id: 'grandchild', label: fakeName('female') },
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
      { id: 'gfF', label: fakeName('male') },
      { id: 'gmF', label: fakeName('female') },
      // Social parents
      { id: 'dadA', label: fakeName('male') },
      { id: 'dadB', label: fakeName('male') },
      // Surrogate and egg donor
      { id: 'surrogate', label: 'Surrogate' },
      { id: 'eggDonor', label: 'Egg Donor' },
      // Children
      {
        id: 'ego',
        label: fakeName('male'),

        isEgo: true,
      },
      { id: 'sibling', label: fakeName('female') },
      // Uncle (dadA's brother)
      { id: 'uncle', label: fakeName('male') },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('female') },
      { id: 'grandchild', label: fakeName('male') },
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
      { id: 'mgf', label: fakeName('male') },
      { id: 'mgm', label: fakeName('female') },
      // Social parents
      { id: 'parentA', label: fakeName('female') },
      { id: 'parentB', label: fakeName('female') },
      // Donor and surrogate
      { id: 'donor', label: 'Sperm Donor' },
      { id: 'surrogate', label: 'Surrogate' },
      // Children
      {
        id: 'ego',
        label: fakeName('female'),

        isEgo: true,
      },
      { id: 'sibling', label: fakeName('male') },
      // ParentA's sister and her family
      { id: 'aunt', label: fakeName('female') },
      { id: 'auntPartner', label: fakeName('male') },
      { id: 'cousin', label: fakeName('male') },
      // Ego's partner and child
      { id: 'egoPartner', label: fakeName('male') },
      { id: 'grandchild', label: fakeName('female') },
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
      { id: 'mom', label: fakeName('female') },
      { id: 'donor', label: 'Sperm Donor' },
      {
        id: 'ego',
        label: fakeName('female'),

        isEgo: true,
      },
      { id: 'sibling', label: fakeName('male') },
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
      { id: 'mom', label: fakeName('female') },
      { id: 'donor1', label: 'Sperm Donor 1' },
      { id: 'donor2', label: 'Sperm Donor 2' },
      {
        id: 'ego',
        label: fakeName('female'),

        isEgo: true,
      },
      { id: 'sibling', label: fakeName('male') },
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
      { id: 'man', label: 'Man' },
      { id: 'woman', label: 'Woman' },
      { id: 'donor', label: 'Sperm Donor' },
      { id: 'pregnancy', label: 'Pregnancy' },
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
      { id: 'woman1', label: 'Woman 1' },
      { id: 'woman2', label: 'Woman 2' },
      { id: 'donor', label: 'Sperm Donor' },
      { id: 'pregnancy', label: 'Pregnancy' },
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
      { id: 'woman', label: 'Woman' },
      { id: 'donor', label: 'Donor' },
      { id: 'son', label: 'Son' },
      { id: 'pregnancy', label: 'Pregnancy' },
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
      { id: 'transMan', label: 'Trans Man' },
      { id: 'cisWoman', label: 'Cis Woman' },
      { id: 'donor', label: 'Sperm Donor' },
      { id: 'pregnancy', label: 'Pregnancy' },
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
      { id: 'transWoman', label: 'Trans Woman' },
      { id: 'donor', label: 'Sperm Donor' },
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
      { id: 'man', label: 'Man' },
      { id: 'woman', label: 'Woman' },
      { id: 'eggDonor', label: 'Egg Donor' },
      { id: 'spermDonor', label: 'Sperm Donor' },
      { id: 'pregnancy', label: 'Pregnancy' },
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
      { id: 'man', label: 'Man' },
      { id: 'woman', label: 'Woman' },
      { id: 'eggDonor', label: 'Egg Donor' },
      { id: 'pregnancy', label: 'Pregnancy' },
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
      { id: 'transMan', label: 'Trans Man' },
      { id: 'cisMan', label: 'Cis Man' },
      { id: 'surrogate', label: 'Surrogate' },
      { id: 'pregnancy', label: 'Pregnancy' },
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
      { id: 'man', label: 'Man' },
      { id: 'woman', label: 'Woman' },
      { id: 'donorCarrier', label: 'Donor/Carrier' },
      { id: 'pregnancy', label: 'Pregnancy' },
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
      { id: 'father', label: fakeName('male') },
      { id: 'mother', label: fakeName('female') },
      { id: 'cisMan', label: 'Cis Man' },
      { id: 'transWoman', label: 'Trans Woman' },
      { id: 'sister', label: 'Sister' },
      { id: 'pregnancy', label: 'Pregnancy' },
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
      { id: 'partnerA', label: 'Partner A' },
      { id: 'partnerB', label: 'Partner B' },
      { id: 'spermDonor', label: 'Sperm Donor' },
      { id: 'pregnancy', label: 'Pregnancy' },
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
      { id: 'biodad', label: fakeName('male') },
      { id: 'mom', label: fakeName('female') },
      { id: 'stepdad', label: fakeName('male') },
      {
        id: 'ego',
        label: fakeName('female'),

        isEgo: true,
      },
      { id: 'sibling', label: fakeName('male') },
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
      { id: 'bioDad', label: fakeName('male') },
      { id: 'bioMom', label: fakeName('female') },
      { id: 'adoptDad', label: fakeName('male') },
      { id: 'adoptMom', label: fakeName('female') },
      {
        id: 'child',
        label: fakeName('female'),

        isEgo: true,
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
        relationshipType: 'adoptive',
        isActive: true,
      },
      {
        source: 'adoptMom',
        target: 'child',
        relationshipType: 'adoptive',
        isActive: true,
      },
    ],
  ),
  'Adoption: Adopted Out': buildNetwork(
    [
      { id: 'bioFather', label: fakeName('male') },
      { id: 'bioMother', label: fakeName('female') },
      { id: 'sibling', label: fakeName('female') },
      { id: 'adoptFather', label: fakeName('male') },
      { id: 'adoptMother', label: fakeName('female') },
      {
        id: 'ego',
        label: fakeName('male'),

        isEgo: true,
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
        relationshipType: 'adoptive',
        isActive: true,
      },
      {
        source: 'adoptMother',
        target: 'ego',
        relationshipType: 'adoptive',
        isActive: true,
      },
    ],
  ),
  'Adoption: By Relative': buildNetwork(
    [
      { id: 'grandpa', label: fakeName('male') },
      { id: 'grandma', label: fakeName('female') },
      { id: 'father', label: fakeName('male') },
      { id: 'aunt', label: fakeName('female') },
      { id: 'uncle', label: fakeName('male') },
      {
        id: 'child',
        label: fakeName('female'),

        isEgo: true,
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
        relationshipType: 'adoptive',
        isActive: true,
      },
      {
        source: 'uncle',
        target: 'child',
        relationshipType: 'adoptive',
        isActive: true,
      },
    ],
  ),
};

type NodeRenderer = (
  node: NcNode & { id: string },
  edges: Map<string, NcEdge>,
) => React.ReactNode;

function isNodeAdopted(nodeId: string, edges: Map<string, NcEdge>): boolean {
  return [...edges.values()].some(
    (e) => e.to === nodeId && e.attributes[STORY_REL_TYPE_VAR] === 'adoptive',
  );
}

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
  'Colored Node': (node, edges) => {
    const label = node.attributes[STORY_LABEL_VAR] as string | undefined;
    const nodeEl = (
      <Node
        color="node-color-seq-1"
        label={!node.attributes[STORY_EGO_VAR] === true ? (label ?? '') : ''}
        size="sm"
      >
        {node.attributes[STORY_EGO_VAR] === true && (
          <EgoIcon
            className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-1/2"
            variant="platinum"
          />
        )}
      </Node>
    );
    if (isNodeAdopted(node.id, edges)) {
      return <AdoptionBrackets>{nodeEl}</AdoptionBrackets>;
    }
    return nodeEl;
  },
  'Labeled Node': (node, edges) => {
    const label = node.attributes[STORY_LABEL_VAR] as string | undefined;
    const nodeEl = (
      <Node
        className="shrink-0"
        color="node-color-seq-1"
        label={!node.attributes[STORY_EGO_VAR] === true ? (label ?? '') : ''}
        size="sm"
      >
        {node.attributes[STORY_EGO_VAR] === true && (
          <EgoIcon
            className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-1/2"
            variant="platinum"
          />
        )}
      </Node>
    );
    const wrappedNode = isNodeAdopted(node.id, edges) ? (
      <AdoptionBrackets>{nodeEl}</AdoptionBrackets>
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
  'Responsive': (node, _edges) => (
    <div
      className={`rounded-full ${node.attributes[STORY_EGO_VAR] === true ? 'bg-node-2' : 'bg-node-1'}`}
      style={{
        width: 'clamp(24px, 5vw, 80px)',
        height: 'clamp(24px, 5vw, 80px)',
      }}
      title={node.attributes[STORY_LABEL_VAR] as string | undefined}
    />
  ),
  'Dot': (node, _edges) => (
    <div
      className={`m-4 size-4 rounded-full ${node.attributes[STORY_EGO_VAR] === true ? 'bg-mustard' : 'bg-white'}`}
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

  const { nodeWidth, nodeHeight, measurementContainer } = useNodeMeasurement({
    component: measureComponent,
  });

  const stableNodes = useMemo(() => data.nodes, [data]);
  const stableEdges = useMemo(() => data.edges, [data]);

  return (
    <div className="flex size-full flex-col items-start gap-8 overflow-auto p-8">
      {measurementContainer}
      <div className="mx-auto">
        <PedigreeLayout
          nodes={stableNodes}
          edges={stableEdges}
          variableConfig={storyVariableConfig}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
          renderNode={(node) => renderNode(node, stableEdges)}
        />
      </div>
      <PedigreeKey
        color="var(--color-edge-1)"
        className="mx-auto rounded-lg bg-white/10 p-4"
      />
    </div>
  );
};

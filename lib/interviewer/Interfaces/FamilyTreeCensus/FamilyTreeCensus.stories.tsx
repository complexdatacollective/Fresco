'use client';

import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcNode,
} from '@codaco/shared-consts';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';

const informationStageBefore = {
  id: 'info-before',
  type: 'Information' as const,
  label: 'Welcome',
  title: 'Welcome',
  items: [
    { id: 'item-1', type: 'text' as const, content: 'Before the main stage.' },
  ],
};

const informationStageAfter = {
  id: 'info-after',
  type: 'Information' as const,
  label: 'Complete',
  title: 'Complete',
  items: [
    { id: 'item-2', type: 'text' as const, content: 'After the main stage.' },
  ],
};

const mockProtocol = {
  id: 'test-protocol',
  codebook: {
    node: {
      person: {
        name: 'Person',
        color: 'node-color-seq-1',
        displayVariable: 'name',
        variables: {
          name: {
            name: 'Name',
            type: 'text',
          },
          sex: {
            name: 'Sex',
            type: 'categorical',
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
            ],
          },
          age: {
            name: 'Age',
            type: 'number',
          },
          hasDisease: {
            name: 'Has Disease',
            type: 'boolean',
          },
        },
      },
    },
    edge: {
      family: {
        name: 'Family',
        color: 'edge-color-seq-1',
        variables: {
          relationship: {
            name: 'Relationship',
            type: 'categorical',
            options: [
              { label: 'Parent', value: 'parent' },
              { label: 'Child', value: 'child' },
              { label: 'Sibling', value: 'sibling' },
              { label: 'Partner', value: 'partner' },
            ],
          },
        },
      },
    },
    ego: {
      variables: {
        sex: {
          name: 'Sex',
          type: 'categorical',
          options: [
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
          ],
        },
      },
    },
  },
  stages: [
    informationStageBefore,
    {
      id: 'family-tree-stage',
      type: 'FamilyTreeCensus',
      label: 'Family Tree',
      subject: {
        entity: 'node',
        type: 'person',
      },
      edgeType: {
        entity: 'edge',
        type: 'family',
      },
      relationshipTypeVariable: 'relationship',
      nodeSexVariable: 'sex',
      egoSexVariable: 'sex',
      relationshipToEgoVariable: 'relationshipToEgo',
      nodeIsEgoVariable: 'isEgo',
      scaffoldingStep: {
        text: 'Please create your family tree by adding family members.',
        showQuickStartModal: false,
      },
      nameGenerationStep: {
        text: 'Please provide information for each family member.',
        form: {
          title: 'Family Member Information',
          fields: [
            {
              variable: 'name',
              prompt: 'Name',
              component: 'Text',
            },
            {
              variable: 'age',
              prompt: 'Age',
              component: 'Number',
            },
          ],
        },
      },
      diseaseNominationStep: [
        {
          id: 'disease-nom-1',
          text: 'Which family members have the disease?',
          variable: 'hasDisease',
        },
      ],
    },
    informationStageAfter,
  ],
};

const createMockNodes = (count: number): NcNode[] => {
  const nodeNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
  return Array.from({ length: count }, (_, i) => ({
    [entityPrimaryKeyProperty]: `node-${i + 1}`,
    type: 'person',
    stageId: 'family-tree-stage',
    [entityAttributesProperty]: {
      name: nodeNames[i % nodeNames.length] ?? 'Unknown',
      age: 30 + i * 5,
      sex: i % 2 === 0 ? 'female' : 'male',
    },
  }));
};

type StoryArgs = {
  initialNodeCount: number;
  hasEdges: boolean;
};

function buildPayload(args: StoryArgs) {
  const now = new Date(2025, 0, 1);
  const nodes = createMockNodes(args.initialNodeCount);
  const edges: NcEdge[] = [];

  return {
    id: 'test-session',
    startTime: now,
    finishTime: null,
    exportTime: null,
    lastUpdated: now,
    currentStep: 1,
    stageMetadata: {
      1: {
        hasSeenScaffoldPrompt: true,
        nodes: nodes.map((node, i) => ({
          interviewNetworkId: node[entityPrimaryKeyProperty],
          label: (node[entityAttributesProperty].name as string) ?? '',
          sex:
            (node[entityAttributesProperty].sex as 'male' | 'female') ??
            'female',
          isEgo: i === 0,
          readOnly: false,
        })),
      },
    },
    network: {
      nodes,
      edges,
      ego: {
        [entityPrimaryKeyProperty]: 'ego-1',
        [entityAttributesProperty]: {
          sex: 'female',
        },
      },
    },
    protocol: {
      ...mockProtocol,
      name: 'Test Protocol',
      description: null,
      schemaVersion: 8,
      importedAt: now,
      isPreview: false,
      isPending: false,
      experiments: null,
      assets: [],
    },
  };
}

const FamilyTreeCensusStoryWrapper = (args: StoryArgs) => {
  const configKey = JSON.stringify(args);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const payload = useMemo(() => buildPayload(args), [configKey]);
  const rawPayload = useMemo(() => SuperJSON.stringify(payload), [payload]);

  return (
    <div className="flex h-dvh w-full">
      <StoryInterviewShell rawPayload={rawPayload} disableSync />
    </div>
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/FamilyTreeCensus',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    initialNodeCount: {
      control: { type: 'range', min: 0, max: 6 },
      description: 'Number of family members',
    },
    hasEdges: {
      control: 'boolean',
      description: 'Include family relationship edges',
    },
  },
  args: {
    initialNodeCount: 4,
    hasEdges: false,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
};

export const EmptyTree: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 0,
  },
};

export const ScaffoldingStep: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 2,
  },
};

export const NameGenerationStep: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 4,
  },
};

export const DiseaseNominationStep: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 5,
  },
};

export const LargeFamily: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 6,
  },
};

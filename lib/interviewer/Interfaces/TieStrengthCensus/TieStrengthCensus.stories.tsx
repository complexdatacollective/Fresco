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
        },
      },
    },
    edge: {
      friendship: {
        name: 'Friendship',
        color: 'edge-color-seq-1',
        variables: {
          strength: {
            name: 'Strength',
            type: 'ordinal',
            options: [
              { label: 'Weak', value: 1 },
              { label: 'Moderate', value: 2 },
              { label: 'Strong', value: 3 },
            ],
          },
        },
      },
    },
  },
  stages: [
    informationStageBefore,
    {
      id: 'tie-strength-stage',
      type: 'TieStrengthCensus',
      label: 'Rate Friendships',
      subject: {
        entity: 'node',
        type: 'person',
      },
      introductionPanel: {
        title: 'Rate Your Friendships',
        text: 'In this stage, you will be shown pairs of people from your network. For each pair, please indicate the strength of their friendship.',
      },
      prompts: [
        {
          id: 'prompt-1',
          text: 'How strong is the friendship between these two people?',
          createEdge: 'friendship',
          edgeVariable: 'strength',
          negativeLabel: 'No Friendship',
        },
      ],
    },
    informationStageAfter,
  ],
};

const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

const createMockNodes = (count: number): NcNode[] => {
  return Array.from({ length: count }, (_, i) => ({
    [entityPrimaryKeyProperty]: `node-${i + 1}`,
    type: 'person',
    stageId: 'tie-strength-stage',
    [entityAttributesProperty]: {
      name: names[i % names.length] ?? 'Unknown',
    },
  }));
};

const createMockEdges = (
  pairs: [number, number, number | null][],
): NcEdge[] => {
  return pairs.map(([from, to, strength], i) => ({
    [entityPrimaryKeyProperty]: `edge-${i + 1}`,
    type: 'friendship',
    from: `node-${from}`,
    to: `node-${to}`,
    [entityAttributesProperty]: {
      ...(strength !== null && { strength }),
    },
  }));
};

type StoryArgs = {
  initialNodeCount: number;
  hasExistingEdges: boolean;
};

function buildPayload(args: StoryArgs) {
  const now = new Date(2025, 0, 1);
  const nodes = createMockNodes(args.initialNodeCount);
  const edges = args.hasExistingEdges
    ? createMockEdges([
        [1, 2, 3],
        [2, 3, 1],
      ])
    : [];

  return {
    id: 'test-session',
    startTime: now,
    finishTime: null,
    exportTime: null,
    lastUpdated: now,
    currentStep: 1,
    stageMetadata: null,
    network: {
      nodes,
      edges,
      ego: {
        [entityPrimaryKeyProperty]: 'ego-1',
        [entityAttributesProperty]: {},
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

const TieStrengthCensusStoryWrapper = (args: StoryArgs) => {
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
  title: 'Interview/Interfaces/TieStrengthCensus',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    initialNodeCount: {
      control: { type: 'range', min: 0, max: 5 },
      description: 'Number of nodes in the network',
    },
    hasExistingEdges: {
      control: 'boolean',
      description: 'Include pre-existing friendship edges',
    },
  },
  args: {
    initialNodeCount: 3,
    hasExistingEdges: false,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <TieStrengthCensusStoryWrapper {...args} />,
};

export const Introduction: Story = {
  render: (args) => <TieStrengthCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 3,
  },
};

export const ThreeNodes: Story = {
  render: (args) => <TieStrengthCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 3,
  },
};

export const FiveNodes: Story = {
  render: (args) => <TieStrengthCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 5,
  },
};

export const WithExistingEdges: Story = {
  render: (args) => <TieStrengthCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 4,
    hasExistingEdges: true,
  },
};

export const NoNodes: Story = {
  render: (args) => <TieStrengthCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 0,
  },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

type StoryArgs = {
  initialNodeCount: number;
  hasExistingEdges: boolean;
};

function buildInterview(args: StoryArgs) {
  const si = new SyntheticInterview();

  const nt = si.addNodeType({ name: 'Person' });
  const et = si.addEdgeType({ name: 'Friendship' });
  const strengthVar = et.addVariable({
    name: 'Strength',
    type: 'ordinal',
    options: [
      { label: 'Weak', value: 1 },
      { label: 'Moderate', value: 2 },
      { label: 'Strong', value: 3 },
    ],
  });

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = si.addStage('TieStrengthCensus', {
    label: 'Rate Friendships',
    initialNodes: args.initialNodeCount,
    subject: { entity: 'node', type: nt.id },
    introductionPanel: {
      title: 'Rate Your Friendships',
      text: 'In this stage, you will be shown pairs of people from your network. For each pair, please indicate the strength of their friendship.',
    },
  });

  stage.addPrompt({
    text: 'How strong is the friendship between these two people?',
    createEdge: et.id,
    edgeVariable: strengthVar.id,
    negativeLabel: 'No Friendship',
  });

  if (args.hasExistingEdges && args.initialNodeCount >= 3) {
    si.addEdges(
      [
        [0, 1],
        [1, 2],
      ],
      et.id,
    );
    si.setEdgeAttribute(0, strengthVar.id, 3);
    si.setEdgeAttribute(1, strengthVar.id, 1);
  }

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
}

const TieStrengthCensusStoryWrapper = (args: StoryArgs) => {
  const configKey = JSON.stringify(args);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const interview = useMemo(() => buildInterview(args), [configKey]);
  const rawPayload = useMemo(
    () =>
      SuperJSON.stringify(interview.getInterviewPayload({ currentStep: 1 })),
    [interview],
  );

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

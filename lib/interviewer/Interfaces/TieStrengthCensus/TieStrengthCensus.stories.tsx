import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

type StoryArgs = {
  initialNodeCount: number;
  promptCount: number;
  hasExistingEdges: boolean;
};

const promptConfigs = [
  {
    edgeName: 'Friendship',
    variableName: 'Strength',
    promptText: 'How strong is the friendship between these two people?',
    negativeLabel: 'No Friendship',
    options: [
      { label: 'Weak', value: 1 },
      { label: 'Moderate', value: 2 },
      { label: 'Strong', value: 3 },
    ],
  },
  {
    edgeName: 'Trust',
    variableName: 'Level',
    promptText: 'How much do these two people trust each other?',
    negativeLabel: 'No Trust',
    options: [
      { label: 'Low', value: 1 },
      { label: 'Medium', value: 2 },
      { label: 'High', value: 3 },
    ],
  },
  {
    edgeName: 'Communication',
    variableName: 'Frequency',
    promptText: 'How often do these two people communicate?',
    negativeLabel: 'Never',
    options: [
      { label: 'Rarely', value: 1 },
      { label: 'Sometimes', value: 2 },
      { label: 'Often', value: 3 },
    ],
  },
];

function buildInterview(args: StoryArgs) {
  const si = new SyntheticInterview();

  const nt = si.addNodeType({ name: 'Person' });

  // Create edge types and variables for each prompt
  const edgeConfigs = promptConfigs.slice(0, args.promptCount).map((config) => {
    const et = si.addEdgeType({ name: config.edgeName });
    const variable = et.addVariable({
      name: config.variableName,
      type: 'ordinal',
      options: config.options,
    });
    return { edgeType: et, variable, config };
  });

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = si.addStage('TieStrengthCensus', {
    label: 'Rate Relationships',
    initialNodes: args.initialNodeCount,
    subject: { entity: 'node', type: nt.id },
    introductionPanel: {
      title: 'Rate Your Relationships',
      text: 'In this stage, you will be shown pairs of people from your network. For each pair, please indicate the strength of their relationship.',
    },
  });

  // Add prompts
  for (const { edgeType, variable, config } of edgeConfigs) {
    stage.addPrompt({
      text: config.promptText,
      createEdge: edgeType.id,
      edgeVariable: variable.id,
      negativeLabel: config.negativeLabel,
    });
  }

  // Add existing edges for the first edge type if requested
  if (args.hasExistingEdges && args.initialNodeCount >= 3 && edgeConfigs[0]) {
    const firstConfig = edgeConfigs[0];
    si.addEdges(
      [
        [0, 1],
        [1, 2],
      ],
      firstConfig.edgeType.id,
    );
    si.setEdgeAttribute(0, firstConfig.variable.id, 3);
    si.setEdgeAttribute(1, firstConfig.variable.id, 1);
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
      control: { type: 'range', min: 2, max: 5 },
      description: 'Number of nodes in the network',
    },
    promptCount: {
      control: { type: 'range', min: 1, max: 3 },
      description: 'Number of prompts (Friendship, Trust, Communication)',
    },
    hasExistingEdges: {
      control: 'boolean',
      description: 'Include pre-existing edges for first prompt',
    },
  },
  args: {
    initialNodeCount: 3,
    promptCount: 1,
    hasExistingEdges: false,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <TieStrengthCensusStoryWrapper {...args} />,
};

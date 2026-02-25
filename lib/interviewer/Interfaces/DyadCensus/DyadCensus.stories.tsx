'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

type StoryArgs = {
  initialNodeCount: number;
  promptCount: number;
  introTitle: string;
  introText: string;
};

function buildInterview(args: StoryArgs) {
  const interview = new SyntheticInterview();

  const nodeType = interview.addNodeType({ name: 'Person' });

  interview.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = interview.addStage('DyadCensus', {
    label: 'Dyad Census',
    initialNodes: args.initialNodeCount,
    subject: { entity: 'node', type: nodeType.id },
    introductionPanel: {
      title: args.introTitle,
      text: args.introText,
    },
  });

  for (let i = 0; i < args.promptCount; i++) {
    stage.addPrompt({
      text: `Prompt ${i + 1}: Do these two people know each other?`,
    });
  }

  interview.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return interview;
}

const DyadCensusStoryWrapper = (args: StoryArgs) => {
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
  title: 'Interview/Interfaces/DyadCensus',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    initialNodeCount: {
      control: { type: 'range', min: 2, max: 10 },
      description: 'Number of nodes in the network (pairs = n*(n-1)/2)',
    },
    promptCount: {
      control: { type: 'range', min: 1, max: 3 },
      description: 'Number of prompts',
    },
    introTitle: {
      control: 'text',
      description: 'Introduction panel title',
    },
    introText: {
      control: 'text',
      description: 'Introduction panel text (supports markdown)',
    },
  },
  args: {
    initialNodeCount: 4,
    promptCount: 1,
    introTitle: 'Network Relationships',
    introText:
      'In this section, you will be asked about relationships between people in your network. For each pair of people, please indicate whether they know each other.',
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <DyadCensusStoryWrapper {...args} />,
};

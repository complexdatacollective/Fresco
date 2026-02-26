'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

type StoryArgs = {
  initialNodeCount: number;
};

function buildInterview(args: StoryArgs) {
  const interview = new SyntheticInterview();

  const nodeType = interview.addNodeType({ name: 'Person' });

  interview.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = interview.addStage('AlterForm', {
    label: 'Alter Form',
    initialNodes: args.initialNodeCount,
    subject: { entity: 'node', type: nodeType.id },
    introductionPanel: {
      title: 'About Each Person',
      text: 'Please provide details about each person.',
    },
  });

  stage.addFormField({ component: 'Text', prompt: 'Nickname' });
  stage.addFormField({ component: 'Number', prompt: 'Age' });
  stage.addFormField({ component: 'RadioGroup', prompt: 'Closeness' });

  interview.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return interview;
}

const AlterFormStoryWrapper = (args: StoryArgs) => {
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
  title: 'Interview/Interfaces/AlterForm',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    initialNodeCount: {
      control: { type: 'range', min: 1, max: 10 },
      description: 'Number of alter nodes in the network',
    },
  },
  args: {
    initialNodeCount: 3,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <AlterFormStoryWrapper {...args} />,
};

export const ManyNodes: Story = {
  render: (args) => <AlterFormStoryWrapper {...args} />,
  args: {
    initialNodeCount: 8,
  },
};

export const SingleNode: Story = {
  render: (args) => <AlterFormStoryWrapper {...args} />,
  args: {
    initialNodeCount: 1,
  },
};

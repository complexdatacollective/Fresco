'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';
import { type ComponentType } from '~/lib/interviewer/utils/SyntheticInterview/types';

const FIELD_PRESETS: { component: ComponentType; prompt: string }[] = [
  { component: 'Text', prompt: 'What is your name?' },
  { component: 'Number', prompt: 'How old are you?' },
  { component: 'TextArea', prompt: 'Describe yourself briefly.' },
  { component: 'Toggle', prompt: 'Do you live alone?' },
  { component: 'Boolean', prompt: 'Are you currently employed?' },
  { component: 'RadioGroup', prompt: 'What is your highest education level?' },
  {
    component: 'CheckboxGroup',
    prompt: 'Which languages do you speak?',
  },
  {
    component: 'LikertScale',
    prompt: 'How would you rate your overall health?',
  },
  {
    component: 'VisualAnalogScale',
    prompt: 'How happy are you right now?',
  },
];

type StoryArgs = {
  fieldCount: number;
  introTitle: string;
  introText: string;
};

function buildInterview(args: StoryArgs) {
  const interview = new SyntheticInterview();

  interview.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = interview.addStage('EgoForm', {
    label: 'About You',
    introductionPanel: {
      title: args.introTitle,
      text: args.introText,
    },
  });

  const fieldCount = Math.min(args.fieldCount, FIELD_PRESETS.length);
  for (let i = 0; i < fieldCount; i++) {
    const preset = FIELD_PRESETS[i]!;
    stage.addFormField({
      component: preset.component,
      prompt: preset.prompt,
    });
  }

  interview.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return interview;
}

const EgoFormStoryWrapper = (args: StoryArgs) => {
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
  title: 'Interview/Interfaces/EgoForm',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    fieldCount: {
      control: { type: 'range', min: 1, max: FIELD_PRESETS.length },
      description: 'Number of form fields',
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
    fieldCount: 4,
    introTitle: 'About You',
    introText:
      'Please answer the following questions about yourself. Your responses will be kept confidential.',
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <EgoFormStoryWrapper {...args} />,
};

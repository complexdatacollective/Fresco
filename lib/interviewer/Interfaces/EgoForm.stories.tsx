'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { InterviewStoryShell } from '~/.storybook/InterviewStoryShell';
import { withInterviewAnimation } from '~/.storybook/interview-decorator';
import { type ComponentType } from '~/lib/interviewer/utils/SyntheticInterview/types';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';
import { createStoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import EgoForm from './EgoForm';

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
  const store = useMemo(
    () => interview.getStore({ currentStep: 1 }),
    [interview],
  );
  const nav = useMemo(() => createStoryNavigation(store), [store]);

  const protocol = interview.getProtocol();
  const rawStage = protocol.stages[1];
  if (rawStage?.type !== 'EgoForm') {
    throw new Error('Expected EgoForm stage');
  }
  const stage = rawStage;

  return (
    <InterviewStoryShell
      store={store}
      nav={nav}
      stages={protocol.stages}
      mainStageIndex={1}
    >
      <div id="stage" className="relative flex size-full flex-col items-center">
        <EgoForm
          stage={stage}
          getNavigationHelpers={nav.getNavigationHelpers}
        />
      </div>
    </InterviewStoryShell>
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/EgoForm',
  decorators: [withInterviewAnimation],
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

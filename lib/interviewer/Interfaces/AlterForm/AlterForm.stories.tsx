import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';
import { type ComponentType } from '~/lib/interviewer/utils/SyntheticInterview/types';

const FIELD_PRESETS: { component: ComponentType; prompt: string }[] = [
  { component: 'Text', prompt: 'Nickname' },
  { component: 'Number', prompt: 'Age' },
  { component: 'RadioGroup', prompt: 'How close are you to this person?' },
  { component: 'Toggle', prompt: 'Do they live nearby?' },
  { component: 'TextArea', prompt: 'Describe your relationship.' },
  { component: 'Boolean', prompt: 'Have you met in person?' },
  {
    component: 'CheckboxGroup',
    prompt: 'In what contexts do you interact?',
  },
  {
    component: 'LikertScale',
    prompt: 'How much do you trust this person?',
  },
  {
    component: 'VisualAnalogScale',
    prompt: 'How important is this relationship to you?',
  },
];

type StoryArgs = {
  initialNodeCount: number;
  fieldCount: number;
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
    fieldCount: {
      control: { type: 'range', min: 1, max: FIELD_PRESETS.length },
      description: 'Number of form fields per node',
    },
  },
  args: {
    initialNodeCount: 3,
    fieldCount: 3,
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

export const ManyFields: Story = {
  render: (args) => <AlterFormStoryWrapper {...args} />,
  args: {
    fieldCount: FIELD_PRESETS.length,
  },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { action } from 'storybook/actions';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';
import { type ComponentType } from '~/lib/interviewer/utils/SyntheticInterview/types';

const logAction = action('redux');
const onAction = (a: { type: string; payload?: unknown }) => {
  logAction(a.type, a.payload);
};

const FIELD_PRESETS: { component: ComponentType; prompt: string }[] = [
  { component: 'RadioGroup', prompt: 'How close is this relationship?' },
  { component: 'TextArea', prompt: 'Describe this relationship.' },
  { component: 'Toggle', prompt: 'Do you see each other regularly?' },
  { component: 'Number', prompt: 'How many years have you known each other?' },
  { component: 'Boolean', prompt: 'Have you ever worked together?' },
  {
    component: 'LikertScale',
    prompt: 'How much do you trust this person?',
  },
  {
    component: 'CheckboxGroup',
    prompt: 'In what contexts do you interact?',
  },
  {
    component: 'VisualAnalogScale',
    prompt: 'How important is this relationship?',
  },
];

type StoryArgs = {
  edgeCount: number;
  fieldCount: number;
};

function buildInterview(args: StoryArgs) {
  const si = new SyntheticInterview();

  const nt = si.addNodeType({ name: 'Person' });
  const et = si.addEdgeType({ name: 'Friendship' });

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  // NameGenerator creates the nodes that edges will connect
  si.addStage('NameGenerator', {
    label: 'Name Generator',
    initialNodes: args.edgeCount + 1,
    subject: { entity: 'node', type: nt.id },
  });

  // Create consecutive edge pairs: [0,1], [1,2], [2,3], ...
  const pairs: [number, number][] = Array.from(
    { length: args.edgeCount },
    (_, i) => [i, i + 1],
  );
  si.addEdges(pairs, et.id);

  const stage = si.addStage('AlterEdgeForm', {
    label: 'Alter Edge Form',
    subject: { entity: 'edge', type: et.id },
    introductionPanel: {
      title: 'Relationship Details',
      text: 'Please answer the following questions about each relationship in your network.',
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

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
}

const AlterEdgeFormStoryWrapper = (args: StoryArgs) => {
  const configKey = JSON.stringify(args);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const interview = useMemo(() => buildInterview(args), [configKey]);
  const rawPayload = useMemo(
    () =>
      SuperJSON.stringify(interview.getInterviewPayload({ currentStep: 2 })),
    [interview],
  );

  return (
    <div className="flex h-dvh w-full">
      <StoryInterviewShell
        key={configKey}
        rawPayload={rawPayload}
       
        onAction={onAction}
      />
    </div>
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/AlterEdgeForm',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    edgeCount: {
      control: { type: 'range', min: 0, max: 8 },
      description: 'Number of edges in the network',
    },
    fieldCount: {
      control: { type: 'range', min: 1, max: FIELD_PRESETS.length },
      description: 'Number of form fields per edge',
    },
  },
  args: {
    edgeCount: 3,
    fieldCount: 2,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <AlterEdgeFormStoryWrapper {...args} />,
};

export const ManyEdges: Story = {
  args: {
    edgeCount: 6,
  },
  render: (args) => <AlterEdgeFormStoryWrapper {...args} />,
};

export const NoEdges: Story = {
  args: {
    edgeCount: 0,
  },
  render: (args) => <AlterEdgeFormStoryWrapper {...args} />,
};

export const ManyFields: Story = {
  args: {
    fieldCount: FIELD_PRESETS.length,
  },
  render: (args) => <AlterEdgeFormStoryWrapper {...args} />,
};

function buildValidatedInterview() {
  const si = new SyntheticInterview();
  const nt = si.addNodeType({ name: 'Person' });
  const et = si.addEdgeType({ name: 'Friendship' });

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  si.addStage('NameGenerator', {
    label: 'Name Generator',
    initialNodes: 3,
    subject: { entity: 'node', type: nt.id },
  });

  si.addEdges(
    [
      [0, 1],
      [1, 2],
    ],
    et.id,
  );

  const stage = si.addStage('AlterEdgeForm', {
    label: 'Alter Edge Form (Validated)',
    subject: { entity: 'edge', type: et.id },
    introductionPanel: {
      title: 'Relationship Details',
      text: 'These fields have validation rules. Try advancing without filling them in to see errors.',
    },
  });

  stage.addFormField({
    component: 'RadioGroup',
    prompt: 'How close is this relationship? (required)',
    validation: { required: true },
  });
  stage.addFormField({
    component: 'TextArea',
    prompt: 'Describe this relationship (required, 10–300 characters)',
    validation: { required: true, minLength: 10, maxLength: 300 },
  });
  stage.addFormField({
    component: 'Number',
    prompt: 'Years known (required, 0–100)',
    validation: { required: true, minValue: 0, maxValue: 100 },
  });
  stage.addFormField({
    component: 'CheckboxGroup',
    prompt: 'Interaction contexts (required, pick 1–3)',
    validation: { required: true, minSelected: 1, maxSelected: 3 },
  });

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
}

const WithValidationWrapper = () => {
  const interview = useMemo(() => buildValidatedInterview(), []);
  const rawPayload = useMemo(
    () =>
      SuperJSON.stringify(interview.getInterviewPayload({ currentStep: 2 })),
    [interview],
  );

  return (
    <div className="flex h-dvh w-full">
      <StoryInterviewShell
        rawPayload={rawPayload}
       
        onAction={onAction}
      />
    </div>
  );
};

export const WithValidation: Story = {
  render: () => <WithValidationWrapper />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates edge form fields with validation rules including required fields, min/max values, length constraints, and selection limits. Try advancing without completing the form to see validation errors.',
      },
    },
  },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

type StoryArgs = {
  edgeCount: number;
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

  stage.addFormField({
    component: 'RadioGroup',
    prompt: 'How close is this relationship?',
  });
  stage.addFormField({
    component: 'TextArea',
    prompt: 'Describe this relationship.',
  });

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
      <StoryInterviewShell rawPayload={rawPayload} disableSync />
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
      control: { type: 'range', min: 1, max: 8 },
      description: 'Number of edges in the network',
    },
  },
  args: {
    edgeCount: 3,
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

'use client';

import { type Stage } from '@codaco/protocol-validation';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { InterviewStoryShell } from '~/.storybook/InterviewStoryShell';
import { withInterviewAnimation } from '~/.storybook/interview-decorator';
import { createStoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';
import OneToManyDyadCensus from './OneToManyDyadCensus';

type StoryArgs = {
  initialNodeCount: number;
  promptCount: number;
  removeAfterConsideration: boolean;
};

function buildInterview(args: StoryArgs) {
  const si = new SyntheticInterview(42);
  const nt = si.addNodeType({ name: 'Person' });
  const et = si.addEdgeType({ name: 'Friendship' });

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = si.addStage('OneToManyDyadCensus', {
    label: 'One-to-Many Dyad Census',
    initialNodes: args.initialNodeCount,
    subject: { entity: 'node', type: nt.id },
    behaviours: { removeAfterConsideration: args.removeAfterConsideration },
  });

  for (let i = 0; i < args.promptCount; i++) {
    stage.addPrompt({
      text: `Prompt ${i + 1}: Does this person have a relationship with any of the people below?`,
      createEdge: et.id,
    });
  }

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  const protocol = si.getProtocol();
  const stageConfig = protocol.stages[1]! as Extract<
    Stage,
    { type: 'OneToManyDyadCensus' }
  >;
  const store = si.getStore({ currentStep: 1 });
  const nav = createStoryNavigation(store);

  return { stageConfig, store, nav, stages: protocol.stages };
}

const OneToManyDyadCensusWrapper = (args: StoryArgs) => {
  const configKey = JSON.stringify(args);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const interview = useMemo(() => buildInterview(args), [configKey]);
  const { stageConfig, store, nav, stages } = interview;

  return (
    <InterviewStoryShell
      store={store}
      nav={nav}
      stages={stages}
      mainStageIndex={1}
    >
      <div id="stage" className="relative flex size-full flex-col items-center">
        <OneToManyDyadCensus
          stage={stageConfig}
          getNavigationHelpers={nav.getNavigationHelpers}
        />
      </div>
    </InterviewStoryShell>
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/OneToManyDyadCensus',
  decorators: [withInterviewAnimation],
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    initialNodeCount: {
      control: { type: 'range', min: 2, max: 15 },
      description: 'Number of pre-populated nodes in the network',
    },
    promptCount: {
      control: { type: 'range', min: 1, max: 4 },
      description: 'Number of prompts (pips appear for 2+)',
    },
    removeAfterConsideration: {
      control: 'boolean',
      description:
        'Remove source nodes from the target list after they have been considered',
    },
  },
  args: {
    initialNodeCount: 5,
    promptCount: 1,
    removeAfterConsideration: false,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <OneToManyDyadCensusWrapper {...args} />,
};

export const RemoveAfterConsideration: Story = {
  render: (args) => <OneToManyDyadCensusWrapper {...args} />,
  args: {
    removeAfterConsideration: true,
  },
};

export const MultiplePrompts: Story = {
  render: (args) => <OneToManyDyadCensusWrapper {...args} />,
  args: {
    promptCount: 3,
  },
};

export const ManyNodes: Story = {
  render: (args) => <OneToManyDyadCensusWrapper {...args} />,
  args: {
    initialNodeCount: 12,
  },
};

export const MinimalNetwork: Story = {
  render: (args) => <OneToManyDyadCensusWrapper {...args} />,
  args: {
    initialNodeCount: 2,
  },
};

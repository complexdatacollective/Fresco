'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { Provider } from 'react-redux';
import { withInterviewAnimation } from '~/.storybook/interview-decorator';
import { InterviewNavigationBridge } from '~/.storybook/interview-navigation-bridge';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';
import { createStoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import { type VariableOption } from '~/lib/interviewer/utils/SyntheticInterview/types';
import OrdinalBin from './OrdinalBin';

const ORDINAL_LABELS = [
  'Strongly Disagree',
  'Disagree',
  'Slightly Disagree',
  'Neutral',
  'Slightly Agree',
  'Agree',
  'Strongly Agree',
];

type ColorScale =
  | 'ord-color-seq-1'
  | 'ord-color-seq-2'
  | 'ord-color-seq-3'
  | 'ord-color-seq-4'
  | 'ord-color-seq-5'
  | 'ord-color-seq-6'
  | 'ord-color-seq-7'
  | 'ord-color-seq-8'
  | 'ord-color-seq-9'
  | 'ord-color-seq-10';

type StoryArgs = {
  binCount: number;
  hasMissingValue: boolean;
  colorScale: ColorScale;
  initialNodeCount: number;
  unassignedCount: number;
  promptCount: number;
};

function buildOptions(binCount: number, hasMissingValue: boolean) {
  const options: VariableOption[] = [];

  if (hasMissingValue) {
    options.push({ label: 'N/A', value: -1 });
  }

  for (let i = 0; i < binCount; i++) {
    const label = ORDINAL_LABELS[i] ?? `Option ${i + 1}`;
    options.push({ label, value: i + 1 });
  }

  return options;
}

function buildInterview(args: StoryArgs) {
  const interview = new SyntheticInterview();
  const options = buildOptions(args.binCount, args.hasMissingValue);

  const nodeType = interview.addNodeType({ name: 'Person' });

  const variables: string[] = [];
  for (let i = 0; i < args.promptCount; i++) {
    const ref = nodeType.addVariable({
      name: `Rating ${i + 1}`,
      type: 'ordinal',
      options,
    });
    variables.push(ref.id);
  }

  const stage = interview.addStage('OrdinalBin', {
    label: 'Rate People',
    initialNodes: args.initialNodeCount,
    subject: { entity: 'node', type: nodeType.id },
  });

  for (let i = 0; i < args.promptCount; i++) {
    stage.addPrompt({
      variable: variables[i],
      text: `Prompt ${i + 1}: How much do you agree with each person?`,
      color: args.colorScale,
    });
  }

  // Clear ordinal values on the first `unassignedCount` nodes so they appear
  // in the bucket (unassigned). By default SyntheticInterview auto-generates
  // values via ValueGenerator.
  const clampedUnassigned = Math.min(
    args.unassignedCount,
    args.initialNodeCount,
  );
  for (let i = 0; i < clampedUnassigned; i++) {
    for (const varId of variables) {
      interview.setNodeAttribute(i, varId, null);
    }
  }

  return interview;
}

const OrdinalBinStoryWrapper = (args: StoryArgs) => {
  const configKey = JSON.stringify(args);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const interview = useMemo(() => buildInterview(args), [configKey]);
  const store = useMemo(() => interview.getStore(), [interview]);
  const nav = useMemo(() => createStoryNavigation(store), [store]);

  const protocol = interview.getProtocol();
  const rawStage = protocol.stages[0];
  if (rawStage?.type !== 'OrdinalBin') {
    throw new Error('Expected OrdinalBin stage');
  }
  const stage = rawStage;

  return (
    <Provider store={store}>
      <div id="stage" className="relative flex size-full flex-col items-center">
        <OrdinalBin
          stage={stage}
          registerBeforeNext={nav.registerBeforeNext}
          getNavigationHelpers={nav.getNavigationHelpers}
        />
      </div>
      <InterviewNavigationBridge store={store} storyNavigation={nav} />
    </Provider>
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/OrdinalBin',
  decorators: [withInterviewAnimation],
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    binCount: {
      control: { type: 'range', min: 2, max: 7 },
      description: 'Number of ordinal bins',
    },
    hasMissingValue: {
      control: 'boolean',
      description: 'Include a "N/A" bin with negative value',
    },
    colorScale: {
      control: 'select',
      options: [
        'ord-color-seq-1',
        'ord-color-seq-2',
        'ord-color-seq-3',
        'ord-color-seq-4',
        'ord-color-seq-5',
        'ord-color-seq-6',
        'ord-color-seq-7',
        'ord-color-seq-8',
        'ord-color-seq-9',
        'ord-color-seq-10',
      ],
      description: 'Color scale for the bins',
    },
    initialNodeCount: {
      control: { type: 'range', min: 0, max: 15 },
      description: 'Total number of nodes in the network',
    },
    unassignedCount: {
      control: { type: 'range', min: 0, max: 15 },
      description: 'Nodes without a value (appear in bucket)',
    },
    promptCount: {
      control: { type: 'range', min: 1, max: 4 },
      description: 'Number of prompts (pips appear for 2+)',
    },
  },
  args: {
    binCount: 5,
    hasMissingValue: false,
    colorScale: 'ord-color-seq-1',
    initialNodeCount: 8,
    unassignedCount: 3,
    promptCount: 1,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <OrdinalBinStoryWrapper {...args} />,
};

'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { InterviewStoryShell } from '~/.storybook/InterviewStoryShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';
import { createStoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import { type VariableOption } from '~/lib/interviewer/utils/SyntheticInterview/types';
import CategoricalBin from './CategoricalBin';

const CATEGORY_LABELS = [
  'Family',
  'Work',
  'School',
  'Neighborhood',
  'Social',
  'Online',
  'Sports',
  'Religious',
  'Political',
  'Other',
];

type StoryArgs = {
  categoryCount: number;
  hasMissingValue: boolean;
  hasOtherOption: boolean;
  initialNodeCount: number;
  unassignedCount: number;
  promptCount: number;
};

function buildOptions(categoryCount: number, hasMissingValue: boolean) {
  const options: VariableOption[] = [];

  if (hasMissingValue) {
    options.push({ label: 'N/A', value: -1 });
  }

  for (let i = 0; i < categoryCount; i++) {
    const label = CATEGORY_LABELS[i] ?? `Category ${i + 1}`;
    options.push({ label, value: i + 1 });
  }

  return options;
}

function buildInterview(args: StoryArgs) {
  const interview = new SyntheticInterview();
  const options = buildOptions(args.categoryCount, args.hasMissingValue);

  const nodeType = interview.addNodeType({ name: 'Person' });

  const otherVariableId = args.hasOtherOption
    ? nodeType.addVariable({ name: 'Other Reason', type: 'text' }).id
    : undefined;

  const variables: string[] = [];
  for (let i = 0; i < args.promptCount; i++) {
    const ref = nodeType.addVariable({
      name: `Category ${i + 1}`,
      type: 'categorical',
      options,
    });
    variables.push(ref.id);
  }

  interview.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = interview.addStage('CategoricalBin', {
    label: 'Categorise People',
    initialNodes: args.initialNodeCount,
    subject: { entity: 'node', type: nodeType.id },
  });

  for (let i = 0; i < args.promptCount; i++) {
    stage.addPrompt({
      variable: variables[i],
      text: `Prompt ${i + 1}: Which categories does each person belong to?`,
      ...(otherVariableId && {
        otherVariable: otherVariableId,
        otherVariablePrompt: 'Please specify the other category:',
        otherOptionLabel: 'Other',
      }),
    });
  }

  // Clear categorical values on the first `unassignedCount` nodes so they
  // appear in the bucket (uncategorised).
  const clampedUnassigned = Math.min(
    args.unassignedCount,
    args.initialNodeCount,
  );
  for (let i = 0; i < clampedUnassigned; i++) {
    for (const varId of variables) {
      interview.setNodeAttribute(i, varId, null);
    }
  }

  interview.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return interview;
}

const CategoricalBinStoryWrapper = (args: StoryArgs) => {
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
  if (rawStage?.type !== 'CategoricalBin') {
    throw new Error('Expected CategoricalBin stage');
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
        <CategoricalBin
          stage={stage}
          getNavigationHelpers={nav.getNavigationHelpers}
        />
      </div>
    </InterviewStoryShell>
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/CategoricalBin',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    categoryCount: {
      control: { type: 'range', min: 2, max: 10 },
      description: 'Number of categories',
    },
    hasMissingValue: {
      control: 'boolean',
      description: 'Include a "N/A" category with negative value',
    },
    hasOtherOption: {
      control: 'boolean',
      description: 'Add an "Other" bin with a text input prompt',
    },
    initialNodeCount: {
      control: { type: 'range', min: 0, max: 15 },
      description: 'Total number of nodes in the network',
    },
    unassignedCount: {
      control: { type: 'range', min: 0, max: 15 },
      description: 'Nodes without a category (appear in bucket)',
    },
    promptCount: {
      control: { type: 'range', min: 1, max: 4 },
      description: 'Number of prompts (pips appear for 2+)',
    },
  },
  args: {
    categoryCount: 4,
    hasMissingValue: false,
    hasOtherOption: false,
    initialNodeCount: 8,
    unassignedCount: 3,
    promptCount: 1,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <CategoricalBinStoryWrapper {...args} />,
};

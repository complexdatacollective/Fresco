import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

const ROSTER_SIZES = [50, 100, 1000, 5000, 50000] as const;
type RosterSize = (typeof ROSTER_SIZES)[number];

type StoryArgs = {
  rosterSize: RosterSize;
  initialSelectedCount: number;
  promptCount: number;
  minNodes: number;
  maxNodes: number;
};

function buildInterview(args: StoryArgs) {
  const si = new SyntheticInterview();

  const nodeType = si.addNodeType({ name: 'Person' });
  const nameVar = nodeType.addVariable({ name: 'Name', type: 'text' });
  const ageVar = nodeType.addVariable({ name: 'Age', type: 'number' });
  const locationVar = nodeType.addVariable({
    name: 'Location',
    type: 'text',
  });

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const behaviours: { minNodes?: number; maxNodes?: number } = {};
  if (args.minNodes > 0) behaviours.minNodes = args.minNodes;
  if (args.maxNodes > 0) behaviours.maxNodes = args.maxNodes;

  const stage = si.addStage('NameGeneratorRoster', {
    label: 'Select People',
    initialNodes: args.initialSelectedCount,
    subject: { entity: 'node', type: nodeType.id },
    dataSource: 'externalData',
    behaviours: Object.keys(behaviours).length > 0 ? behaviours : undefined,
    cardOptions: {
      displayLabel: nameVar.id,
      additionalProperties: [
        { label: 'Age', variable: ageVar.id },
        { label: 'Location', variable: locationVar.id },
      ],
    },
    sortOptions: {
      sortOrder: [{ property: nameVar.id, direction: 'asc' }],
      sortableProperties: [
        { variable: nameVar.id, label: 'Name' },
        { variable: ageVar.id, label: 'Age' },
        { variable: locationVar.id, label: 'Location' },
      ],
    },
    searchOptions: {
      fuzziness: 0.6,
      matchProperties: [nameVar.id, locationVar.id],
    },
  });

  for (let i = 0; i < args.promptCount; i++) {
    stage.addPrompt({
      text: `Prompt ${i + 1}: Please select the people you know from this list.`,
    });
  }

  si.addAsset({
    key: 'asset-external-data',
    assetId: 'externalData',
    name: 'External Data',
    type: 'network',
    url: `/storybook/roster-${args.rosterSize}.json`,
    size: 0,
  });

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
}

const NameGeneratorRosterStoryWrapper = (args: StoryArgs) => {
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
  title: 'Interview/Interfaces/NameGeneratorRoster',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    rosterSize: {
      control: 'select',
      options: ROSTER_SIZES,
      description: 'Number of items in the external data roster',
    },
    initialSelectedCount: {
      control: { type: 'range', min: 0, max: 10 },
      description: 'Pre-selected nodes assigned to prompt 1',
    },
    promptCount: {
      control: { type: 'range', min: 1, max: 4 },
      description: 'Number of prompts (pips appear for 2+)',
    },
    minNodes: {
      control: 'number',
      description: 'Min node constraint (0 = disabled)',
    },
    maxNodes: {
      control: 'number',
      description: 'Max node constraint (0 = no limit)',
    },
  },
  args: {
    rosterSize: 100,
    initialSelectedCount: 0,
    promptCount: 1,
    minNodes: 0,
    maxNodes: 0,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
};

export const WithSelectedNodes: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    initialSelectedCount: 4,
  },
};

export const LargeRoster: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    rosterSize: 5000,
  },
};

export const StressTest: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    rosterSize: 50000,
  },
};

export const WithMinNodes: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    minNodes: 3,
  },
};

export const WithMaxNodes: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    maxNodes: 5,
    initialSelectedCount: 3,
  },
};

export const MultiplePrompts: Story = {
  render: (args) => <NameGeneratorRosterStoryWrapper {...args} />,
  args: {
    promptCount: 3,
    initialSelectedCount: 2,
  },
};

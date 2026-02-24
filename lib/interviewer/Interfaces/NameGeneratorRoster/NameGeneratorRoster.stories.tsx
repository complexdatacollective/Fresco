'use client';

import { type Stage } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { InterviewStoryShell } from '~/.storybook/InterviewStoryShell';
import sessionReducer from '~/lib/interviewer/ducks/modules/session';
import uiReducer from '~/lib/interviewer/ducks/modules/ui';
import { createStoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import NameGeneratorRoster from './NameGeneratorRoster';

const names = [
  'Alice Johnson',
  'Bob Smith',
  'Charlie Brown',
  'Diana Prince',
  'Eve Martinez',
  'Frank Wilson',
  'Grace Lee',
  'Henry Garcia',
  'Iris Chen',
  'Jack Taylor',
  'Kate Williams',
  'Leo Anderson',
  'Maya Thomas',
  'Noah Jackson',
  'Olivia White',
];

const locations = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
  'Austin',
  'Denver',
  'Portland',
  'Seattle',
  'Miami',
];

const ROSTER_SIZES = [50, 100, 1000, 5000, 50000] as const;
type RosterSize = (typeof ROSTER_SIZES)[number];

type StoryArgs = {
  rosterSize: RosterSize;
  initialSelectedCount: number;
  promptCount: number;
  minNodes: number;
  maxNodes: number;
};

const STAGE_ID = 'roster-stage';

const createPrompts = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `prompt-${i + 1}`,
    text: `Prompt ${i + 1}: Please select the people you know from this list.`,
  }));

const createMockNodes = (
  count: number,
  promptIds: string[],
  idOffset = 0,
): NcNode[] =>
  Array.from({ length: count }, (_, i) => ({
    [entityPrimaryKeyProperty]: `node-${idOffset + i + 1}`,
    type: 'person',
    stageId: STAGE_ID,
    promptIDs: promptIds,
    [entityAttributesProperty]: {
      name: names[(idOffset + i) % names.length] ?? 'Unknown',
      age: 20 + (((idOffset + i) * 7) % 40),
      location: locations[(idOffset + i) % locations.length] ?? 'Unknown',
    },
  }));

const createStage = (args: StoryArgs) => {
  const prompts = createPrompts(args.promptCount);
  const behaviours =
    args.minNodes > 0 || args.maxNodes > 0
      ? {
          ...(args.minNodes > 0 ? { minNodes: args.minNodes } : {}),
          ...(args.maxNodes > 0 ? { maxNodes: args.maxNodes } : {}),
        }
      : undefined;

  return {
    id: STAGE_ID,
    type: 'NameGeneratorRoster' as const,
    label: 'Select People',
    subject: { entity: 'node' as const, type: 'person' },
    dataSource: 'externalData',
    prompts,
    behaviours,
    cardOptions: {
      displayLabel: 'name',
      additionalProperties: [
        { label: 'Age', variable: 'age' },
        { label: 'Location', variable: 'location' },
      ],
    },
    sortOptions: {
      sortOrder: [{ property: 'name', direction: 'asc' as const }],
      sortableProperties: [
        { variable: 'name', label: 'Name' },
        { variable: 'age', label: 'Age' },
        { variable: 'location', label: 'Location' },
      ],
    },
    searchOptions: {
      fuzziness: 0.6,
      matchProperties: ['name', 'location'],
    },
  };
};

const informationStageBefore = {
  id: 'info-before',
  type: 'Information' as const,
  label: 'Welcome',
  title: 'Welcome',
  items: [
    { id: 'item-1', type: 'text' as const, content: 'Before the main stage.' },
  ],
};

const informationStageAfter = {
  id: 'info-after',
  type: 'Information' as const,
  label: 'Complete',
  title: 'Complete',
  items: [
    { id: 'item-2', type: 'text' as const, content: 'After the main stage.' },
  ],
};

const createMockProtocol = (args: StoryArgs) => {
  const stage = createStage(args);

  return {
    id: 'test-protocol',
    name: 'Test Protocol',
    schemaVersion: 8,
    importedAt: new Date().toISOString(),
    stages: [informationStageBefore, stage, informationStageAfter],
    codebook: {
      node: {
        person: {
          name: 'Person',
          color: 'node-color-seq-1',
          displayVariable: 'name',
          variables: {
            name: { name: 'Name', type: 'text' },
            age: { name: 'Age', type: 'number' },
            location: { name: 'Location', type: 'text' },
          },
        },
      },
    },
    assets: [
      {
        key: 'asset-external-data',
        assetId: 'externalData',
        name: 'External Data',
        type: 'network',
        url: `/storybook/roster-${args.rosterSize}.json`,
        size: 0,
      },
    ],
    experiments: {
      encryptedVariables: false,
    },
    isPreview: false,
    isPending: false,
  };
};

const createMockSession = (nodes: NcNode[]) => ({
  id: 'test-session',
  currentStep: 1,
  promptIndex: 0,
  startTime: new Date().toISOString(),
  finishTime: null,
  exportTime: null,
  lastUpdated: new Date().toISOString(),
  network: {
    nodes,
    edges: [],
    ego: {
      [entityPrimaryKeyProperty]: 'ego-1',
      [entityAttributesProperty]: {},
    },
  },
});

const createStore = (args: StoryArgs) => {
  const protocol = createMockProtocol(args);

  const selectedNodes = createMockNodes(args.initialSelectedCount, [
    'prompt-1',
  ]);

  const session = createMockSession(selectedNodes);

  const mockUiState = {
    FORM_IS_READY: false,
    passphrase: null as string | null,
    passphraseInvalid: false,
    showPassphrasePrompter: false,
  };

  return configureStore({
    reducer: combineReducers({
      session: sessionReducer,
      protocol: (state: typeof protocol = protocol) => state,
      ui: uiReducer,
    }),
    preloadedState: {
      session,
      protocol,
      ui: mockUiState,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

const NameGeneratorRosterStoryWrapper = (args: StoryArgs) => {
  const configKey = JSON.stringify(args);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => createStore(args), [configKey]);
  const nav = useMemo(() => createStoryNavigation(store), [store]);

  const protocol = createMockProtocol(args);
  const stage = createStage(args);

  return (
    <InterviewStoryShell
      store={store}
      nav={nav}
      stages={protocol.stages as Stage[]}
      mainStageIndex={1}
    >
      <div id="stage" className="relative flex size-full flex-col items-center">
        <NameGeneratorRoster
          stage={stage}
          getNavigationHelpers={nav.getNavigationHelpers}
        />
      </div>
    </InterviewStoryShell>
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

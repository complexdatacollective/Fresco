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
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { InterviewStoryShell } from '~/.storybook/InterviewStoryShell';
import sessionReducer from '~/lib/interviewer/ducks/modules/session';
import uiReducer from '~/lib/interviewer/ducks/modules/ui';
import { createStoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import NameGenerator from './NameGenerator';

const names = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Iris',
  'Jack',
  'Kate',
  'Leo',
  'Maya',
  'Noah',
  'Olivia',
];

type StageType = 'NameGenerator' | 'NameGeneratorQuickAdd';

type StoryArgs = {
  stageType: StageType;
  initialNodeCount: number;
  promptCount: number;
  panelCount: number;
  minNodes: number;
  maxNodes: number;
};

const STAGE_ID = 'ng-stage';

const createPrompts = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `prompt-${i + 1}`,
    text: `Prompt ${i + 1}: Please name the people you know.`,
  }));

const createPanels = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `panel-${i + 1}`,
    title: `Panel ${i + 1}`,
    dataSource: 'existing' as const,
  }));

const createMockNodes = (
  count: number,
  promptIds: string[],
  stageId: string,
  idOffset = 0,
): NcNode[] =>
  Array.from({ length: count }, (_, i) => ({
    [entityPrimaryKeyProperty]: `node-${idOffset + i + 1}`,
    type: 'person',
    stageId,
    promptIDs: promptIds,
    [entityAttributesProperty]: {
      name: names[(idOffset + i) % names.length] ?? 'Unknown',
      age: null,
      nickname: null,
    },
  }));

const createStage = (args: StoryArgs) => {
  const prompts = createPrompts(args.promptCount);
  const panels =
    args.panelCount > 0 ? createPanels(args.panelCount) : undefined;
  const behaviours =
    args.minNodes > 0 || args.maxNodes > 0
      ? {
          ...(args.minNodes > 0 ? { minNodes: args.minNodes } : {}),
          ...(args.maxNodes > 0 ? { maxNodes: args.maxNodes } : {}),
        }
      : undefined;

  const base = {
    id: STAGE_ID,
    label: 'Name Generator',
    subject: { entity: 'node' as const, type: 'person' },
    prompts,
    panels,
    behaviours,
  };

  if (args.stageType === 'NameGenerator') {
    return {
      ...base,
      type: 'NameGenerator' as const,
      form: {
        title: 'Add a person',
        fields: [
          { variable: 'name', prompt: 'What is their name?' },
          { variable: 'age', prompt: 'How old are they?' },
          { variable: 'nickname', prompt: 'Do they have a nickname?' },
        ],
      },
    };
  }

  return {
    ...base,
    type: 'NameGeneratorQuickAdd' as const,
    quickAdd: 'name',
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
            name: { name: 'Name', type: 'text', component: 'Text' },
            age: { name: 'Age', type: 'number', component: 'Number' },
            nickname: { name: 'Nickname', type: 'text', component: 'Text' },
          },
        },
      },
    },
    assets: [],
    experiments: {},
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

  // Build nodes: main nodes for prompt-1, panel nodes for prompt-2
  const mainNodes = createMockNodes(
    args.initialNodeCount,
    ['prompt-1'],
    STAGE_ID,
  );
  const panelNodes =
    args.panelCount > 0 && args.promptCount >= 2
      ? createMockNodes(3, ['prompt-2'], STAGE_ID, args.initialNodeCount)
      : [];

  const session = createMockSession([...mainNodes, ...panelNodes]);

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

const NameGeneratorStoryWrapper = (args: StoryArgs) => {
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
        <NameGenerator
          stage={stage}
          getNavigationHelpers={nav.getNavigationHelpers}
        />
      </div>
    </InterviewStoryShell>
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/NameGenerator',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    stageType: {
      control: 'radio',
      options: ['NameGeneratorQuickAdd', 'NameGenerator'],
      description: 'Quick-add input or form dialog',
    },
    initialNodeCount: {
      control: { type: 'range', min: 0, max: 15 },
      description: 'Pre-populated nodes assigned to prompt 1',
    },
    promptCount: {
      control: { type: 'range', min: 1, max: 4 },
      description: 'Number of prompts (pips appear for 2+)',
    },
    panelCount: {
      control: { type: 'range', min: 0, max: 2 },
      description: 'Side panels (dataSource: existing)',
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
    stageType: 'NameGeneratorQuickAdd',
    initialNodeCount: 3,
    promptCount: 2,
    panelCount: 1,
    minNodes: 0,
    maxNodes: 0,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <NameGeneratorStoryWrapper {...args} />,
};

export const MinNodesValidation: Story = {
  args: {
    stageType: 'NameGeneratorQuickAdd',
    initialNodeCount: 0,
    promptCount: 1,
    panelCount: 0,
    minNodes: 3,
    maxNodes: 0,
  },
  render: (args) => <NameGeneratorStoryWrapper {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the forward button to trigger validation
    const forwardButton = canvas.getByRole('button', { name: 'Next Step' });
    await userEvent.click(forwardButton);

    // The validation popup should appear (rendered via portal)
    await waitFor(async () => {
      await expect(
        screen.getByText(/must create at least/i),
      ).toBeInTheDocument();
    });

    await expect(screen.getByText('3')).toBeInTheDocument();
  },
};

export const MaxNodesReached: Story = {
  args: {
    stageType: 'NameGeneratorQuickAdd',
    initialNodeCount: 3,
    promptCount: 1,
    panelCount: 0,
    minNodes: 0,
    maxNodes: 3,
  },
  render: (args) => <NameGeneratorStoryWrapper {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the forward button to get the pulse class (maxNodesReached → updateReady)
    const forwardButton = canvas.getByRole('button', { name: 'Next Step' });
    await waitFor(
      async () => {
        await expect(forwardButton.className).toMatch(/animate-pulse-glow/);
      },
      { timeout: 3000 },
    );
  },
};

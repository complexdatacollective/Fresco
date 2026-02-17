'use client';

import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Provider } from 'react-redux';
import Sociogram from './Sociogram';

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
];

const createMockNodes = (
  count: number,
  layoutVariable: string,
  options?: {
    placed?: boolean;
    highlightVariable?: string;
    highlightValues?: (boolean | null)[];
  },
): NcNode[] => {
  return Array.from({ length: count }, (_, i) => {
    const position =
      options?.placed !== false
        ? {
            x: 0.2 + Math.random() * 0.6,
            y: 0.2 + Math.random() * 0.6,
          }
        : null;

    return {
      [entityPrimaryKeyProperty]: `node-${i + 1}`,
      type: 'person',
      stageId: 'sociogram-stage',
      [entityAttributesProperty]: {
        name: names[i % names.length] ?? 'Unknown',
        [layoutVariable]: position,
        ...(options?.highlightVariable
          ? {
              [options.highlightVariable]: options.highlightValues?.[i] ?? null,
            }
          : {}),
      },
    };
  });
};

const createMockEdges = (
  pairs: [number, number][],
  edgeType = 'friendship',
) => {
  return pairs.map(([from, to], i) => ({
    [entityPrimaryKeyProperty]: `edge-${i + 1}`,
    type: edgeType,
    from: `node-${from}`,
    to: `node-${to}`,
  }));
};

type MockProtocol = {
  id: string;
  schemaVersion: number;
  codebook: {
    node: Record<
      string,
      {
        name: string;
        color: string;
        displayVariable: string;
        variables: Record<
          string,
          { name: string; type: string; options?: unknown[] }
        >;
      }
    >;
    edge?: Record<string, { name: string; color: string }>;
  };
  stages: unknown[];
  assets: unknown[];
};

const createMockProtocol = (
  stageConfig: Record<string, unknown>,
  overrides?: Partial<MockProtocol>,
): MockProtocol => ({
  id: 'test-protocol',
  schemaVersion: 8,
  codebook: {
    node: {
      person: {
        name: 'Person',
        color: 'node-color-seq-1',
        displayVariable: 'name',
        variables: {
          name: { name: 'Name', type: 'text' },
          sociogramLayout: {
            name: 'Sociogram Layout',
            type: 'layout',
          },
          isClose: {
            name: 'Close Friend',
            type: 'boolean',
          },
        },
      },
    },
    edge: {
      friendship: {
        name: 'Friendship',
        color: 'edge-color-seq-1',
      },
    },
  },
  stages: [stageConfig],
  assets: [],
  ...overrides,
});

const createMockSession = (
  nodes: NcNode[] = [],
  edges: ReturnType<typeof createMockEdges> = [],
) => ({
  id: 'test-session',
  currentStep: 0,
  promptIndex: 0,
  startTime: new Date().toISOString(),
  finishTime: null,
  exportTime: null,
  lastUpdated: new Date().toISOString(),
  network: {
    nodes,
    edges,
    ego: {
      [entityPrimaryKeyProperty]: 'ego-1',
      [entityAttributesProperty]: {},
    },
  },
});

const mockUiState = {
  passphrase: null as string | null,
  passphraseInvalid: false,
  showPassphrasePrompter: false,
};

const createMockStore = (
  protocol: MockProtocol,
  nodes: NcNode[] = [],
  edges: ReturnType<typeof createMockEdges> = [],
) => {
  const session = createMockSession(nodes, edges);
  return configureStore({
    reducer: {
      session: (state: typeof session = session) => state,
      protocol: (state: typeof protocol = protocol) => state,
      ui: (state: typeof mockUiState = mockUiState) => state,
    },
    preloadedState: {
      protocol,
      session,
      ui: mockUiState,
    },
  });
};

const mockRegisterBeforeNext = () => {
  // no-op for stories
};

const mockGetNavigationHelpers = () => ({
  moveForward: () => {
    // no-op for stories
  },
  moveBackward: () => {
    // no-op for stories
  },
});

// --- Stage Configurations ---

const baseStage = {
  id: 'sociogram-stage',
  type: 'Sociogram' as const,
  label: 'Sociogram',
  subject: {
    entity: 'node' as const,
    type: 'person',
  },
};

const defaultPrompt = {
  id: 'prompt-1',
  text: 'Place people in the circles based on how close you are to them.',
  layout: {
    layoutVariable: 'sociogramLayout',
  },
};

const highlightPrompt = {
  id: 'prompt-1',
  text: 'Highlight people who are close friends.',
  layout: {
    layoutVariable: 'sociogramLayout',
  },
  highlight: {
    allowHighlighting: true,
    variable: 'isClose',
  },
};

const edgePrompt = {
  id: 'prompt-1',
  text: 'Draw lines between people who know each other.',
  layout: {
    layoutVariable: 'sociogramLayout',
  },
  edges: {
    create: 'friendship',
    display: ['friendship'],
  },
};

const defaultStage = {
  ...baseStage,
  prompts: [defaultPrompt],
};

const stageWithConcentricCircles = {
  ...baseStage,
  background: {
    concentricCircles: 4,
    skewedTowardCenter: true,
  },
  prompts: [defaultPrompt],
};

const backgroundImageAssetId = 'bg-map-1';

const stageWithBackgroundImage = {
  ...baseStage,
  background: {
    image: backgroundImageAssetId,
  },
  prompts: [defaultPrompt],
};

const stageWithHighlighting = {
  ...baseStage,
  prompts: [highlightPrompt],
};

const stageWithEdges = {
  ...baseStage,
  prompts: [edgePrompt],
};

const stageWithAutoLayout = {
  ...baseStage,
  behaviours: {
    automaticLayout: {
      enabled: true,
    },
  },
  prompts: [defaultPrompt],
};

const stageWithMultiplePrompts = {
  ...baseStage,
  prompts: [
    defaultPrompt,
    {
      id: 'prompt-2',
      text: 'Now highlight people who are close friends.',
      layout: {
        layoutVariable: 'sociogramLayout',
      },
      highlight: {
        allowHighlighting: true,
        variable: 'isClose',
      },
    },
  ],
};

// --- Decorator ---

type DecoratorParams = {
  nodes?: NcNode[];
  edges?: ReturnType<typeof createMockEdges>;
  protocol?: MockProtocol;
};

const ReduxDecorator = (
  Story: React.ComponentType,
  context: {
    parameters?: DecoratorParams;
  },
) => {
  const stage =
    context.parameters?.protocol?.stages[0] ?? (defaultStage as unknown);
  const protocol =
    context.parameters?.protocol ??
    createMockProtocol(stage as typeof defaultStage);
  const store = createMockStore(
    protocol,
    context.parameters?.nodes ?? [],
    context.parameters?.edges ?? [],
  );

  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
};

// --- Meta ---

const meta: Meta<typeof Sociogram> = {
  title: 'Interview/Interfaces/Sociogram',
  component: Sociogram,
  decorators: [ReduxDecorator],
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    stage: {
      control: 'object',
      description: 'Stage configuration from protocol',
    },
    registerBeforeNext: {
      control: false,
      description: 'Callback to register navigation guard',
    },
    getNavigationHelpers: {
      control: false,
      description: 'Returns navigation helper functions',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// --- Stories ---

export const Default: Story = {
  args: {
    stage: defaultStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(5, 'sociogramLayout'),
    protocol: createMockProtocol(defaultStage),
    docs: {
      description: {
        story:
          'Basic Sociogram with placed nodes and default concentric circle background.',
      },
    },
  },
};

export const EmptyNetwork: Story = {
  args: {
    stage: defaultStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: [],
    protocol: createMockProtocol(defaultStage),
    docs: {
      description: {
        story: 'Sociogram with no nodes in the network.',
      },
    },
  },
};

export const WithUnplacedNodes: Story = {
  args: {
    stage: defaultStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: [
      ...createMockNodes(3, 'sociogramLayout'),
      ...createMockNodes(3, 'sociogramLayout', { placed: false }).map(
        (n, i) => ({
          ...n,
          [entityPrimaryKeyProperty]: `unplaced-${i + 1}`,
          [entityAttributesProperty]: {
            ...n[entityAttributesProperty],
            name: names[(i + 3) % names.length] ?? 'Unknown',
          },
        }),
      ),
    ],
    protocol: createMockProtocol(defaultStage),
    docs: {
      description: {
        story:
          'Sociogram with some placed nodes on the canvas and unplaced nodes in the bucket.',
      },
    },
  },
};

export const ConcentricCircles: Story = {
  args: {
    stage: stageWithConcentricCircles,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(6, 'sociogramLayout'),
    protocol: createMockProtocol(stageWithConcentricCircles),
    docs: {
      description: {
        story:
          'Sociogram with 4 concentric circles and skewed-toward-center distribution.',
      },
    },
  },
};

export const WithEdges: Story = {
  args: {
    stage: stageWithEdges,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(5, 'sociogramLayout'),
    edges: createMockEdges([
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 5],
      [4, 5],
    ]),
    protocol: createMockProtocol(stageWithEdges),
    docs: {
      description: {
        story:
          'Sociogram with edge creation enabled and existing edges displayed between nodes.',
      },
    },
  },
};

export const WithHighlighting: Story = {
  args: {
    stage: stageWithHighlighting,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(6, 'sociogramLayout', {
      highlightVariable: 'isClose',
      highlightValues: [true, false, true, null, true, false],
    }),
    protocol: createMockProtocol(stageWithHighlighting),
    docs: {
      description: {
        story:
          'Sociogram with node highlighting enabled. Some nodes are highlighted as close friends.',
      },
    },
  },
};

export const AutomaticLayout: Story = {
  args: {
    stage: stageWithAutoLayout,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(8, 'sociogramLayout'),
    edges: createMockEdges([
      [1, 2],
      [1, 3],
      [2, 3],
      [4, 5],
      [5, 6],
      [7, 8],
    ]),
    protocol: createMockProtocol(stageWithAutoLayout),
    docs: {
      description: {
        story:
          'Sociogram with automatic force-directed layout enabled. Nodes are positioned by the simulation.',
      },
    },
  },
};

export const MultiplePrompts: Story = {
  args: {
    stage: stageWithMultiplePrompts,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(5, 'sociogramLayout'),
    protocol: createMockProtocol(stageWithMultiplePrompts),
    docs: {
      description: {
        story:
          'Sociogram with multiple prompts. The first prompt handles positioning, the second enables highlighting.',
      },
    },
  },
};

export const ManyNodes: Story = {
  args: {
    stage: defaultStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(10, 'sociogramLayout'),
    edges: createMockEdges([
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [1, 5],
      [2, 7],
      [3, 9],
    ]),
    protocol: createMockProtocol(defaultStage),
    docs: {
      description: {
        story:
          'Sociogram with many nodes to test layout density and performance.',
      },
    },
  },
};

export const BackgroundImage: Story = {
  args: {
    stage: stageWithBackgroundImage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(5, 'sociogramLayout'),
    protocol: createMockProtocol(stageWithBackgroundImage, {
      assets: [
        {
          assetId: backgroundImageAssetId,
          url: 'https://picsum.photos/seed/sociogram/1200/1200',
        },
      ],
    }),
    docs: {
      description: {
        story:
          'Sociogram with a background image instead of concentric circles.',
      },
    },
  },
};

export const EdgesAndHighlighting: Story = {
  args: {
    stage: {
      ...baseStage,
      prompts: [
        {
          id: 'prompt-1',
          text: 'Draw lines between people who know each other and highlight close friends.',
          layout: {
            layoutVariable: 'sociogramLayout',
          },
          edges: {
            create: 'friendship',
            display: ['friendship'],
          },
          highlight: {
            allowHighlighting: true,
            variable: 'isClose',
          },
        },
      ],
    },
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(6, 'sociogramLayout', {
      highlightVariable: 'isClose',
      highlightValues: [true, false, true, false, true, false],
    }),
    edges: createMockEdges([
      [1, 3],
      [1, 5],
      [3, 5],
      [2, 4],
    ]),
    protocol: createMockProtocol({
      ...baseStage,
      prompts: [
        {
          id: 'prompt-1',
          text: 'Draw lines between people who know each other and highlight close friends.',
          layout: { layoutVariable: 'sociogramLayout' },
          edges: { create: 'friendship', display: ['friendship'] },
          highlight: { allowHighlighting: true, variable: 'isClose' },
        },
      ],
    }),
    docs: {
      description: {
        story:
          'Sociogram with both edge creation and node highlighting enabled simultaneously. Highlighted nodes have edges drawn between them.',
      },
    },
  },
};

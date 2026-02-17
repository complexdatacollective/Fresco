'use client';

import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { configureStore, createReducer } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Provider } from 'react-redux';
import { action } from 'storybook/actions';
import { updateNode } from '~/lib/interviewer/ducks/modules/session';
import Narrative from './Narrative';

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

const createMockNodes = (
  count: number,
  layoutVariable: string,
  options?: {
    placed?: boolean;
    highlightVariable?: string;
    highlightValues?: (boolean | null)[];
    groupVariable?: string;
    groupValues?: (number[] | null)[];
  },
): NcNode[] => {
  // Deterministic positions spread across the canvas
  const positions = [
    { x: 0.2, y: 0.25 },
    { x: 0.35, y: 0.3 },
    { x: 0.25, y: 0.45 },
    { x: 0.4, y: 0.15 },
    { x: 0.6, y: 0.5 },
    { x: 0.7, y: 0.4 },
    { x: 0.65, y: 0.6 },
    { x: 0.75, y: 0.55 },
    { x: 0.5, y: 0.75 },
    { x: 0.45, y: 0.85 },
    { x: 0.55, y: 0.7 },
    { x: 0.35, y: 0.8 },
    { x: 0.15, y: 0.65 },
    { x: 0.8, y: 0.2 },
    { x: 0.85, y: 0.75 },
  ];

  return Array.from({ length: count }, (_, i) => {
    const position =
      options?.placed !== false
        ? (positions[i % positions.length] ?? { x: 0.5, y: 0.5 })
        : null;

    return {
      [entityPrimaryKeyProperty]: `node-${i + 1}`,
      type: 'person',
      stageId: 'narrative-stage',
      promptIDs: [],
      [entityAttributesProperty]: {
        name: names[i % names.length] ?? 'Unknown',
        [layoutVariable]: position,
        ...(options?.highlightVariable
          ? {
              [options.highlightVariable]: options.highlightValues?.[i] ?? null,
            }
          : {}),
        ...(options?.groupVariable
          ? {
              [options.groupVariable]: options.groupValues?.[i] ?? null,
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
    [entityAttributesProperty]: {} as Record<string, unknown>,
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
          narrativeLayout1: { name: 'Narrative Layout 1', type: 'layout' },
          narrativeLayout2: { name: 'Narrative Layout 2', type: 'layout' },
          isClose: { name: 'Close Friend', type: 'boolean' },
          isTrusted: { name: 'Trusted', type: 'boolean' },
          community: {
            name: 'Community',
            type: 'categorical',
            options: [
              { value: 1, label: 'Family' },
              { value: 2, label: 'Work' },
              { value: 3, label: 'School' },
              { value: 4, label: 'Neighborhood' },
            ],
          },
        },
      },
    },
    edge: {
      friendship: { name: 'Friendship', color: 'edge-color-seq-1' },
      professional: { name: 'Professional', color: 'edge-color-seq-2' },
    },
    ...overrides?.codebook,
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

  const sessionReducer = createReducer(session, (builder) => {
    builder.addCase(updateNode.fulfilled, (state, reduxAction) => {
      const { nodeId, newAttributeData } = reduxAction.payload;
      const node = state.network.nodes.find(
        (n) => n[entityPrimaryKeyProperty] === nodeId,
      );
      if (node) {
        Object.assign(node[entityAttributesProperty], newAttributeData);
      }
      action('updateNode')({ nodeId, newAttributeData });
    });
  });

  return configureStore({
    reducer: {
      session: sessionReducer,
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
  id: 'narrative-stage',
  type: 'Narrative' as const,
  label: 'Narrative',
  subject: {
    entity: 'node' as const,
    type: 'person',
  },
};

const singlePreset = {
  id: 'preset-1',
  label: 'Social Network',
  layoutVariable: 'narrativeLayout1',
};

const presetWithEdges = {
  id: 'preset-1',
  label: 'Social Network',
  layoutVariable: 'narrativeLayout1',
  edges: {
    display: ['friendship'],
  },
};

const presetWithGroups = {
  id: 'preset-1',
  label: 'Community Groups',
  layoutVariable: 'narrativeLayout1',
  groupVariable: 'community',
};

const presetWithHighlights = {
  id: 'preset-1',
  label: 'Close Friends',
  layoutVariable: 'narrativeLayout1',
  highlight: ['isClose', 'isTrusted'],
};

const presetWithEverything = {
  id: 'preset-1',
  label: 'Full View',
  layoutVariable: 'narrativeLayout1',
  edges: {
    display: ['friendship', 'professional'],
  },
  groupVariable: 'community',
  highlight: ['isClose'],
};

const multiplePresets = [
  {
    id: 'preset-1',
    label: 'Social View',
    layoutVariable: 'narrativeLayout1',
    edges: { display: ['friendship'] },
    groupVariable: 'community',
    highlight: ['isClose'],
  },
  {
    id: 'preset-2',
    label: 'Professional View',
    layoutVariable: 'narrativeLayout2',
    edges: { display: ['professional'] },
    highlight: ['isTrusted'],
  },
  {
    id: 'preset-3',
    label: 'Community Map',
    layoutVariable: 'narrativeLayout1',
    groupVariable: 'community',
  },
];

// Simple stage with one preset
const defaultStage = {
  ...baseStage,
  presets: [singlePreset],
};

const stageWithConcentricCircles = {
  ...baseStage,
  background: {
    concentricCircles: 4,
    skewedTowardCenter: true,
  },
  presets: [singlePreset],
};

const stageWithEdges = {
  ...baseStage,
  presets: [presetWithEdges],
};

const stageWithGroups = {
  ...baseStage,
  presets: [presetWithGroups],
};

const stageWithHighlights = {
  ...baseStage,
  presets: [presetWithHighlights],
};

const stageWithEverything = {
  ...baseStage,
  presets: [presetWithEverything],
};

const stageWithMultiplePresets = {
  ...baseStage,
  presets: multiplePresets,
};

const stageWithFreeDraw = {
  ...baseStage,
  behaviours: {
    freeDraw: true,
  },
  presets: [singlePreset],
};

const stageWithRepositioning = {
  ...baseStage,
  behaviours: {
    allowRepositioning: true,
  },
  presets: [singlePreset],
};

const stageWithFreeDrawAndRepositioning = {
  ...baseStage,
  behaviours: {
    freeDraw: true,
    allowRepositioning: true,
  },
  presets: [presetWithEverything],
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

const meta: Meta<typeof Narrative> = {
  title: 'Interview/Interfaces/Narrative',
  component: Narrative,
  decorators: [ReduxDecorator],
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    stage: {
      control: 'object',
      description: 'Narrative stage configuration from protocol',
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
    nodes: createMockNodes(6, 'narrativeLayout1'),
    protocol: createMockProtocol(defaultStage),
    docs: {
      description: {
        story:
          'Basic Narrative with placed nodes and a single preset. No edges, groups, or highlights.',
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
        story: 'Narrative with no nodes in the network.',
      },
    },
  },
};

export const ConcentricCirclesBackground: Story = {
  args: {
    stage: stageWithConcentricCircles,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(8, 'narrativeLayout1'),
    protocol: createMockProtocol(stageWithConcentricCircles),
    docs: {
      description: {
        story:
          'Narrative with 4 concentric circles and skewed-toward-center distribution as background.',
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
    nodes: createMockNodes(6, 'narrativeLayout1'),
    edges: createMockEdges([
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 5],
      [4, 6],
      [5, 6],
    ]),
    protocol: createMockProtocol(stageWithEdges),
    docs: {
      description: {
        story:
          'Narrative displaying friendship edges between nodes. Edges can be toggled via the legend panel.',
      },
    },
  },
};

export const WithConvexHulls: Story = {
  args: {
    stage: stageWithGroups,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(10, 'narrativeLayout1', {
      groupVariable: 'community',
      groupValues: [[1], [1], [1], [2], [2], [2], [3], [3], [3], [1, 2]],
    }),
    protocol: createMockProtocol(stageWithGroups),
    docs: {
      description: {
        story:
          'Narrative with convex hull overlays grouping nodes by community. Node 10 belongs to two groups (Family and Work).',
      },
    },
  },
};

export const WithHighlighting: Story = {
  args: {
    stage: stageWithHighlights,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(8, 'narrativeLayout1', {
      highlightVariable: 'isClose',
      highlightValues: [true, false, true, null, true, false, true, false],
    }),
    protocol: createMockProtocol(stageWithHighlights),
    docs: {
      description: {
        story:
          'Narrative with highlight variables. The legend panel allows switching between "Close Friend" and "Trusted" attributes, and toggling highlighting on/off.',
      },
    },
  },
};

export const FullFeatured: Story = {
  args: {
    stage: stageWithEverything,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(10, 'narrativeLayout1', {
      highlightVariable: 'isClose',
      highlightValues: [
        true,
        false,
        true,
        null,
        true,
        false,
        true,
        false,
        null,
        true,
      ],
      groupVariable: 'community',
      groupValues: [[1], [1], [1], [2], [2], [2], [3], [3], [3], [1, 3]],
    }),
    edges: [
      ...createMockEdges(
        [
          [1, 2],
          [1, 3],
          [2, 3],
          [4, 5],
          [5, 6],
        ],
        'friendship',
      ),
      ...createMockEdges(
        [
          [4, 5],
          [4, 6],
          [7, 8],
        ],
        'professional',
      ),
    ],
    protocol: createMockProtocol(stageWithEverything),
    docs: {
      description: {
        story:
          'Narrative with all features enabled: edges (friendship and professional), convex hulls (community groups), and node highlighting (close friends). Open the legend panel to toggle each layer.',
      },
    },
  },
};

export const MultiplePresets: Story = {
  args: {
    stage: stageWithMultiplePresets,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: (() => {
      // Create nodes with both layout variables and group data
      const baseNodes = createMockNodes(10, 'narrativeLayout1', {
        highlightVariable: 'isClose',
        highlightValues: [
          true,
          false,
          true,
          null,
          true,
          false,
          true,
          false,
          null,
          true,
        ],
        groupVariable: 'community',
        groupValues: [[1], [1], [2], [2], [3], [3], [1, 3], [2], [1], [3]],
      });
      // Add second layout variable with different positions
      const alternatePositions = [
        { x: 0.8, y: 0.2 },
        { x: 0.7, y: 0.35 },
        { x: 0.6, y: 0.15 },
        { x: 0.3, y: 0.6 },
        { x: 0.2, y: 0.7 },
        { x: 0.4, y: 0.65 },
        { x: 0.5, y: 0.5 },
        { x: 0.15, y: 0.4 },
        { x: 0.85, y: 0.8 },
        { x: 0.75, y: 0.65 },
      ];
      return baseNodes.map((node, i) => ({
        ...node,
        [entityAttributesProperty]: {
          ...node[entityAttributesProperty],
          narrativeLayout2: alternatePositions[i],
          isTrusted: i % 3 === 0 ? true : i % 3 === 1 ? false : null,
        },
      }));
    })(),
    edges: [
      ...createMockEdges(
        [
          [1, 2],
          [2, 3],
          [3, 4],
          [5, 6],
          [7, 8],
        ],
        'friendship',
      ),
      ...createMockEdges(
        [
          [1, 4],
          [2, 5],
          [6, 9],
          [7, 10],
        ],
        'professional',
      ),
    ],
    protocol: createMockProtocol(stageWithMultiplePresets),
    docs: {
      description: {
        story:
          'Narrative with three presets: "Social View" (friendship edges + community hulls + close friends), "Professional View" (professional edges + trusted highlighting with alternate layout), and "Community Map" (community hulls only). Use the arrow buttons to switch between presets.',
      },
    },
  },
};

export const WithFreeDraw: Story = {
  args: {
    stage: stageWithFreeDraw,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(5, 'narrativeLayout1'),
    protocol: createMockProtocol(stageWithFreeDraw),
    docs: {
      description: {
        story:
          'Narrative with free-draw annotations enabled. Click and drag on the canvas to draw. Lines fade after release. Use the snowflake button to freeze annotations, and the reset button to clear them.',
      },
    },
  },
};

export const WithRepositioning: Story = {
  args: {
    stage: stageWithRepositioning,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(6, 'narrativeLayout1'),
    protocol: createMockProtocol(stageWithRepositioning),
    docs: {
      description: {
        story:
          'Narrative with node repositioning enabled. Drag nodes to move them. Changes persist to the session data.',
      },
    },
  },
};

export const AllBehaviours: Story = {
  args: {
    stage: stageWithFreeDrawAndRepositioning,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(10, 'narrativeLayout1', {
      highlightVariable: 'isClose',
      highlightValues: [
        true,
        false,
        true,
        null,
        true,
        false,
        true,
        false,
        null,
        true,
      ],
      groupVariable: 'community',
      groupValues: [[1], [1], [1], [2], [2], [2], [3], [3], [3], [1, 2]],
    }),
    edges: [
      ...createMockEdges(
        [
          [1, 2],
          [1, 3],
          [4, 5],
          [5, 6],
          [7, 8],
          [8, 9],
        ],
        'friendship',
      ),
      ...createMockEdges(
        [
          [1, 4],
          [4, 7],
          [2, 5],
        ],
        'professional',
      ),
    ],
    protocol: createMockProtocol(stageWithFreeDrawAndRepositioning),
    docs: {
      description: {
        story:
          'Narrative with all behaviours and features enabled: free-draw annotations, node repositioning, edges, convex hulls, and highlighting. This is the most feature-rich configuration possible.',
      },
    },
  },
};

export const ManyNodes: Story = {
  args: {
    stage: stageWithEverything,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(15, 'narrativeLayout1', {
      highlightVariable: 'isClose',
      highlightValues: Array.from({ length: 15 }, (_, i) =>
        i % 3 === 0 ? true : i % 3 === 1 ? false : null,
      ),
      groupVariable: 'community',
      groupValues: Array.from({ length: 15 }, (_, i) => [(i % 4) + 1]),
    }),
    edges: [
      ...createMockEdges(
        [
          [1, 2],
          [2, 3],
          [3, 4],
          [4, 5],
          [5, 6],
          [6, 7],
          [7, 8],
          [8, 9],
          [9, 10],
          [10, 11],
          [1, 6],
          [3, 8],
          [5, 10],
        ],
        'friendship',
      ),
      ...createMockEdges(
        [
          [1, 5],
          [2, 9],
          [4, 12],
          [7, 15],
        ],
        'professional',
      ),
    ],
    protocol: createMockProtocol(stageWithEverything),
    docs: {
      description: {
        story:
          'Narrative with 15 nodes to test layout density, edge rendering, and convex hull performance with a larger network.',
      },
    },
  },
};

export const SingleNodeGroups: Story = {
  args: {
    stage: stageWithGroups,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(4, 'narrativeLayout1', {
      groupVariable: 'community',
      groupValues: [[1], [2], [3], [4]],
    }),
    protocol: createMockProtocol(stageWithGroups),
    docs: {
      description: {
        story:
          'Narrative where each node is in its own group, testing the single-node convex hull rendering (drawn as small circles).',
      },
    },
  },
};

export const TwoNodeGroup: Story = {
  args: {
    stage: stageWithGroups,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockGetNavigationHelpers,
  },
  parameters: {
    nodes: createMockNodes(4, 'narrativeLayout1', {
      groupVariable: 'community',
      groupValues: [[1], [1], [2], [2]],
    }),
    protocol: createMockProtocol(stageWithGroups),
    docs: {
      description: {
        story:
          'Narrative with two groups of two nodes each, testing the two-node convex hull rendering (drawn as capsule shapes).',
      },
    },
  },
};

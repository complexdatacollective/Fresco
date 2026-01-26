'use client';

import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Provider } from 'react-redux';
import DyadCensus from './DyadCensus';

const mockProtocol = {
  name: 'Dyad Census Protocol',
  codebook: {
    node: {
      person: {
        name: 'Person',
        displayVariable: 'name',
        iconVariant: 'add-a-person',
        color: 'node-color-seq-1',
        variables: {
          name: {
            name: 'Name',
            type: 'text',
          },
        },
      },
    },
    edge: {
      knows: {
        name: 'Knows',
        color: 'edge-color-seq-1',
      },
    },
  },
  stages: [
    {
      id: 'dyad-census-stage',
      type: 'DyadCensus',
      label: 'Dyad Census',
      introductionPanel: {
        title: 'Network Relationships',
        text: 'In this section, you will be asked about relationships between people in your network. For each pair of people, please indicate whether they know each other.',
      },
      subject: {
        entity: 'edge',
        type: 'knows',
      },
      prompts: [
        {
          id: 'prompt-1',
          text: 'Do these two people know each other?',
          createEdge: 'knows',
        },
      ],
    },
  ],
};

const createMockStore = (
  nodes: unknown[] = [],
  edges: unknown[] = [],
  overrides: Record<string, unknown> = {},
) => {
  const mockProtocolState = {
    id: 'test-protocol-id',
    codebook: mockProtocol.codebook,
    stages: mockProtocol.stages,
    assets: [],
  };

  const mockSessionState = {
    id: 'test-session',
    currentStep: 0,
    startTime: new Date().toISOString(),
    finishTime: null,
    exportTime: null,
    lastUpdated: new Date().toISOString(),
    network: {
      nodes,
      edges,
      ego: {
        [entityAttributesProperty]: {},
      },
    },
  };

  return configureStore({
    reducer: {
      session: (state: unknown = mockSessionState): unknown => state,
      protocol: (state: unknown = mockProtocolState): unknown => state,
      form: (state: unknown = {}): unknown => state,
      ui: (state: unknown = {}): unknown => state,
    },
    preloadedState: {
      protocol: mockProtocolState,
      session: mockSessionState,
      ...overrides,
    },
  });
};

const ReduxDecorator = (
  Story: React.ComponentType,
  context: {
    parameters?: {
      nodes?: unknown[];
      edges?: unknown[];
      reduxState?: unknown;
    };
  },
) => {
  const store = createMockStore(
    context.parameters?.nodes ?? [],
    context.parameters?.edges ?? [],
    context.parameters?.reduxState as Record<string, unknown> | undefined,
  );
  return (
    <Provider store={store}>
      <div className="h-screen w-screen">
        <Story />
      </div>
    </Provider>
  );
};

const mockNavigationHelpers = () => ({
  moveForward: () => {
    // Mock navigation function
  },
  moveBackward: () => {
    // Mock navigation function
  },
});

const mockRegisterBeforeNext = () => {
  // Mock registration function
};

const meta: Meta<typeof DyadCensus> = {
  title: 'Interview/Interfaces/DyadCensus',
  component: DyadCensus,
  decorators: [ReduxDecorator],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    stage: {
      control: 'object',
      description: 'Stage configuration from protocol',
    },
    registerBeforeNext: {
      action: 'register-before-next',
      description: 'Callback to register navigation guard',
    },
    getNavigationHelpers: {
      action: 'get-navigation-helpers',
      description: 'Returns navigation helper functions',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Introduction: Story = {
  args: {
    // @ts-expect-error - mock stage type
    stage: mockProtocol.stages[0],
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockNavigationHelpers,
  },
  parameters: {
    nodes: [],
    edges: [],
    docs: {
      description: {
        story:
          'Shows the introduction panel before the dyad census begins. This is the initial state when the stage loads.',
      },
    },
  },
};

const mockNodes = [
  {
    [entityPrimaryKeyProperty]: 'node-1',
    type: 'person',
    [entityAttributesProperty]: {
      name: 'Alice',
    },
  },
  {
    [entityPrimaryKeyProperty]: 'node-2',
    type: 'person',
    [entityAttributesProperty]: {
      name: 'Bob',
    },
  },
  {
    [entityPrimaryKeyProperty]: 'node-3',
    type: 'person',
    [entityAttributesProperty]: {
      name: 'Charlie',
    },
  },
];

export const WithNodePairs: Story = {
  args: {
    // @ts-expect-error - mock stage type
    stage: mockProtocol.stages[0],
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockNavigationHelpers,
  },
  parameters: {
    nodes: mockNodes,
    edges: [],
    docs: {
      description: {
        story:
          'Shows the dyad census interface with node pairs. Three nodes create three pairs: Alice-Bob, Alice-Charlie, and Bob-Charlie. Users can answer Yes or No for each pair.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for introduction to load', async () => {
      await waitFor(() => {
        const element = canvas.getByText('Network Relationships');
        void expect(element).toBeInTheDocument();
      });
    });

    await step('Verify introduction text is displayed', async () => {
      const introText = canvas.getByText(/For each pair of people/i);
      void expect(introText).toBeInTheDocument();
    });
  },
};

export const WithExistingEdges: Story = {
  args: {
    // @ts-expect-error - mock stage type
    stage: mockProtocol.stages[0],
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockNavigationHelpers,
  },
  parameters: {
    nodes: mockNodes,
    edges: [
      {
        [entityPrimaryKeyProperty]: 'edge-1',
        type: 'knows',
        from: 'node-1',
        to: 'node-2',
      },
    ],
    docs: {
      description: {
        story:
          'Shows the dyad census with an existing edge. The edge between Alice and Bob is already established, so it will be displayed visually.',
      },
    },
  },
};

export const EmptyNetwork: Story = {
  args: {
    // @ts-expect-error - mock stage type
    stage: mockProtocol.stages[0],
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockNavigationHelpers,
  },
  parameters: {
    nodes: [],
    edges: [],
    docs: {
      description: {
        story:
          'Shows the interface when there are no nodes in the network. The interface shows the introduction and would automatically advance when clicking next.',
      },
    },
  },
};

export const TwoNodes: Story = {
  args: {
    // @ts-expect-error - mock stage type
    stage: mockProtocol.stages[0],
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockNavigationHelpers,
  },
  parameters: {
    nodes: [mockNodes[0], mockNodes[1]],
    edges: [],
    docs: {
      description: {
        story:
          'Shows the interface with only two nodes, resulting in a single pair to evaluate.',
      },
    },
  },
};

const manyNodes = Array.from({ length: 5 }, (_, i) => ({
  [entityPrimaryKeyProperty]: `node-${i + 1}`,
  type: 'person',
  [entityAttributesProperty]: {
    name: `Person ${i + 1}`,
  },
}));

export const ManyPairs: Story = {
  args: {
    // @ts-expect-error - mock stage type
    stage: mockProtocol.stages[0],
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: mockNavigationHelpers,
  },
  parameters: {
    nodes: manyNodes,
    edges: [],
    docs: {
      description: {
        story:
          'Shows the interface with 5 nodes, creating 10 unique pairs (n*(n-1)/2 where n=5). This demonstrates how the interface handles larger networks.',
      },
    },
  },
};

'use client';

import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcNode,
} from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { motion } from 'motion/react';
import { Provider } from 'react-redux';
import TieStrengthCensus from './TieStrengthCensus';

const mockProtocol = {
  id: 'test-protocol',
  codebook: {
    node: {
      person: {
        name: 'Person',
        color: 'node-color-seq-1',
        displayVariable: 'name',
        variables: {
          name: {
            name: 'Name',
            type: 'text',
          },
        },
      },
    },
    edge: {
      friendship: {
        name: 'Friendship',
        color: 'edge-color-seq-1',
        variables: {
          strength: {
            name: 'Strength',
            type: 'ordinal',
            options: [
              { label: 'Weak', value: 1 },
              { label: 'Moderate', value: 2 },
              { label: 'Strong', value: 3 },
            ],
          },
        },
      },
    },
  },
  stages: [
    {
      id: 'tie-strength-stage',
      type: 'TieStrengthCensus',
      label: 'Rate Friendships',
      subject: {
        entity: 'edge',
        type: 'friendship',
      },
      introductionPanel: {
        title: 'Rate Your Friendships',
        text: 'In this stage, you will be shown pairs of people from your network. For each pair, please indicate the strength of their friendship.',
      },
      prompts: [
        {
          id: 'prompt-1',
          text: 'How strong is the friendship between these two people?',
          createEdge: 'friendship',
          edgeVariable: 'strength',
          negativeLabel: 'No Friendship',
        },
      ],
    },
  ],
};

const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

const createMockNodes = (count: number): NcNode[] => {
  return Array.from({ length: count }, (_, i) => ({
    [entityPrimaryKeyProperty]: `node-${i + 1}`,
    type: 'person',
    stageId: 'tie-strength-stage',
    [entityAttributesProperty]: {
      name: names[i % names.length] ?? 'Unknown',
    },
  }));
};

const createMockEdges = (
  pairs: [number, number, number | null][],
): NcEdge[] => {
  return pairs.map(([from, to, strength], i) => ({
    [entityPrimaryKeyProperty]: `edge-${i + 1}`,
    type: 'friendship',
    from: `node-${from}`,
    to: `node-${to}`,
    [entityAttributesProperty]: {
      ...(strength !== null && { strength }),
    },
  }));
};

const createMockSession = (nodes: NcNode[], edges: NcEdge[]) => ({
  id: 'test-session',
  currentStep: 0,
  promptIndex: 0,
  network: {
    nodes,
    edges,
    ego: {
      [entityPrimaryKeyProperty]: 'ego-1',
      [entityAttributesProperty]: {},
    },
  },
  stageMetadata: [],
});

const mockUiState = {
  passphrase: null as string | null,
  passphraseInvalid: false,
  showPassphrasePrompter: false,
};

const createMockStore = (nodes: NcNode[], edges: NcEdge[]) => {
  const session = createMockSession(nodes, edges);
  return configureStore({
    reducer: {
      session: (state: typeof session = session) => state,
      protocol: (state: typeof mockProtocol = mockProtocol) => state,
      ui: (state: typeof mockUiState = mockUiState) => state,
    },
    preloadedState: {
      protocol: mockProtocol,
      session,
      ui: mockUiState,
    },
  });
};

type DecoratorProps = {
  nodes: NcNode[];
  edges?: NcEdge[];
};

function ReduxDecoratorFactory({ nodes, edges = [] }: DecoratorProps) {
  return function ReduxDecorator(Story: React.ComponentType) {
    const store = createMockStore(nodes, edges);

    const decoratorVariants = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };

    return (
      <Provider store={store}>
        <motion.div
          variants={decoratorVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="flex h-[600px] gap-4 p-4">
            <Story />
          </div>
        </motion.div>
      </Provider>
    );
  };
}

const mockStage = mockProtocol.stages[0] as unknown as Parameters<
  typeof TieStrengthCensus
>[0]['stage'];

const mockNavigationHelpers = {
  moveForward: () => {
    // eslint-disable-next-line no-console
    console.log('Move forward');
  },
  moveBackward: () => {
    // eslint-disable-next-line no-console
    console.log('Move backward');
  },
};

const mockRegisterBeforeNext = () => {
  // Mock implementation
};

const meta: Meta<typeof TieStrengthCensus> = {
  title: 'Interview/Interfaces/TieStrengthCensus',
  component: TieStrengthCensus,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    stage: {
      control: false,
      description: 'Stage configuration object',
    },
    registerBeforeNext: {
      control: false,
      description: 'Function to register before next navigation',
    },
    getNavigationHelpers: {
      control: false,
      description: 'Function to get navigation helpers',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Introduction: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: () => mockNavigationHelpers,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(3),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Shows the introduction panel before starting the tie strength census.',
      },
    },
  },
};

export const ThreeNodes: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: () => mockNavigationHelpers,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(3),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'TieStrengthCensus with 3 nodes (3 possible pairs: Alice-Bob, Alice-Charlie, Bob-Charlie).',
      },
    },
  },
};

export const FiveNodes: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: () => mockNavigationHelpers,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(5),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'TieStrengthCensus with 5 nodes (10 possible pairs). Shows how the interface handles more complex networks.',
      },
    },
  },
};

export const WithExistingEdges: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: () => mockNavigationHelpers,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(4),
      edges: createMockEdges([
        [1, 2, 3],
        [2, 3, 1],
      ]),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'TieStrengthCensus with some edges already created. The interface should show existing edges and allow updating them.',
      },
    },
  },
};

export const NoNodes: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: () => mockNavigationHelpers,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(0),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'TieStrengthCensus with no nodes. The interface should handle this gracefully.',
      },
    },
  },
};

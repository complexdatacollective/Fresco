'use client';

import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { motion } from 'motion/react';
import { Provider } from 'react-redux';
import { DndStoreProvider } from '~/lib/dnd';
import NameGeneratorRoster from './NameGeneratorRoster';

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
          age: {
            name: 'Age',
            type: 'number',
          },
          location: {
            name: 'Location',
            type: 'text',
          },
        },
      },
    },
  },
  stages: [
    {
      id: 'roster-stage',
      type: 'NameGeneratorRoster',
      label: 'Select People',
      subject: {
        entity: 'node',
        type: 'person',
      },
      dataSource: 'externalData',
      prompts: [
        {
          id: 'prompt-1',
          text: 'Please select people you know from this list.',
        },
      ],
      cardOptions: {
        displayLabel: 'name',
        additionalProperties: [
          { label: 'Age', variable: 'age' },
          { label: 'Location', variable: 'location' },
        ],
      },
    },
  ],
  experiments: {
    encryptedVariables: false,
  },
  assets: [
    {
      assetId: 'externalData',
      name: 'External Data',
      type: 'network',
      url: '/mock-data.json',
    },
  ],
};

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
];

const createMockNodes = (count: number, selected = 0): NcNode[] => {
  return Array.from({ length: count }, (_, i) => ({
    [entityPrimaryKeyProperty]: `node-${i + 1}`,
    type: 'person',
    stageId: i < selected ? 'roster-stage' : undefined,
    [entityAttributesProperty]: {
      name: names[i % names.length] ?? 'Unknown',
      age: 20 + Math.floor(Math.random() * 40),
      location: locations[i % locations.length] ?? 'Unknown',
    },
  }));
};

const createMockSession = (nodes: NcNode[]) => ({
  id: 'test-session',
  currentStep: 0,
  promptIndex: 0,
  network: {
    nodes,
    edges: [],
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

const createMockStore = (nodes: NcNode[]) => {
  const session = createMockSession(nodes);
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
};

function ReduxDecoratorFactory({ nodes }: DecoratorProps) {
  return function ReduxDecorator(Story: React.ComponentType) {
    const store = createMockStore(nodes);

    const decoratorVariants = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };

    return (
      <Provider store={store}>
        <DndStoreProvider>
          <motion.div
            variants={decoratorVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-screen w-screen"
          >
            <Story />
          </motion.div>
        </DndStoreProvider>
      </Provider>
    );
  };
}

const mockStage = mockProtocol.stages[0] as unknown as Parameters<
  typeof NameGeneratorRoster
>[0]['stage'];

const meta: Meta<typeof NameGeneratorRoster> = {
  title: 'Interview/Interfaces/NameGeneratorRoster',
  component: NameGeneratorRoster,
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
      description:
        'Function to register validation before moving to next stage',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: () => () => Promise.resolve(true),
  },
  decorators: [ReduxDecoratorFactory({ nodes: createMockNodes(0) })],
  parameters: {
    docs: {
      description: {
        story:
          'NameGeneratorRoster with no external data available. Shows empty state.',
      },
    },
  },
};

export const WithAvailableNodes: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: () => () => Promise.resolve(true),
  },
  decorators: [ReduxDecoratorFactory({ nodes: createMockNodes(10, 0) })],
  parameters: {
    docs: {
      description: {
        story:
          'NameGeneratorRoster with available nodes from external data source. Users can drag nodes from the left panel to add them to the interview.',
      },
    },
  },
};

export const WithSelectedNodes: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: () => () => Promise.resolve(true),
  },
  decorators: [ReduxDecoratorFactory({ nodes: createMockNodes(10, 5) })],
  parameters: {
    docs: {
      description: {
        story:
          'NameGeneratorRoster with some nodes already added to the interview. Selected nodes appear in the "Added" panel on the right.',
      },
    },
  },
};

export const WithManyNodes: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: () => () => Promise.resolve(true),
  },
  decorators: [ReduxDecoratorFactory({ nodes: createMockNodes(30, 8) })],
  parameters: {
    docs: {
      description: {
        story:
          'NameGeneratorRoster with a large dataset to demonstrate search and scrolling behavior.',
      },
    },
  },
};

export const AllNodesSelected: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: () => () => Promise.resolve(true),
  },
  decorators: [ReduxDecoratorFactory({ nodes: createMockNodes(10, 10) })],
  parameters: {
    docs: {
      description: {
        story:
          'NameGeneratorRoster with all available nodes already selected. The available list should be empty.',
      },
    },
  },
};

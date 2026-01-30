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
import { expect, waitFor, within } from 'storybook/test';
import { DndStoreProvider } from '~/lib/dnd';
import OrdinalBins from './components/OrdinalBins';
import { type OrdinalBinPrompt } from './useOrdinalBins';

const ordinalOptions = [
  { label: 'Strongly Disagree', value: 1 },
  { label: 'Disagree', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: 'Agree', value: 4 },
  { label: 'Strongly Agree', value: 5 },
];

const frequencyOptions = [
  { label: 'Never', value: -1 },
  { label: 'Rarely', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Often', value: 3 },
  { label: 'Very Often', value: 4 },
  { label: 'Always', value: 5 },
];

const yesNoOptions = [
  { label: 'No', value: 1 },
  { label: 'Yes', value: 2 },
];

const mockStageConfig = {
  id: 'ordinal-stage',
  type: 'OrdinalBin',
  label: 'Rate Agreement',
  subject: {
    entity: 'node',
    type: 'person',
  },
  prompts: [
    {
      id: 'prompt-1',
      text: 'How much do you agree with each person?',
      variable: 'agreement',
    },
  ],
};

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
          agreement: {
            name: 'Agreement',
            type: 'ordinal',
            options: ordinalOptions,
          },
          frequency: {
            name: 'Frequency',
            type: 'ordinal',
            options: frequencyOptions,
          },
          yesNo: {
            name: 'Yes/No',
            type: 'ordinal',
            options: yesNoOptions,
          },
        },
      },
    },
  },
  stages: [mockStageConfig],
  experiments: {
    encryptedVariables: false,
  },
  assets: [],
};

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
  variableName = 'agreement',
  values: (number | null)[] = [],
): NcNode[] => {
  return Array.from({ length: count }, (_, i) => ({
    [entityPrimaryKeyProperty]: `node-${i + 1}`,
    type: 'person',
    stageId: 'ordinal-stage',
    [entityAttributesProperty]: {
      name: names[i % names.length] ?? 'Unknown',
      [variableName]: values[i] ?? null,
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

const createMockStore = (
  nodes: NcNode[],
  protocol: typeof mockProtocol = mockProtocol,
) => {
  const session = createMockSession(nodes);
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

type DecoratorProps = {
  nodes: NcNode[];
  protocol?: typeof mockProtocol;
};

function ReduxDecoratorFactory({ nodes, protocol }: DecoratorProps) {
  return function ReduxDecorator(Story: React.ComponentType) {
    const store = createMockStore(nodes, protocol);

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
          >
            <div className="flex h-[500px] gap-4 p-4">
              <Story />
            </div>
          </motion.div>
        </DndStoreProvider>
      </Provider>
    );
  };
}

const createProtocolWithVariable = (variable: string, promptText: string) => ({
  ...mockProtocol,
  stages: [
    {
      ...mockStageConfig,
      prompts: [
        {
          id: 'prompt-1',
          text: promptText,
          variable,
        },
      ],
    },
  ],
});

const mockStage = mockProtocol.stages[0] as unknown as Parameters<
  typeof OrdinalBins
>[0]['stage'];

const mockPrompt: OrdinalBinPrompt = {
  id: 'prompt-1',
  text: 'How much do you agree with each person?',
  color: 'ord-color-seq-1',
};

const meta: Meta<typeof OrdinalBins> = {
  title: 'Interview/Interfaces/OrdinalBin',
  component: OrdinalBins,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    stage: {
      control: false,
      description: 'Stage configuration object',
    },
    prompt: {
      control: false,
      description: 'Prompt configuration object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    stage: mockStage,
    prompt: mockPrompt,
  },
  decorators: [ReduxDecoratorFactory({ nodes: createMockNodes(0) })],
  parameters: {
    docs: {
      description: {
        story: 'OrdinalBins with no nodes assigned to any bin.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const allBinLabels = [
      'Strongly Disagree',
      'Disagree',
      'Neutral',
      'Agree',
      'Strongly Agree',
    ];

    for (const label of allBinLabels) {
      await waitFor(() => {
        void expect(canvas.getByText(label)).toBeInTheDocument();
      });
    }
  },
};

export const WithDistributedNodes: Story = {
  args: {
    stage: mockStage,
    prompt: mockPrompt,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(8, 'agreement', [1, 2, 3, 4, 5, 1, 2, 3]),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: 'OrdinalBins with nodes distributed across different bins.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      void expect(canvas.getByText('Strongly Disagree')).toBeInTheDocument();
    });
    await waitFor(() => {
      void expect(canvas.getByText('Disagree')).toBeInTheDocument();
    });
    await waitFor(() => {
      void expect(canvas.getByText('Neutral')).toBeInTheDocument();
    });
    await waitFor(() => {
      void expect(canvas.getByText('Agree')).toBeInTheDocument();
    });
    await waitFor(() => {
      void expect(canvas.getByText('Strongly Agree')).toBeInTheDocument();
    });

    // Alice (value 1) and Frank (value 1) share the "Strongly Disagree" bin
    await waitFor(() => {
      void expect(canvas.getByText('Alice')).toBeInTheDocument();
    });
    await waitFor(() => {
      void expect(canvas.getByText('Frank')).toBeInTheDocument();
    });
  },
};

export const AllInOneBin: Story = {
  args: {
    stage: mockStage,
    prompt: mockPrompt,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(5, 'agreement', [3, 3, 3, 3, 3]),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: 'OrdinalBins with all nodes in the Neutral bin.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      void expect(canvas.getByText('Neutral')).toBeInTheDocument();
    });

    await waitFor(() => {
      const aliceNodes = canvas.getAllByText('Alice');
      void expect(aliceNodes.length).toBeGreaterThan(0);
    });
  },
};

export const UnassignedNodes: Story = {
  args: {
    stage: mockStage,
    prompt: mockPrompt,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(6, 'agreement', [null, null, 1, 5, null, 3]),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'OrdinalBins with some nodes having no value assigned (null). These would typically be in the bucket waiting to be sorted.',
      },
    },
  },
};

export const WithMissingValueBin: Story = {
  args: {
    stage: {
      ...mockStage,
      prompts: [
        {
          id: 'prompt-1',
          text: 'How often do you see each person?',
          variable: 'frequency',
        },
      ],
    } as typeof mockStage,
    prompt: {
      ...mockPrompt,
      id: 'prompt-1',
    },
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(6, 'frequency', [-1, 1, 2, 3, 4, 5]),
      protocol: createProtocolWithVariable(
        'frequency',
        'How often do you see each person?',
      ),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'OrdinalBins with a negative value option ("Never" = -1) which displays with special styling.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      void expect(canvas.getByText('Never')).toBeInTheDocument();
    });
    await waitFor(() => {
      void expect(canvas.getByText('Rarely')).toBeInTheDocument();
    });
    await waitFor(() => {
      void expect(canvas.getByText('Always')).toBeInTheDocument();
    });

    await waitFor(() => {
      void expect(canvas.getByText('Alice')).toBeInTheDocument();
    });
  },
};

export const CustomColor: Story = {
  args: {
    stage: mockStage,
    prompt: {
      ...mockPrompt,
      color: 'cat-color-seq-3',
    },
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(5, 'agreement', [1, 2, 3, 4, 5]),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: 'OrdinalBins with a custom color applied to the bins.',
      },
    },
  },
};

export const ManyNodes: Story = {
  args: {
    stage: mockStage,
    prompt: mockPrompt,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(10, 'agreement', [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'OrdinalBins with many nodes to demonstrate how multiple nodes appear in each bin.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const allBinLabels = [
      'Strongly Disagree',
      'Disagree',
      'Neutral',
      'Agree',
      'Strongly Agree',
    ];

    for (const label of allBinLabels) {
      await waitFor(() => {
        void expect(canvas.getByText(label)).toBeInTheDocument();
      });
    }

    // Alice (value 1) and Bob (value 1) share the "Strongly Disagree" bin
    await waitFor(() => {
      void expect(canvas.getByText('Alice')).toBeInTheDocument();
    });
    await waitFor(() => {
      void expect(canvas.getByText('Bob')).toBeInTheDocument();
    });
  },
};

export const SkewedDistribution: Story = {
  args: {
    stage: mockStage,
    prompt: mockPrompt,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(
        12,
        'agreement',
        [5, 5, 5, 5, 5, 4, 4, 3, 2, 1, 1, 1],
      ),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'OrdinalBins with nodes heavily skewed toward the Strongly Agree end of the scale.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      void expect(canvas.getByText('Strongly Agree')).toBeInTheDocument();
    });

    await waitFor(() => {
      const aliceNodes = canvas.getAllByText('Alice');
      void expect(aliceNodes.length).toBeGreaterThan(0);
    });
  },
};

export const TwoBinScale: Story = {
  args: {
    stage: {
      ...mockStage,
      prompts: [
        {
          id: 'prompt-1',
          text: 'Do you work with this person?',
          variable: 'yesNo',
        },
      ],
    } as typeof mockStage,
    prompt: {
      ...mockPrompt,
      id: 'prompt-1',
    },
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(6, 'yesNo', [1, 1, 1, 2, 2, 2]),
      protocol: createProtocolWithVariable(
        'yesNo',
        'Do you work with this person?',
      ),
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'OrdinalBins with only two bins for a binary choice (e.g., Yes/No).',
      },
    },
  },
};

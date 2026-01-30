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
import FamilyTreeCensus from './FamilyTreeCensus';

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
          sex: {
            name: 'Sex',
            type: 'categorical',
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
            ],
          },
          age: {
            name: 'Age',
            type: 'number',
          },
          hasDisease: {
            name: 'Has Disease',
            type: 'boolean',
          },
        },
      },
    },
    edge: {
      family: {
        name: 'Family',
        color: 'edge-color-seq-1',
        variables: {
          relationship: {
            name: 'Relationship',
            type: 'categorical',
            options: [
              { label: 'Parent', value: 'parent' },
              { label: 'Child', value: 'child' },
              { label: 'Sibling', value: 'sibling' },
              { label: 'Partner', value: 'partner' },
            ],
          },
        },
      },
    },
    ego: {
      variables: {
        sex: {
          name: 'Sex',
          type: 'categorical',
          options: [
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
          ],
        },
      },
    },
  },
  stages: [
    {
      id: 'family-tree-stage',
      type: 'FamilyTreeCensus',
      label: 'Family Tree',
      subject: {
        entity: 'node',
        type: 'person',
      },
      edgeType: {
        type: 'family',
      },
      nodeSexVariable: 'sex',
      egoSexVariable: 'sex',
      edgeRelationshipVariable: 'relationship',
      relationshipToEgoVariable: 'relationshipToEgo',
      nodeIsEgoVariable: 'isEgo',
      scaffoldingStep: {
        text: 'Please create your family tree by adding family members.',
      },
      nameGenerationStep: {
        text: 'Please provide information for each family member.',
        form: {
          title: 'Family Member Information',
          fields: [
            {
              variable: 'name',
              prompt: 'Name',
              component: 'Text',
            },
            {
              variable: 'age',
              prompt: 'Age',
              component: 'Number',
            },
          ],
        },
      },
      diseaseNominationStep: [
        {
          text: 'Which family members have the disease?',
          variable: 'hasDisease',
        },
      ],
    },
  ],
};

const createMockNodes = (count: number): NcNode[] => {
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
  return Array.from({ length: count }, (_, i) => ({
    [entityPrimaryKeyProperty]: `node-${i + 1}`,
    type: 'person',
    stageId: 'family-tree-stage',
    [entityAttributesProperty]: {
      name: names[i % names.length] ?? 'Unknown',
      age: 30 + i * 5,
      sex: i % 2 === 0 ? 'female' : 'male',
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
      [entityAttributesProperty]: {
        sex: 'female',
      },
    },
  },
  stageMetadata: {
    0: {
      hasSeenScaffoldPrompt: true,
      nodes: nodes.map((node, i) => ({
        interviewNetworkId: node[entityPrimaryKeyProperty],
        label: (node[entityAttributesProperty].name as string) ?? '',
        sex:
          (node[entityAttributesProperty].sex as 'male' | 'female') ?? 'female',
        isEgo: i === 0,
        readOnly: false,
      })),
    },
  },
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
          <div className="flex h-[800px] gap-4 p-4">
            <Story />
          </div>
        </motion.div>
      </Provider>
    );
  };
}

const mockStage = mockProtocol.stages[0] as unknown as Parameters<
  typeof FamilyTreeCensus
>[0]['stage'];

const mockRegisterBeforeNext = () => {
  // Mock implementation
};

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

const meta: Meta<typeof FamilyTreeCensus> = {
  title: 'Interview/Interfaces/FamilyTreeCensus',
  component: FamilyTreeCensus,
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

export const EmptyTree: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: () => mockNavigationHelpers,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: [],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Shows the initial state with no family members. The census form should appear.',
      },
    },
  },
};

export const ScaffoldingStep: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: () => mockNavigationHelpers,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(2),
      edges: [],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Step 1: Scaffolding step where users add family members to create the tree structure.',
      },
    },
  },
};

export const NameGenerationStep: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: () => mockNavigationHelpers,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(4),
      edges: [],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Step 2: Name generation step where users fill in information for each family member.',
      },
    },
  },
};

export const DiseaseNominationStep: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: () => mockNavigationHelpers,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(5),
      edges: [],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Step 3: Disease nomination step where users select which family members have the disease.',
      },
    },
  },
};

export const LargeFamily: Story = {
  args: {
    stage: mockStage,
    registerBeforeNext: mockRegisterBeforeNext,
    getNavigationHelpers: () => mockNavigationHelpers,
  },
  decorators: [
    ReduxDecoratorFactory({
      nodes: createMockNodes(6),
      edges: [],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Shows a larger family tree with multiple family members (relationships tested in unit tests).',
      },
    },
  },
};

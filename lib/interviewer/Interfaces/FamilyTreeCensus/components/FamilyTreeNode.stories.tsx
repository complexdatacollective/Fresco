import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Provider } from 'react-redux';
import FamilyTreeNode from './FamilyTreeNode';

// Mock protocol with a Person node type
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
          },
        },
      },
    },
  },
  stages: [],
  experiments: {
    encryptedVariables: false,
  },
  assets: [],
};

const mockSession = {
  id: 'test-session',
  currentStep: 0,
  promptIndex: 0,
  network: {
    nodes: [],
    edges: [],
    ego: {
      [entityAttributesProperty]: {},
    },
  },
};

const mockUiState = {
  passphrase: null as string | null,
  passphraseInvalid: false,
  showPassphrasePrompter: false,
};

const createMockStore = () => {
  return configureStore({
    reducer: {
      session: (state: typeof mockSession = mockSession) => state,
      protocol: (state: typeof mockProtocol = mockProtocol) => state,
      ui: (state: typeof mockUiState = mockUiState) => state,
    },
    preloadedState: {
      protocol: mockProtocol,
      session: mockSession,
      ui: mockUiState,
    },
  });
};

const ReduxDecorator = (Story: React.ComponentType) => {
  const store = createMockStore();
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
};

// Helper to create mock NcNode
const createMockNetworkNode = (name: string): NcNode => ({
  [entityPrimaryKeyProperty]: `node-${name}`,
  type: 'person',
  [entityAttributesProperty]: {
    name,
  },
});

// Container for positioning nodes in stories
const NodeContainer = ({ children }: { children: React.ReactNode }) => (
  <div
    className="relative"
    style={{
      width: 150,
      height: 200,
    }}
  >
    {children}
  </div>
);

const meta: Meta<typeof FamilyTreeNode> = {
  title: 'Interview/Interfaces/FamilyTreeCensus/FamilyTreeNode',
  component: FamilyTreeNode,
  decorators: [ReduxDecorator],
  parameters: {
    layout: 'centered',
    forceTheme: 'interview',
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Relationship label (e.g., "Father", "Mother")',
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
      description: 'Node shape (circle = female, square = male)',
    },
    isEgo: {
      control: 'boolean',
      description: 'Whether this is the ego (self) node',
    },
    selected: {
      control: 'boolean',
      description: 'Whether the node is selected',
    },
    allowDrag: {
      control: 'boolean',
      description: 'Whether dragging is enabled',
    },
  },
  args: {
    placeholderId: 'placeholder-1',
    allowDrag: false,
  },
};

export default meta;
type Story = StoryObj<typeof FamilyTreeNode>;

/**
 * Unfilled male node (square shape) showing relationship label below.
 */
export const UnfilledMale: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    label: 'Father',
    shape: 'square',
    isEgo: false,
  },
};

/**
 * Unfilled female node (circle shape) showing relationship label below.
 */
export const UnfilledFemale: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    label: 'Mother',
    shape: 'circle',
    isEgo: false,
  },
};

/**
 * Filled male node with name inside and relationship label below.
 */
export const FilledMale: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    label: 'Father',
    shape: 'square',
    isEgo: false,
    networkNode: createMockNetworkNode('John'),
  },
};

/**
 * Filled female node with name inside and relationship label below.
 */
export const FilledFemale: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    label: 'Mother',
    shape: 'circle',
    isEgo: false,
    networkNode: createMockNetworkNode('Mary'),
  },
};

/**
 * Unfilled ego node with icon inside and "You" label below.
 */
export const UnfilledEgo: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    label: 'You',
    shape: 'circle',
    isEgo: true,
  },
};

/**
 * Filled ego node with name inside and "You" label below.
 */
export const FilledEgo: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    label: 'You',
    shape: 'circle',
    isEgo: true,
    networkNode: createMockNetworkNode('Sarah'),
  },
};

/**
 * Selected node state.
 */
export const Selected: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    label: 'Brother',
    shape: 'square',
    isEgo: false,
    networkNode: createMockNetworkNode('Mike'),
    selected: true,
  },
};

/**
 * All node states displayed together for comparison.
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            placeholderId="p1"
            label="Father"
            shape="square"
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Unfilled Male</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            placeholderId="p2"
            label="Mother"
            shape="circle"
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Unfilled Female</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            placeholderId="p3"
            label="Father"
            shape="square"
            allowDrag={false}
            networkNode={createMockNetworkNode('John')}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Filled Male</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            placeholderId="p4"
            label="Mother"
            shape="circle"
            allowDrag={false}
            networkNode={createMockNetworkNode('Mary')}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Filled Female</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            placeholderId="p5"
            label="You"
            shape="circle"
            allowDrag={false}
            isEgo
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Unfilled Ego</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            placeholderId="p6"
            label="You"
            shape="circle"
            allowDrag={false}
            isEgo
            networkNode={createMockNetworkNode('Sarah')}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Filled Ego</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
All FamilyTreeNode states displayed together:
- **Unfilled nodes**: Blank inside, relationship label below
- **Filled nodes**: Name inside, relationship label below
- **Ego nodes**: Icon (unfilled) or name (filled) inside, "You" below, arrow indicator
- **Shapes**: Square = male, Circle = female
        `,
      },
    },
  },
};

/**
 * Comparison of male (square) and female (circle) shapes.
 */
export const ShapeComparison: Story = {
  render: () => (
    <div className="flex gap-12">
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            placeholderId="male"
            label="Father"
            shape="square"
            allowDrag={false}
            networkNode={createMockNetworkNode('John')}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Male (Square)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            placeholderId="female"
            label="Mother"
            shape="circle"
            allowDrag={false}
            networkNode={createMockNetworkNode('Mary')}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Female (Circle)</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Family trees use shape to indicate sex: squares for males, circles for females.',
      },
    },
  },
};

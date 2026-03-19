import { entityAttributesProperty } from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Provider } from 'react-redux';
import { type NodeData } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import FamilyTreeNode from './FamilyTreeNode';

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

function createNode(
  overrides: Partial<NodeData> & { id?: string } = {},
): NodeData & { id: string } {
  return {
    id: overrides.id ?? `node-${crypto.randomUUID()}`,
    label: overrides.label ?? '',
    isEgo: overrides.isEgo ?? false,
    sex: overrides.sex,
    readOnly: overrides.readOnly,
    interviewNetworkId: overrides.interviewNetworkId,
  };
}

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
  args: {
    allowDrag: false,
  },
};

export default meta;
type Story = StoryObj<typeof FamilyTreeNode>;

export const Male: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({ id: 'p1', label: 'John', sex: 'male' }),
  },
};

export const Female: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({ id: 'p2', label: 'Mary', sex: 'female' }),
  },
};

export const Intersex: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({ id: 'p3', label: 'Alex', sex: 'intersex' }),
  },
};

export const Ego: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({ id: 'p4', label: 'You', sex: 'female', isEgo: true }),
  },
};

export const Selected: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyTreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({ id: 'p5', label: 'Mike', sex: 'male' }),
    selected: true,
  },
};

export const AllShapes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            node={createNode({ id: 'a1', label: 'John', sex: 'male' })}
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Male (Square)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            node={createNode({ id: 'a2', label: 'Mary', sex: 'female' })}
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Female (Circle)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            node={createNode({ id: 'a3', label: 'Alex', sex: 'intersex' })}
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Intersex (Diamond)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            node={createNode({
              id: 'a4',
              label: 'You',
              sex: 'female',
              isEgo: true,
            })}
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Ego</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyTreeNode
            node={createNode({ id: 'a5', label: 'Mike', sex: 'male' })}
            allowDrag={false}
            selected
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Selected</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
All FamilyTreeNode states:
- **Shapes**: Square = male, Circle = female, Diamond = intersex
- **Ego**: Self node
- **Selected**: Highlighted state
        `,
      },
    },
  },
};

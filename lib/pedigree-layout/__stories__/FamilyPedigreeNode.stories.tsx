import { entityAttributesProperty } from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Provider } from 'react-redux';
import { type NodeData } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import FamilyPedigreeNode from '~/lib/pedigree-layout/components/FamilyPedigreeNode';

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
    shape: overrides.shape,
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

const meta: Meta<typeof FamilyPedigreeNode> = {
  title: 'Interview/Interfaces/FamilyPedigree/FamilyPedigreeNode',
  component: FamilyPedigreeNode,
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
type Story = StoryObj<typeof FamilyPedigreeNode>;

export const UnfilledSquare: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyPedigreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({ id: 'p1', shape: 'square' }),
  },
};

export const UnfilledCircle: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyPedigreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({ id: 'p2', shape: 'circle' }),
  },
};

export const FilledSquare: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyPedigreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({
      id: 'p3',
      label: 'John',
      shape: 'square',
      interviewNetworkId: 'n1',
    }),
  },
};

export const FilledCircle: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyPedigreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({
      id: 'p4',
      label: 'Mary',
      shape: 'circle',
      interviewNetworkId: 'n2',
    }),
  },
};

export const UnfilledEgo: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyPedigreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({ id: 'p5', shape: 'circle', isEgo: true }),
  },
};

export const FilledEgo: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyPedigreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({
      id: 'p6',
      label: 'Sarah',
      shape: 'circle',
      isEgo: true,
      interviewNetworkId: 'n3',
    }),
  },
};

export const Selected: Story = {
  render: (args) => (
    <NodeContainer>
      <FamilyPedigreeNode {...args} />
    </NodeContainer>
  ),
  args: {
    node: createNode({
      id: 'p7',
      label: 'Mike',
      shape: 'square',
      interviewNetworkId: 'n4',
    }),
    selected: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyPedigreeNode
            node={createNode({ id: 'a1', shape: 'square' })}
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Unfilled Square</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyPedigreeNode
            node={createNode({ id: 'a2', shape: 'circle' })}
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Unfilled Circle</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyPedigreeNode
            node={createNode({
              id: 'a3',
              label: 'John',
              shape: 'square',
              interviewNetworkId: 'n1',
            })}
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Filled Square</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyPedigreeNode
            node={createNode({
              id: 'a4',
              label: 'Mary',
              shape: 'circle',
              interviewNetworkId: 'n2',
            })}
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Filled Circle</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyPedigreeNode
            node={createNode({ id: 'a5', shape: 'circle', isEgo: true })}
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Unfilled Ego</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyPedigreeNode
            node={createNode({
              id: 'a6',
              label: 'Sarah',
              shape: 'circle',
              isEgo: true,
              interviewNetworkId: 'n3',
            })}
            allowDrag={false}
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
All FamilyPedigreeNode states:
- **Unfilled nodes**: Blank inside, relationship label below
- **Filled nodes**: Name inside, relationship label below
- **Ego nodes**: Icon (unfilled) or name (filled) inside, "You" below, arrow indicator
- **Shapes**: Square, Circle, Diamond
        `,
      },
    },
  },
};

export const ShapeComparison: Story = {
  render: () => (
    <div className="flex gap-12">
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyPedigreeNode
            node={createNode({
              id: 's1',
              label: 'John',
              shape: 'square',
              interviewNetworkId: 'n1',
            })}
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Square</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NodeContainer>
          <FamilyPedigreeNode
            node={createNode({
              id: 's2',
              label: 'Mary',
              shape: 'circle',
              interviewNetworkId: 'n2',
            })}
            allowDrag={false}
          />
        </NodeContainer>
        <span className="text-xs text-white/70">Circle</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pedigree shapes: square, circle, diamond.',
      },
    },
  },
};

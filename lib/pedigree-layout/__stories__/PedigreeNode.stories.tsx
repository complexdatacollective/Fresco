import { entityAttributesProperty } from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Provider } from 'react-redux';
import { type NodeData } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import PedigreeNode from '~/lib/pedigree-layout/components/PedigreeNode';

const mockProtocol = {
  id: 'test-protocol',
  codebook: {
    node: {
      person: {
        name: 'Person',
        color: 'node-color-seq-1',
        displayVariable: 'name',
        variables: {
          name: { name: 'Name', type: 'text' },
          sex: { name: 'Sex', type: 'categorical' },
        },
      },
    },
  },
  stages: [],
  experiments: { encryptedVariables: false },
  assets: [],
};

const mockSession = {
  id: 'test-session',
  currentStep: 0,
  promptIndex: 0,
  network: {
    nodes: [],
    edges: [],
    ego: { [entityAttributesProperty]: {} },
  },
};

const mockUiState = {
  passphrase: null as string | null,
  passphraseInvalid: false,
  showPassphrasePrompter: false,
};

const createMockStore = () =>
  configureStore({
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
    biologicalSex: overrides.biologicalSex,
  };
}

const meta: Meta<typeof PedigreeNode> = {
  title: 'Interview/Interfaces/FamilyPedigree/PedigreeNode',
  component: PedigreeNode,
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
type Story = StoryObj<typeof PedigreeNode>;

export const NamedMale: Story = {
  args: {
    node: createNode({ id: 'p1', label: 'John', shape: 'square' }),
    displayLabel: 'John',
  },
};

export const NamedFemale: Story = {
  args: {
    node: createNode({ id: 'p2', label: 'Mary', shape: 'circle' }),
    displayLabel: 'Mary',
  },
};

export const UnnamedFather: Story = {
  args: {
    node: createNode({
      id: 'p3',
      shape: 'square',
      biologicalSex: 'male',
    }),
    displayLabel: 'Father',
  },
};

export const UnnamedMother: Story = {
  args: {
    node: createNode({
      id: 'p4',
      shape: 'circle',
      biologicalSex: 'female',
    }),
    displayLabel: 'Mother',
  },
};

export const SpermDonor: Story = {
  args: {
    node: createNode({
      id: 'p5',
      shape: 'square',
      biologicalSex: 'male',
    }),
    displayLabel: 'Sperm Donor',
  },
};

export const EggDonor: Story = {
  args: {
    node: createNode({
      id: 'p6',
      shape: 'circle',
      biologicalSex: 'female',
    }),
    displayLabel: 'Egg Donor',
  },
};

export const SpermDonorNumbered: Story = {
  args: {
    node: createNode({
      id: 'p7',
      shape: 'square',
      biologicalSex: 'male',
    }),
    displayLabel: 'Sperm Donor #1',
  },
};

export const Surrogate: Story = {
  args: {
    node: createNode({
      id: 'p8',
      shape: 'circle',
      biologicalSex: 'female',
    }),
    displayLabel: 'Surrogate',
  },
};

export const EgoNode: Story = {
  args: {
    node: createNode({ id: 'p9', shape: 'circle', isEgo: true }),
    displayLabel: 'You',
  },
};

export const Selected: Story = {
  args: {
    node: createNode({
      id: 'p10',
      label: 'Mike',
      shape: 'square',
    }),
    displayLabel: 'Mike',
    selected: true,
  },
};

export const Diamond: Story = {
  args: {
    node: createNode({
      id: 'p11',
      shape: 'diamond',
      biologicalSex: 'intersex',
    }),
    displayLabel: 'Sibling',
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      {[
        {
          node: createNode({ id: 'a1', shape: 'square' }),
          displayLabel: 'Father',
          label: 'Father (unnamed)',
        },
        {
          node: createNode({ id: 'a2', shape: 'circle' }),
          displayLabel: 'Mother',
          label: 'Mother (unnamed)',
        },
        {
          node: createNode({
            id: 'a3',
            label: 'John',
            shape: 'square',
          }),
          displayLabel: 'John',
          label: 'Named male',
        },
        {
          node: createNode({
            id: 'a4',
            label: 'Mary',
            shape: 'circle',
          }),
          displayLabel: 'Mary',
          label: 'Named female',
        },
        {
          node: createNode({ id: 'a5', shape: 'circle', isEgo: true }),
          displayLabel: 'You',
          label: 'Ego',
        },
        {
          node: createNode({ id: 'a6', shape: 'square' }),
          displayLabel: 'Sperm Donor #1',
          label: 'Donor #1',
        },
        {
          node: createNode({ id: 'a7', shape: 'diamond' }),
          displayLabel: 'Sibling',
          label: 'Diamond',
        },
      ].map(({ node, displayLabel, label }) => (
        <div key={node.id} className="flex flex-col items-center gap-2">
          <PedigreeNode
            node={node}
            displayLabel={displayLabel}
            allowDrag={false}
          />
          <span className="text-xs text-white/70">{label}</span>
        </div>
      ))}
    </div>
  ),
};

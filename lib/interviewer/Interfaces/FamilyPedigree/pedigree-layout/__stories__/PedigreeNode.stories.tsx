import { entityAttributesProperty } from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Provider } from 'react-redux';
import { type NcNode } from '@codaco/shared-consts';
import PedigreeNode from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/components/PedigreeNode';

const mockProtocol = {
  id: 'test-protocol',
  codebook: {
    node: {
      person: {
        name: 'Person',
        color: 'node-color-seq-1',
        shape: {
          default: 'square',
          dynamic: {
            variable: 'sex',
            type: 'discrete',
            map: [
              { value: 'male', shape: 'square' },
              { value: 'female', shape: 'circle' },
              { value: 'intersex', shape: 'diamond' },
              { value: 'non-binary', shape: 'diamond' },
            ],
          },
        },
        variables: {
          name: { name: 'Name', type: 'text' },
          sex: { name: 'Sex', type: 'categorical' },
        },
      },
    },
  },
  stages: [
    {
      id: 'stage-1',
      type: 'FamilyPedigree',
      label: 'family pedigree',
      subject: { entity: 'node', type: 'person' },
      nodeConfig: {
        type: 'person',
        nodeLabelVariable: 'name',
        egoVariable: 'isEgo',
        relationshipVariable: 'rel',
      },
    },
  ],
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
  overrides: Partial<{
    id: string;
    isEgo: boolean;
    label: string;
  }> = {},
): NcNode & { id: string } {
  const id = overrides.id ?? `node-${crypto.randomUUID()}`;
  return {
    id,
    _uid: id,
    type: 'person',
    attributes: {
      name: overrides.label ?? '',
      isEgo: overrides.isEgo ?? false,
    },
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
    node: createNode({ id: 'p1', label: 'John' }),
    displayLabel: 'John',
  },
};

export const NamedFemale: Story = {
  args: {
    node: createNode({ id: 'p2', label: 'Mary' }),
    displayLabel: 'Mary',
  },
};

export const UnnamedFather: Story = {
  args: {
    node: createNode({ id: 'p3' }),
    displayLabel: 'Father',
  },
};

export const UnnamedMother: Story = {
  args: {
    node: createNode({ id: 'p4' }),
    displayLabel: 'Mother',
  },
};

export const SpermDonor: Story = {
  args: {
    node: createNode({ id: 'p5' }),
    displayLabel: 'Sperm Donor',
  },
};

export const EggDonor: Story = {
  args: {
    node: createNode({ id: 'p6' }),
    displayLabel: 'Egg Donor',
  },
};

export const SpermDonorNumbered: Story = {
  args: {
    node: createNode({ id: 'p7' }),
    displayLabel: 'Sperm Donor #1',
  },
};

export const Surrogate: Story = {
  args: {
    node: createNode({ id: 'p8' }),
    displayLabel: 'Surrogate',
  },
};

export const EgoNode: Story = {
  args: {
    node: createNode({ id: 'p9', isEgo: true }),
    isEgo: true,
    displayLabel: 'You',
  },
};

export const Selected: Story = {
  args: {
    node: createNode({ id: 'p10', label: 'Mike' }),
    displayLabel: 'Mike',
    selected: true,
  },
};

export const NonBinary: Story = {
  args: {
    node: createNode({ id: 'p11' }),
    displayLabel: 'Sibling',
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      {[
        {
          node: createNode({ id: 'a1' }),
          displayLabel: 'Father',
          label: 'Father (unnamed)',
        },
        {
          node: createNode({ id: 'a2' }),
          displayLabel: 'Mother',
          label: 'Mother (unnamed)',
        },
        {
          node: createNode({ id: 'a3', label: 'John' }),
          displayLabel: 'John',
          label: 'Named male',
        },
        {
          node: createNode({
            id: 'a4',
            label: 'Mary',
          }),
          displayLabel: 'Mary',
          label: 'Named female',
        },
        {
          node: createNode({
            id: 'a5',
            isEgo: true,
          }),
          isEgo: true,
          displayLabel: 'You',
          label: 'Ego',
        },
        {
          node: createNode({ id: 'a6' }),
          displayLabel: 'Sperm Donor #1',
          label: 'Donor #1',
        },
        {
          node: createNode({ id: 'a7' }),
          displayLabel: 'Sibling',
          label: 'Non-binary',
        },
      ].map(({ node, displayLabel, label, isEgo }) => (
        <div key={node.id} className="flex flex-col items-center gap-2">
          <PedigreeNode
            node={node}
            isEgo={isEgo}
            displayLabel={displayLabel}
            allowDrag={false}
          />
          <span className="text-xs text-white/70">{label}</span>
        </div>
      ))}
    </div>
  ),
};

'use client';

import {
  entityAttributesProperty,
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Provider } from 'react-redux';
import QuickNodeForm from './QuickNodeForm';

const mockProtocol = {
  id: 'test-protocol',
  codebook: {
    node: {
      person: {
        name: 'Person',
        color: 'node-color-seq-1',
        displayVariable: 'name',
        iconVariant: 'add-a-person',
        variables: {
          name: {
            name: 'Name',
            type: 'text',
          },
        },
      },
    },
  },
  stages: [
    {
      id: 'stage-1',
      type: 'NameGenerator',
      label: 'Name Generator',
      subject: {
        entity: 'node',
        type: 'person',
      },
      prompts: [
        {
          id: 'prompt-1',
          text: 'Name the people in your network',
          additionalAttributes: [{ variable: 'closeness', value: 5 }],
        },
      ],
    },
  ],
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

const createMockStore = () => {
  const mockProtocolState = {
    id: 'test-protocol-id',
    codebook: mockProtocol.codebook,
    stages: mockProtocol.stages,
    assets: [],
    experiments: {
      encryptedVariables: false,
    },
  };

  const mockSessionState = {
    ...mockSession,
    currentStep: 0,
  };

  const mockUiState = {
    passphrase: null as string | null,
    passphraseInvalid: false,
    showPassphrasePrompter: false,
  };

  return configureStore({
    reducer: {
      session: (state: unknown = mockSessionState): unknown => state,
      protocol: (state: unknown = mockProtocolState): unknown => state,
      form: (state: unknown = {}): unknown => state,
      ui: (state: unknown = mockUiState): unknown => state,
    },
    preloadedState: {
      protocol: mockProtocolState,
      session: mockSessionState,
      ui: mockUiState,
    },
  });
};

const ReduxDecorator = (Story: React.ComponentType) => {
  const store = createMockStore();
  return (
    <Provider store={store}>
      <div className="relative flex h-[400px] w-[800px] items-end justify-end p-6">
        <Story />
      </div>
    </Provider>
  );
};

const meta: Meta<typeof QuickNodeForm> = {
  title: 'Interview/Interfaces/NameGenerator/QuickNodeForm',
  component: QuickNodeForm,
  decorators: [ReduxDecorator],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the form is disabled',
    },
    targetVariable: {
      control: 'text',
      description: 'The variable name for the quick add field',
    },
    onShowForm: {
      action: 'form-shown',
      description: 'Callback when the form is shown',
    },
    addNode: {
      action: 'node-added',
      description: 'Callback when a node is added',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function QuickNodeFormWrapper(
  props: Omit<React.ComponentProps<typeof QuickNodeForm>, 'addNode'> & {
    addNode?: (attributes: NcNode[EntityAttributesProperty]) => Promise<void>;
  },
) {
  const [addedNodes, setAddedNodes] = useState<
    NcNode[EntityAttributesProperty][]
  >([]);
  const [formShown, setFormShown] = useState(false);

  const handleAddNode = async (
    attributes: NcNode[EntityAttributesProperty],
  ) => {
    setAddedNodes((prev) => [...prev, attributes]);
    await props.addNode?.(attributes);
  };

  const handleShowForm = () => {
    setFormShown(true);
    props.onShowForm?.();
  };

  return (
    <div className="flex flex-col items-end gap-4">
      <QuickNodeForm
        {...props}
        addNode={handleAddNode}
        onShowForm={handleShowForm}
      />
      {formShown && (
        <div className="text-xs text-current/70" data-testid="form-shown">
          Form revealed
        </div>
      )}
      {addedNodes.length > 0 && (
        <div className="flex flex-col gap-2" data-testid="added-nodes">
          <div className="text-sm font-medium text-white">Added nodes:</div>
          {addedNodes.map((node, index) => (
            <div
              key={index}
              className="bg-surface-1 text-surface-1-contrast rounded px-3 py-2 text-sm"
              data-testid={`added-node-${index}`}
            >
              {JSON.stringify(node)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const Default: Story = {
  args: {
    disabled: false,
    targetVariable: 'name',
  },
  render: (args) => <QuickNodeFormWrapper {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'The QuickNodeForm provides a quick way to add nodes with a single field. Click the button to reveal the input, type a name, and press Enter to add.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    targetVariable: 'name',
  },
  render: (args) => <QuickNodeFormWrapper {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Disabled state prevents interaction with the form.',
      },
    },
  },
};

export const AddNodeFlow: Story = {
  args: {
    disabled: false,
    targetVariable: 'name',
  },
  render: (args) => <QuickNodeFormWrapper {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'The complete flow of adding a node: click to reveal, type a name, and submit.',
      },
    },
  },
};

export const DisabledState: Story = {
  args: {
    disabled: true,
    targetVariable: 'name',
  },
  render: (args) => <QuickNodeFormWrapper {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'The disabled state prevents form interaction.',
      },
    },
  },
};

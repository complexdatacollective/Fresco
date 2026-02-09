'use client';

import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Provider } from 'react-redux';
import Form from '~/lib/form/components/Form';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import QuickAddField from './QuickAddField';

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
      _attributes: {},
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
      <div className="relative flex h-[400px] w-[700px] items-end justify-end bg-slate-900 p-6">
        <Story />
      </div>
    </Provider>
  );
};

const meta: Meta<typeof QuickAddField> = {
  title: 'Interview/Interfaces/NameGenerator/QuickAddField',
  component: QuickAddField,
  decorators: [ReduxDecorator],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'Field name (variable)',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the field is disabled',
    },
    onShowInput: {
      action: 'input-shown',
      description: 'Callback when the input is revealed',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    minLength: {
      control: 'number',
      description: 'Minimum character length',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character length',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function QuickAddFieldWrapper(
  props: React.ComponentProps<typeof QuickAddField> & {
    onFormSubmit: (values: Record<string, unknown>) => void;
  },
) {
  const { onFormSubmit, ...fieldProps } = props;
  const [submittedValue, setSubmittedValue] = useState<string | null>(null);

  const handleSubmit: FormSubmitHandler = (values) => {
    const typedValues = values as Record<string, unknown>;
    const submittedName = typedValues[fieldProps.name] as string;
    setSubmittedValue(submittedName);

    // Log to Storybook actions panel
    onFormSubmit({ [fieldProps.name]: submittedName });

    return { success: true };
  };

  return (
    <div className="flex flex-col items-end gap-4">
      <Form onSubmit={handleSubmit}>
        <QuickAddField {...fieldProps} />
      </Form>
      {submittedValue && (
        <div className="text-sm text-white" data-testid="submitted-value">
          Submitted: {submittedValue}
        </div>
      )}
    </div>
  );
}

const formSubmitAction = fn().mockName('form-submitted');

export const Default: Story = {
  args: {
    name: 'name',
    placeholder: 'Type a name and press enter...',
    disabled: false,
  },
  render: (args) => (
    <QuickAddFieldWrapper {...args} onFormSubmit={formSubmitAction} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The default QuickAddField shows a button that reveals an input when clicked. Type text and press Enter to submit. Check the Actions panel to see submitted values.',
      },
    },
  },
};

export const WithValidation: Story = {
  args: {
    name: 'name',
    placeholder: 'Enter at least 2 characters...',
    disabled: false,
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  render: (args) => (
    <QuickAddFieldWrapper {...args} onFormSubmit={formSubmitAction} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'QuickAddField with validation rules. The field requires a minimum of 2 characters and a maximum of 50.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    name: 'name',
    placeholder: 'Type a name...',
    disabled: true,
  },
  render: (args) => (
    <QuickAddFieldWrapper {...args} onFormSubmit={formSubmitAction} />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled state prevents interaction with the field.',
      },
    },
  },
};

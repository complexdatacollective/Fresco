'use client';

import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { expect, userEvent, within } from 'storybook/test';
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

export const ClickToRevealInput: Story = {
  args: {
    name: 'name',
    placeholder: 'Type a name...',
    disabled: false,
  },
  render: (args) => (
    <QuickAddFieldWrapper {...args} onFormSubmit={formSubmitAction} />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Initially show the add button', async () => {
      const addButton = canvas.getByRole('button', { name: /add a person/i });
      await expect(addButton).toBeInTheDocument();
    });

    await step('Click the button to reveal the input', async () => {
      const addButton = canvas.getByRole('button', { name: /add a person/i });
      await userEvent.click(addButton);
    });

    await step('Input should be visible and focused', async () => {
      const input = canvas.getByPlaceholderText('Type a name...');
      await expect(input).toBeInTheDocument();
      // Focus happens after animation completes, so we need to wait
      await new Promise((resolve) => setTimeout(resolve, 500));
      await expect(input).toHaveFocus();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the click-to-reveal behavior. Clicking the add button reveals the input field and focuses it.',
      },
    },
  },
};

export const TypeAndSubmit: Story = {
  args: {
    name: 'name',
    placeholder: 'Type a name and press Enter...',
    disabled: false,
  },
  render: (args) => (
    <QuickAddFieldWrapper {...args} onFormSubmit={formSubmitAction} />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click to reveal input', async () => {
      const addButton = canvas.getByRole('button', {
        name: /add a person/i,
      });
      await userEvent.click(addButton);
    });

    await step('Type a value', async () => {
      const input = canvas.getByPlaceholderText(
        'Type a name and press Enter...',
      );
      await userEvent.type(input, 'Alice');
      await expect(input).toHaveValue('Alice');
    });

    await step('Submit with Enter', async () => {
      await userEvent.keyboard('{Enter}');

      // Wait for form submission to complete and check the submitted value appears
      const submittedValue = await canvas.findByTestId('submitted-value', {}, { timeout: 3000 });
      await expect(submittedValue).toHaveTextContent('Submitted: Alice');
    });

    await step('Form should stay open with cleared input', async () => {
      const input = canvas.getByPlaceholderText(
        'Type a name and press Enter...',
      );
      await expect(input).toBeInTheDocument();
      await expect(input).toHaveValue('');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the full flow: click to reveal, type a value, and submit with Enter. After submission, the form stays open with a cleared input for quick successive entries.',
      },
    },
  },
};

export const ValidationError: Story = {
  args: {
    name: 'name',
    placeholder: 'Enter at least 3 characters...',
    disabled: false,
    required: true,
    minLength: 3,
  },
  render: (args) => (
    <QuickAddFieldWrapper {...args} onFormSubmit={formSubmitAction} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click to reveal input
    const addButton = canvas.getByRole('button', { name: /add a person/i });
    await userEvent.click(addButton);

    // Type a value that's too short
    const input = canvas.getByPlaceholderText('Enter at least 3 characters...');
    await userEvent.type(input, 'AB');

    // Try to submit - validation should fail and show error
    await userEvent.keyboard('{Enter}');

    // The error message should be shown
    const errorMessage = await canvas.findByText(/at least 3 characters/i);
    await expect(errorMessage).toBeInTheDocument();

    // Input should still be visible (form doesn't close on validation error)
    await expect(input).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests validation error display when the input value is too short.',
      },
    },
  },
};

export const EscapeToClose: Story = {
  args: {
    name: 'name',
    placeholder: 'Press Escape to close...',
    disabled: false,
  },
  render: (args) => (
    <QuickAddFieldWrapper {...args} onFormSubmit={formSubmitAction} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click to reveal input
    const addButton = canvas.getByRole('button', { name: /add a person/i });
    await userEvent.click(addButton);

    // Type something in the input
    const input = canvas.getByPlaceholderText('Press Escape to close...');
    await userEvent.type(input, 'Some text');
    await expect(input).toHaveValue('Some text');

    // Press Escape - should close and reset
    await userEvent.keyboard('{Escape}');

    // The add button should be visible again
    const addButtonAgain = await canvas.findByRole('button', {
      name: /add a person/i,
    });
    await expect(addButtonAgain).toBeInTheDocument();

    // Reopen to verify the input was reset
    await userEvent.click(addButtonAgain);
    const inputAgain = canvas.getByPlaceholderText('Press Escape to close...');
    await expect(inputAgain).toHaveValue('');
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests that pressing Escape closes the input and returns to the add button.',
      },
    },
  },
};

export const BlurToCloseAndReset: Story = {
  args: {
    name: 'name',
    placeholder: 'Type and blur to close...',
    disabled: false,
  },
  render: (args) => (
    <QuickAddFieldWrapper {...args} onFormSubmit={formSubmitAction} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click to reveal input
    const addButton = canvas.getByRole('button', { name: /add a person/i });
    await userEvent.click(addButton);

    // Type something
    const input = canvas.getByPlaceholderText('Type and blur to close...');
    await userEvent.type(input, 'Some text');
    await expect(input).toHaveValue('Some text');

    // Blur the input (tab away)
    await userEvent.tab();

    // The add button should be visible again (input closed)
    const addButtonAgain = await canvas.findByRole('button', {
      name: /add a person/i,
    });
    await expect(addButtonAgain).toBeInTheDocument();

    // Reopen to verify the input was reset
    await userEvent.click(addButtonAgain);
    const inputAgain = canvas.getByPlaceholderText('Type and blur to close...');
    await expect(inputAgain).toHaveValue('');
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests that blurring the input (clicking away or tabbing) closes the input and resets its value.',
      },
    },
  },
};

export const DisabledPreventsInteraction: Story = {
  args: {
    name: 'name',
    placeholder: 'Type a name...',
    disabled: true,
  },
  render: (args) => (
    <QuickAddFieldWrapper {...args} onFormSubmit={formSubmitAction} />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Check the hidden checkbox is disabled', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeDisabled();
    });

    await step('The add button should have disabled styling', async () => {
      const addButton = canvas.getByRole('button', { name: /add a person/i });
      // Check for disabled styling (opacity-50 and pointer-events-none)
      await expect(addButton).toHaveClass('opacity-50');
      await expect(addButton).toHaveClass('pointer-events-none');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests that the disabled state prevents all interactions.',
      },
    },
  },
};

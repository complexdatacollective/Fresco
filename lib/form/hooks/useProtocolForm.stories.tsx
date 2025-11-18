'use client';

import { action } from 'storybook/actions';
import type { Form as TForm } from '@codaco/protocol-validation';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Provider } from 'react-redux';
import { Form, SubmitButton } from '../components';
import useProtocolForm from './useProtocolForm';

// Mock protocol data
const mockProtocol = {
  name: 'Test Protocol',
  codebook: {
    node: {
      person: {
        name: 'Person',
        displayVariable: 'name',
        iconVariant: 'add-a-person',
        variables: {
          name: {
            name: 'Name',
            type: 'text',
            component: 'Text',
            validation: {
              required: true,
              minLength: 2,
              maxLength: 100,
            },
          },
          email: {
            name: 'Email',
            type: 'text',
            component: 'Text',
            validation: {
              required: true,
            },
          },
          age: {
            name: 'Age',
            type: 'number',
            component: 'Number',
            validation: {
              minValue: 18,
              maxValue: 100,
            },
          },
          gender: {
            name: 'Gender',
            type: 'categorical',
            component: 'RadioGroup',
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Non-binary', value: 'non_binary' },
              { label: 'Prefer not to say', value: 'prefer_not_say' },
            ],
            validation: {
              required: true,
            },
          },
          occupation: {
            name: 'Occupation',
            type: 'text',
            component: 'Text',
          },
          favoriteColors: {
            name: 'Favorite Colors',
            type: 'categorical',
            component: 'CheckboxGroup',
            options: [
              { label: 'Red', value: 'red' },
              { label: 'Blue', value: 'blue' },
              { label: 'Green', value: 'green' },
              { label: 'Yellow', value: 'yellow' },
              { label: 'Purple', value: 'purple' },
              { label: 'Orange', value: 'orange' },
              { label: 'Pink', value: 'pink' },
            ],
            validation: {
              minSelected: 1,
              maxSelected: 3,
            },
          },
          birthDate: {
            name: 'Birth Date',
            type: 'datetime',
            component: 'DatePicker',
            parameters: {
              type: 'date',
              min: '1920-01-01',
              max: '2010-12-31',
            },
          },
          startDate: {
            name: 'Start Date',
            type: 'datetime',
            component: 'RelativeDatePicker',
            parameters: {
              before: 30,
              after: 90,
            },
          },
          happiness: {
            name: 'Happiness Level',
            type: 'scalar',
            component: 'VisualAnalogScale',
            parameters: {
              minLabel: 'Very Unhappy',
              maxLabel: 'Very Happy',
            },
          },
          satisfaction: {
            name: 'Job Satisfaction',
            type: 'ordinal',
            component: 'LikertScale',
            options: [
              { label: 'Very Dissatisfied', value: 1 },
              { label: 'Dissatisfied', value: 2 },
              { label: 'Neutral', value: 3 },
              { label: 'Satisfied', value: 4 },
              { label: 'Very Satisfied', value: 5 },
            ],
          },
          isEmployed: {
            name: 'Currently Employed',
            type: 'boolean',
            component: 'Toggle',
          },
          acceptTerms: {
            name: 'Accept Terms',
            type: 'boolean',
            component: 'Boolean',
          },
          preferredContact: {
            name: 'Preferred Contact Method',
            type: 'categorical',
            component: 'ToggleButtonGroup',
            options: [
              { label: 'Email', value: 'email' },
              { label: 'Phone', value: 'phone' },
              { label: 'SMS', value: 'sms' },
            ],
          },
          bio: {
            name: 'Biography',
            type: 'text',
            component: 'TextArea',
            validation: {
              maxLength: 500,
            },
          },
        },
      },
    },
  },
  stages: [
    {
      type: 'NameGenerator',
      label: 'Name Generator',
      subject: {
        entity: 'node',
        type: 'person',
      },
    },
  ],
};

// Create mock Redux store
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
    id: 'test-session',
    currentStep: 0,
    startTime: new Date().toISOString(),
    finishTime: null,
    exportTime: null,
    lastUpdated: new Date().toISOString(),
    network: {
      nodes: [],
      edges: [],
      ego: {
        _attributes: {},
      },
    },
  };

  return configureStore({
    reducer: {
      session: (state: typeof mockSessionState = mockSessionState) => state,
      protocol: (state: typeof mockProtocolState = mockProtocolState) => state,
      form: (state: Record<string, unknown> = {}) => state,
      ui: (state: Record<string, unknown> = {}) => state,
    },
    preloadedState: {
      protocol: mockProtocolState,
      session: mockSessionState,
    },
  });
};

// Redux decorator for stories
const ReduxDecorator = (Story: React.ComponentType) => {
  const store = createMockStore();
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
};

// Demo component that uses the hook
const ProtocolFormDemo = ({
  fields,
  autoFocus = false,
  initialValues,
}: {
  fields: TForm['fields'];
  autoFocus?: boolean;
  initialValues?: Record<string, unknown>;
}) => {
  const { fieldComponents } = useProtocolForm({
    fields,
    autoFocus,
    initialValues,
  });

  return (
    <Form
      onSubmit={async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        action('form-submitted')(data);
        return { success: true };
      }}
      className="elevation-high w-2xl rounded bg-white p-10"
    >
      {fieldComponents}
      <SubmitButton className="mt-6" />
    </Form>
  );
};

const meta: Meta<typeof ProtocolFormDemo> = {
  title: 'Systems/Form/useProtocolForm',
  component: ProtocolFormDemo,
  decorators: [ReduxDecorator],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    fields: {
      control: 'object',
      description: 'Array of form field configurations from the protocol',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Whether to auto-focus the first field',
    },
    initialValues: {
      control: 'object',
      description: 'Initial values for form fields',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicFields: Story = {
  args: {
    fields: [
      {
        variable: 'name',
        prompt: 'What is your name?',
      },
      {
        variable: 'email',
        prompt: 'What is your email?',
      },
      {
        variable: 'age',
        prompt: 'How old are you?',
      },
    ],
    autoFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates basic text and number input fields with validation.',
      },
    },
  },
};

export const WithAutoFocus: Story = {
  args: {
    fields: [
      {
        variable: 'name',
        prompt: 'What is your name?',
      },
      {
        variable: 'occupation',
        prompt: 'What is your occupation?',
      },
    ],
    autoFocus: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The first field is automatically focused when autoFocus is true.',
      },
    },
  },
};

export const SelectionFields: Story = {
  args: {
    fields: [
      {
        variable: 'gender',
        prompt: 'What is your gender?',
      },
      {
        variable: 'favoriteColors',
        prompt: 'Select your favorite colors (1-3)',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates RadioGroup (single selection) and CheckboxGroup (multiple selection) fields.',
      },
    },
  },
};

export const ToggleFields: Story = {
  args: {
    fields: [
      {
        variable: 'isEmployed',
        prompt: 'Are you currently employed?',
      },
      {
        variable: 'acceptTerms',
        prompt: 'I accept the terms and conditions',
      },
      {
        variable: 'preferredContact',
        prompt: 'Preferred contact method',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates Toggle, Boolean (checkbox), and ToggleButtonGroup fields.',
      },
    },
  },
};

export const DateFields: Story = {
  args: {
    fields: [
      {
        variable: 'birthDate',
        prompt: 'When were you born?',
      },
      {
        variable: 'startDate',
        prompt: 'When did you start your current job?',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates DatePicker (absolute dates) and RelativeDatePicker (relative dates) fields.',
      },
    },
  },
};

export const ScaleFields: Story = {
  args: {
    fields: [
      {
        variable: 'happiness',
        prompt: 'How happy are you overall?',
      },
      {
        variable: 'satisfaction',
        prompt: 'How satisfied are you with your job?',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates VisualAnalogScale (continuous) and LikertScale (discrete) fields.',
      },
    },
  },
};

export const TextAreaField: Story = {
  args: {
    fields: [
      {
        variable: 'name',
        prompt: 'What is your name?',
      },
      {
        variable: 'bio',
        prompt: 'Tell us about yourself (max 500 characters)',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the TextArea field for longer text input.',
      },
    },
  },
};

export const WithInitialValues: Story = {
  args: {
    fields: [
      {
        variable: 'name',
        prompt: 'What is your name?',
      },
      {
        variable: 'age',
        prompt: 'How old are you?',
      },
      {
        variable: 'gender',
        prompt: 'What is your gender?',
      },
      {
        variable: 'favoriteColors',
        prompt: 'Select your favorite colors',
      },
      {
        variable: 'isEmployed',
        prompt: 'Are you currently employed?',
      },
      {
        variable: 'bio',
        prompt: 'Tell us about yourself',
      },
    ],
    initialValues: {
      name: 'John Doe',
      age: 32,
      gender: 'male',
      favoriteColors: ['blue', 'green'],
      isEmployed: true,
      bio: 'A software developer passionate about building great user experiences.',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates how to pre-populate form fields with initial values. This is useful when editing existing data.',
      },
    },
  },
};

export const ComprehensiveForm: Story = {
  args: {
    fields: [
      {
        variable: 'name',
        prompt: 'What is your name?',
      },
      {
        variable: 'email',
        prompt: 'What is your email?',
      },
      {
        variable: 'age',
        prompt: 'How old are you?',
      },
      {
        variable: 'gender',
        prompt: 'What is your gender?',
      },
      {
        variable: 'occupation',
        prompt: 'What is your occupation?',
      },
      {
        variable: 'isEmployed',
        prompt: 'Are you currently employed?',
      },
      {
        variable: 'satisfaction',
        prompt: 'How satisfied are you with your job?',
      },
      {
        variable: 'favoriteColors',
        prompt: 'What are your favorite colors? (Select 1-3)',
      },
      {
        variable: 'preferredContact',
        prompt: 'How should we contact you?',
      },
      {
        variable: 'bio',
        prompt: 'Tell us about yourself',
      },
    ],
    autoFocus: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A comprehensive form demonstrating all available field types processed by useProtocolForm.',
      },
    },
  },
};

export const MinimalForm: Story = {
  args: {
    fields: [
      {
        variable: 'name',
        prompt: 'What is your name?',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'A minimal form with just a single field.',
      },
    },
  },
};

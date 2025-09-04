'use client';

import type {
  ComponentType,
  FormField,
  Form as TForm,
} from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import '~/styles/interview.scss';
import NodeForm from './NodeForm';

// Mock data for the story
const mockProtocol = {
  name: 'Test Protocol',
  codebook: {
    node: {
      person: {
        name: 'Person',
        displayVariable: 'name',
        iconVariant: 'user',
        variables: {
          name: {
            name: 'Name',
            type: 'text' as const,
            component: 'Text' as ComponentType,
            required: true,
          },
          age: {
            name: 'Age',
            type: 'number' as const,
            component: 'Number' as ComponentType,
            validation: {
              minValue: 0,
              maxValue: 120,
            },
          },
          gender: {
            name: 'Gender',
            type: 'categorical' as const,
            component: 'RadioGroup' as ComponentType,
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Non-binary', value: 'non_binary' },
              { label: 'Prefer not to say', value: 'prefer_not_say' },
            ],
          },
          occupation: {
            name: 'Occupation',
            type: 'text' as const,
            component: 'Text' as ComponentType,
          },
          favoriteColors: {
            name: 'Favorite Colors',
            type: 'categorical' as const,
            component: 'CheckboxGroup' as ComponentType,
            options: [
              { label: 'Red', value: 'red' },
              { label: 'Blue', value: 'blue' },
              { label: 'Green', value: 'green' },
              { label: 'Yellow', value: 'yellow' },
              { label: 'Purple', value: 'purple' },
            ],
          },
          birthDate: {
            name: 'Birth Date',
            type: 'datetime' as const,
            component: 'DatePicker' as ComponentType,
          },
          happiness: {
            name: 'Happiness Level',
            type: 'scalar' as const,
            component: 'Slider' as ComponentType,
            parameters: {
              min: 0,
              max: 100,
            },
          },
          isEmployed: {
            name: 'Currently Employed',
            type: 'boolean' as const,
            component: 'Toggle' as ComponentType,
          },
          bio: {
            name: 'Biography',
            type: 'text' as const,
            component: 'TextArea' as ComponentType,
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
      prompts: [
        {
          id: 'prompt-1',
          text: 'Name the people in your network',
        },
      ],
      form: {
        title: 'Add Person Details',
        fields: [
          {
            variable: 'name',
            prompt: "What is this person's name?",
          },
          {
            variable: 'age',
            prompt: 'How old is this person?',
          },
          {
            variable: 'gender',
            prompt: 'What is their gender?',
          },
          {
            variable: 'occupation',
            prompt: 'What is their occupation?',
          },
          {
            variable: 'favoriteColors',
            prompt: 'What are their favorite colors?',
          },
          {
            variable: 'birthDate',
            prompt: 'When were they born?',
          },
          {
            variable: 'happiness',
            prompt: 'How happy are they generally?',
          },
          {
            variable: 'isEmployed',
            prompt: 'Are they currently employed?',
          },
          {
            variable: 'bio',
            prompt: 'Tell us a bit about them',
          },
        ],
      },
    },
  ],
};

// Create a proper mock session that matches the expected structure
const mockSession = {
  id: 'test-session',
  currentStep: 0,
  startTime: new Date().toISOString(),
  finishTime: null,
  exportTime: null,
  lastUpdated: new Date().toISOString(),
  network: {
    nodes: [
      {
        [entityPrimaryKeyProperty]: 'node-1',
        type: 'person',
        [entityAttributesProperty]: {
          name: 'Alice Smith',
          age: 28,
          gender: 'female',
          occupation: 'Software Engineer',
          isEmployed: true,
        },
      },
      {
        [entityPrimaryKeyProperty]: 'node-2',
        type: 'person',
        [entityAttributesProperty]: {
          name: 'Bob Johnson',
          age: 35,
          gender: 'male',
          occupation: 'Product Manager',
          isEmployed: true,
        },
      },
    ],
    edges: [],
    ego: {
      [entityAttributesProperty]: {},
    },
  },
};

// Create a simple mock session reducer that returns current stage info
const mockSessionReducer = (state = mockSession) => ({
  ...state,
  // Add current stage metadata that selectors expect
  currentStage: {
    type: 'NameGenerator',
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
  promptIndex: 0,
});

// Create mock Redux store with proper structure
const createMockStore = (overrides = {}) => {
  const mockProtocolState = {
    id: 'test-protocol-id',
    codebook: mockProtocol.codebook,
    stages: mockProtocol.stages, // This MUST be an array for the getStages selector
    assets: [], // Ensure assets is an array
    experiments: {
      encryptedVariables: false,
    },
  };

  console.log('Mock protocol stages:', mockProtocol.stages);
  console.log('Mock protocol state:', mockProtocolState);

  const mockSessionState = {
    ...mockSession,
    // Add stage info that getStageSubject selector expects
    currentStep: 0, // This maps to first stage
  };

  return configureStore({
    reducer: {
      session: (state = mockSessionState) => state,
      protocol: (state = mockProtocolState) => state,
      form: (state = {}) => state,
      ui: (state = {}) => state,
      dialogs: (state = {}) => state,
    },
    preloadedState: {
      protocol: mockProtocolState,
      session: mockSessionState,
      ...overrides,
    },
  });
};

// Story decorator to provide Redux store
const ReduxDecorator = (Story: any, context: any) => {
  const store = createMockStore(context.parameters?.reduxState);
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
};

const meta: Meta<typeof NodeForm> = {
  title: 'Interviewer/NameGenerator/NodeForm',
  component: NodeForm,
  decorators: [ReduxDecorator],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    selectedNode: {
      control: 'object',
      description: 'The node being edited, or null for creating a new node',
    },
    form: {
      control: 'object',
      description: 'Form configuration from the protocol',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the form is disabled',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when form is closed',
    },
    addNode: {
      action: 'node-added',
      description: 'Callback when a new node is added',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic form with all field types
const basicForm: TForm = {
  title: 'Add Person to Your Network',
  fields: [
    {
      variable: 'name',
      prompt: 'What is their name?',
    },
    {
      variable: 'age',
      prompt: 'How old are they?',
    },
    {
      variable: 'gender',
      prompt: 'What is their gender?',
    },
    {
      variable: 'occupation',
      prompt: 'What do they do for work?',
    },
  ] as FormField[],
};

// Form with validation
const validatedForm: TForm = {
  title: 'Add Person (with validation)',
  fields: [
    {
      variable: 'name',
      prompt: 'Name (required)',
      validation: {
        required: true,
        minLength: 2,
        maxLength: 50,
      },
    } as any,
    {
      variable: 'age',
      prompt: 'Age (18-100)',
      validation: {
        required: true,
        minValue: 18,
        maxValue: 100,
      },
    } as any,
    {
      variable: 'favoriteColors',
      prompt: 'Select at least 2 favorite colors',
      validation: {
        minSelected: 2,
        maxSelected: 3,
      },
    } as any,
  ] as FormField[],
};

// Complex form with all field types
const complexForm: TForm = {
  title: 'Comprehensive Person Form',
  fields: [
    {
      variable: 'name',
      prompt: 'Full Name',
      validation: {
        required: true,
        unique: true,
      },
    } as any,
    {
      variable: 'age',
      prompt: 'Age',
    },
    {
      variable: 'gender',
      prompt: 'Gender Identity',
    },
    {
      variable: 'occupation',
      prompt: 'Current Occupation',
    },
    {
      variable: 'favoriteColors',
      prompt: 'Favorite Colors (select multiple)',
    },
    {
      variable: 'birthDate',
      prompt: 'Date of Birth',
    },
    {
      variable: 'happiness',
      prompt: 'Overall Happiness (0-100)',
    },
    {
      variable: 'isEmployed',
      prompt: 'Currently Employed?',
    },
    {
      variable: 'bio',
      prompt: 'Short Biography',
    },
  ] as FormField[],
};

export const CreateNewNode: Story = {
  args: {
    selectedNode: null,
    form: basicForm,
    disabled: false,
  },
};

export const EditExistingNode: Story = {
  args: {
    selectedNode: {
      [entityPrimaryKeyProperty]: 'node-1',
      type: 'person',
      [entityAttributesProperty]: {
        name: 'Alice Smith',
        age: 28,
        gender: 'female',
        occupation: 'Software Engineer',
        isEmployed: true,
      },
    },
    form: basicForm,
    disabled: false,
  },
};

export const WithValidation: Story = {
  args: {
    selectedNode: null,
    form: validatedForm,
    disabled: false,
  },
};

export const ComplexForm: Story = {
  args: {
    selectedNode: null,
    form: complexForm,
    disabled: false,
  },
};

export const DisabledState: Story = {
  args: {
    selectedNode: null,
    form: basicForm,
    disabled: true,
  },
};

export const EditWithComplexData: Story = {
  args: {
    selectedNode: {
      [entityPrimaryKeyProperty]: 'node-complex',
      type: 'person',
      [entityAttributesProperty]: {
        name: 'Dr. Jane Wilson',
        age: 45,
        gender: 'female',
        occupation: 'Research Scientist',
        favoriteColors: ['blue', 'green'],
        birthDate: '1979-03-15',
        happiness: 85,
        isEmployed: true,
        bio: 'Dr. Wilson is a leading researcher in quantum computing with over 20 years of experience.',
      },
    },
    form: complexForm,
    disabled: false,
  },
};

export const EmptyForm: Story = {
  args: {
    selectedNode: null,
    form: {
      title: 'Quick Add',
      fields: [] as FormField[],
    },
    disabled: false,
  },
};

export const SingleFieldForm: Story = {
  args: {
    selectedNode: null,
    form: {
      title: 'Add Name Only',
      fields: [
        {
          variable: 'name',
          prompt: "Enter the person's name",
          validation: {
            required: true,
          },
        } as any,
      ] as FormField[],
    },
    disabled: false,
  },
};

// Story with custom initial network for testing unique validation
export const WithUniqueValidation: Story = {
  args: {
    selectedNode: null,
    form: {
      title: 'Add Unique Person',
      fields: [
        {
          variable: 'name',
          prompt:
            'Enter a unique name (Alice Smith and Bob Johnson already exist)',
          validation: {
            required: true,
            unique: true,
          },
        } as any,
      ] as FormField[],
    },
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates unique validation. Try entering "Alice Smith" or "Bob Johnson" to see the validation error.',
      },
    },
  },
};

'use client';

import type { Form as TForm } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Provider } from 'react-redux';
import NodeForm from './NodeForm';

// Mock data for the story
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
          age: {
            name: 'Age',
            type: 'number',
            component: 'Number',
            validation: {
              minValue: 18,
              maxValue: 60,
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
            ],
            validation: {
              required: true,
              minSelected: 2,
              maxSelected: 3,
            },
          },
          birthDate: {
            name: 'Birth Date',
            type: 'datetime',
            component: 'DatePicker',
          },
          happiness: {
            name: 'Happiness Level',
            type: 'scalar',
            component: 'Slider',
            parameters: {
              min: 0,
              max: 100,
            },
          },
          isEmployed: {
            name: 'Currently Employed',
            type: 'boolean',
            component: 'Toggle',
          },
          bio: {
            name: 'Biography',
            type: 'text',
            component: 'TextArea',
            validation: {
              maxLength: 500,
            },
          },
          skills: {
            name: 'Skills',
            type: 'categorical',
            component: 'CheckboxGroup',
            options: [
              { label: 'JavaScript', value: 'javascript' },
              { label: 'Python', value: 'python' },
              { label: 'Java', value: 'java' },
              { label: 'C++', value: 'cpp' },
              { label: 'Ruby', value: 'ruby' },
              { label: 'Go', value: 'go' },
            ],
            validation: {
              required: true,
              minSelected: 1,
              maxSelected: 4,
            },
          },
          communicationPreference: {
            name: 'Communication Preference',
            type: 'categorical',
            component: 'ToggleButtonGroup',
            options: [
              { label: 'Email', value: 'email' },
              { label: 'Phone', value: 'phone' },
              { label: 'Text', value: 'text' },
              { label: 'Video Call', value: 'video' },
            ],
            validation: {
              required: true,
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
    },
    preloadedState: {
      protocol: mockProtocolState,
      session: mockSessionState,
      ...overrides,
    },
  });
};

// Story decorator to provide Redux store
const ReduxDecorator = (Story, context) => {
  const store = createMockStore(context.parameters?.reduxState);
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
};

const meta: Meta<typeof NodeForm> = {
  title: 'Interfaces/NameGenerator/NodeForm',
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
  ],
};

// Form with validation
const validatedForm: TForm = {
  title: 'Add Person (with validation)',
  fields: [
    {
      variable: 'name',
      prompt: 'Name (required)',
    },
    {
      variable: 'age',
      prompt: 'Age (18-100)',
    },
    {
      variable: 'favoriteColors',
      prompt: 'Select at least 2 favorite colors',
    },
  ],
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
      },
    },
    form: basicForm,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "This story demonstrates the initialValues feature. When editing an existing node, the form fields are pre-populated with the node's current attribute values. The form uses the `initialValues` parameter passed to `useProtocolForm` to set the initial field values.",
      },
    },
  },
};

export const WithValidation: Story = {
  args: {
    selectedNode: null,
    form: validatedForm,
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

export const EmptyForm: Story = {
  args: {
    selectedNode: null,
    form: {
      title: 'Quick Add',
      fields: [],
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
        },
      ],
    },
    disabled: false,
  },
};

// Form with multiple field types to demonstrate initialValues comprehensively
const comprehensiveForm: TForm = {
  title: 'Complete Profile',
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
    {
      variable: 'favoriteColors',
      prompt: 'What are their favorite colors?',
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
};

export const EditWithMultipleFieldTypes: Story = {
  args: {
    selectedNode: {
      [entityPrimaryKeyProperty]: 'node-3',
      type: 'person',
      [entityAttributesProperty]: {
        name: 'Jordan Lee',
        age: 32,
        gender: 'non_binary',
        occupation: 'UX Designer',
        favoriteColors: ['blue', 'purple'],
        isEmployed: true,
        bio: 'A creative professional passionate about user experience and accessibility.',
      },
    },
    form: comprehensiveForm,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates initialValues with multiple field types including text, number, radio group, checkbox group, toggle, and textarea. All fields are pre-populated with the existing node data, showing how the form system handles different data types for initial values.',
      },
    },
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
        },
      ],
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

// CheckboxGroup with validation
const checkboxGroupForm: TForm = {
  title: 'Select Your Skills',
  fields: [
    {
      variable: 'name',
      prompt: 'Your name',
    },
    {
      variable: 'skills',
      prompt: 'Select your programming skills (1-4 required)',
    },
  ],
};

export const CheckboxGroupWithValidation: Story = {
  args: {
    selectedNode: null,
    form: checkboxGroupForm,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates a CheckboxGroup component with validation. The skills field requires at least 1 selection and allows a maximum of 4 selections. Try submitting without selecting any options, or with more than 4 options to see validation errors.',
      },
    },
  },
};

export const CheckboxGroupWithInitialValues: Story = {
  args: {
    selectedNode: {
      [entityPrimaryKeyProperty]: 'node-4',
      type: 'person',
      [entityAttributesProperty]: {
        name: 'Sarah Developer',
        skills: ['javascript', 'python', 'java'],
      },
    },
    form: checkboxGroupForm,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story shows a CheckboxGroup with pre-selected values. The form is pre-populated with JavaScript, Python, and Java skills.',
      },
    },
  },
};

// ToggleButtonGroup with validation
const toggleButtonGroupForm: TForm = {
  title: 'Communication Preferences',
  fields: [
    {
      variable: 'name',
      prompt: 'Your name',
    },
    {
      variable: 'communicationPreference',
      prompt: 'How would you prefer to be contacted?',
    },
  ],
};

export const ToggleButtonGroupWithValidation: Story = {
  args: {
    selectedNode: null,
    form: toggleButtonGroupForm,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates a ToggleButtonGroup component with required validation. You must select one communication preference option. Try submitting without selecting an option to see the validation error.',
      },
    },
  },
};

export const ToggleButtonGroupWithInitialValue: Story = {
  args: {
    selectedNode: {
      [entityPrimaryKeyProperty]: 'node-5',
      type: 'person',
      [entityAttributesProperty]: {
        name: 'Mike Contact',
        communicationPreference: 'email',
      },
    },
    form: toggleButtonGroupForm,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story shows a ToggleButtonGroup with a pre-selected value. The form is pre-populated with "Email" as the selected communication preference.',
      },
    },
  },
};

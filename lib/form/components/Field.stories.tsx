'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { z } from 'zod';
import { Field, Form, SubmitButton } from '../components';
import { InputField } from '../components/fields/InputField';
import { TextAreaField } from '../components/fields/TextArea';

const meta: Meta<typeof Field> = {
  title: 'Systems/Form/Field',
  component: Field,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Form
        onSubmit={(data) => {
          action('form-submitted')(data);
          return Promise.resolve({ success: true });
        }}
      >
        <div className="flex w-96 flex-col gap-4">
          <Story />
          <SubmitButton>Submit</SubmitButton>
        </div>
      </Form>
    ),
  ],
  argTypes: {
    name: {
      control: 'text',
      description: 'Unique name for the field, used as the key in form data',
      table: {
        type: { summary: 'string' },
      },
    },
    label: {
      control: 'text',
      description: 'Label displayed above the field',
      table: {
        type: { summary: 'string' },
      },
    },
    hint: {
      control: 'text',
      description: 'Optional hint text displayed below the label',
      table: {
        type: { summary: 'string' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    component: {
      control: false,
      description:
        'The field component to render (InputField, TextAreaField, etc.)',
      table: {
        type: { summary: 'React.ComponentType' },
      },
    },
    initialValue: {
      control: false,
      description: 'Initial value for the field',
      table: {
        type: { summary: 'any' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'username',
    label: 'Username',
    component: InputField,
  },
};

export const WithHint: Story = {
  args: {
    name: 'email',
    label: 'Email Address',
    hint: 'We will never share your email with anyone else.',
    component: InputField,
  },
};

export const Required: Story = {
  args: {
    name: 'password',
    label: 'Password',
    hint: 'Must be at least 8 characters',
    component: InputField,
    required: true,
  },
};

export const WithInitialValue: Story = {
  args: {
    name: 'displayName',
    label: 'Display Name',
    component: InputField,
    initialValue: 'John Doe',
  },
};

export const WithTextArea: Story = {
  name: 'With TextArea Component',
  args: {
    name: 'bio',
    label: 'Biography',
    hint: 'Tell us about yourself',
    component: TextAreaField,
  },
};

export const WithZodValidation: Story = {
  render: () => (
    <Field
      name="email"
      label="Email"
      hint="Enter a valid email address"
      component={InputField}
      validation={z.string().email('Please enter a valid email address')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Field with custom Zod validation schema. Error is shown on blur or submit.',
      },
    },
  },
};

export const WithMinLength: Story = {
  args: {
    name: 'title',
    label: 'Title',
    hint: 'Minimum 5 characters required',
    component: InputField,
    minLength: 5,
  },
};

export const WithMaxLength: Story = {
  args: {
    name: 'shortName',
    label: 'Short Name',
    hint: 'Maximum 10 characters allowed',
    component: InputField,
    maxLength: 10,
  },
};

export const WithPattern: Story = {
  args: {
    name: 'zipCode',
    label: 'ZIP Code',
    hint: 'US ZIP code format (e.g., 12345)',
    component: InputField,
    pattern: '^[0-9]{5}$',
  },
};

export const NestedFieldName: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <div className="flex w-96 flex-col gap-4">
        <Field
          name="user.profile.firstName"
          label="First Name"
          hint="Nested field: user.profile.firstName"
          component={InputField}
        />
        <Field
          name="user.profile.lastName"
          label="Last Name"
          hint="Nested field: user.profile.lastName"
          component={InputField}
        />
        <SubmitButton>Submit</SubmitButton>
      </div>
    </Form>
  ),
  decorators: [],
  parameters: {
    docs: {
      description: {
        story:
          'Fields can use dot notation in their names to create nested data structures. The form data will be structured as { user: { profile: { firstName: "...", lastName: "..." } } }',
      },
    },
  },
};

export const MultipleValidations: Story = {
  args: {
    name: 'password',
    label: 'Password',
    hint: 'Required, 8-20 characters',
    component: InputField,
    required: true,
    minLength: 8,
    maxLength: 20,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Field with multiple validation rules applied. Validations are checked in order: required, minLength, maxLength, pattern, etc.',
      },
    },
  },
};

export const AllValidationOptions: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <div className="flex w-96 flex-col gap-4">
        <Field
          name="requiredField"
          label="Required Field"
          hint="This field is required"
          component={InputField}
          required
        />
        <Field
          name="minLengthField"
          label="Min Length (3)"
          hint="Minimum 3 characters"
          component={InputField}
          minLength={3}
        />
        <Field
          name="maxLengthField"
          label="Max Length (10)"
          hint="Maximum 10 characters"
          component={InputField}
          maxLength={10}
        />
        <Field
          name="patternField"
          label="Pattern (letters only)"
          hint="Only letters allowed"
          component={InputField}
          pattern="^[a-zA-Z]+$"
        />
        <Field
          name="zodValidation"
          label="Zod Validation (email)"
          hint="Custom Zod schema"
          component={InputField}
          validation={z.string().email('Invalid email')}
        />
        <SubmitButton>Submit</SubmitButton>
      </div>
    </Form>
  ),
  decorators: [],
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the various built-in validation options: required, minLength, maxLength, pattern, and custom Zod validation.',
      },
    },
  },
};

export const Playground: Story = {
  args: {
    name: 'playground',
    label: 'Playground Field',
    hint: 'Use the controls to experiment with different props',
    component: InputField,
    required: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground - use the controls panel to experiment with different Field configurations.',
      },
    },
  },
};

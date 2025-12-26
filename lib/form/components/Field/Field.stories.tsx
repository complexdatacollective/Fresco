'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { z } from 'zod';
import { Field, Form, SubmitButton } from '../components';
import { InputField } from '../fields/InputField';
import { TextAreaField } from '../fields/TextArea';

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
    component: InputField,
    required: true,
    minLength: 8,
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
      component={InputField}
      custom={{
        schema: z.email('Enter a valid email address'),
        hint: 'Enter a valid email address',
      }}
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
    component: InputField,
    minLength: 5,
  },
};

export const WithMaxLength: Story = {
  args: {
    name: 'shortName',
    label: 'Short Name',
    component: InputField,
    maxLength: 10,
  },
};

export const WithPattern: Story = {
  args: {
    name: 'zipCode',
    label: 'ZIP Code',
    component: InputField,
    pattern: {
      regex: '^[0-9]{5}$',
      hint: 'Enter be a valid US ZIP code (e.g., 12345)',
      errorMessage: 'Not a valid ZIP code.',
    },
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

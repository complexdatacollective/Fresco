'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PersonStandingIcon } from 'lucide-react';
import { action } from 'storybook/actions';
import { z } from 'zod';
import { Field, FieldGroup, Form, SubmitButton } from '../components';
import { InputField } from '../components/fields/Input';
import { RadioGroupField } from '../components/fields/RadioGroup';
import { SelectField } from '../components/fields/Select';

const meta: Meta<typeof Form> = {
  title: 'Systems/Form',
  component: Form,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Form
      onSubmit={async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        action('form-submitted')(data);

        return {
          success: true,
        };
      }}
    >
      <Field
        name="name"
        label="Name"
        placeholder="Enter your name"
        hint="Please enter your full name"
        Component={InputField}
        validation={z
          .string()
          .min(2, 'Name must be at least 2 characters')

          .meta({ hintText: 'Must be at least 2 characters' })
          .optional()}
        prefixComponent={<PersonStandingIcon />}
      />
      <Field
        name="age"
        hint="Enter your age. You must be 18 or older."
        label="Age"
        Component={InputField}
        placeholder="Enter your age"
        showRequired
        validation={z
          .number()
          .min(18, 'You must be at least 18 years old')
          .prefault(0)}
        type="number"
      />
      <Field
        name="country"
        label="Country"
        hint="Select your country of residence"
        Component={SelectField}
        showRequired
        placeholder="Select a country"
        options={[
          { value: 'us', label: 'United States' },
          { value: 'uk', label: 'United Kingdom' },
          { value: 'ca', label: 'Canada' },
          { value: 'au', label: 'Australia' },
          { value: 'de', label: 'Germany' },
          { value: 'fr', label: 'France' },
          { value: 'jp', label: 'Japan' },
          { value: 'other', label: 'Other' },
        ]}
        validation={z.string().min(1, 'Please select a country')}
      />
      <Field
        name="preferredContact"
        label="Preferred Contact Method"
        showRequired
        hint="How would you like us to contact you?"
        Component={RadioGroupField}
        options={[
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
          { value: 'sms', label: 'SMS / Text Message' },
          { value: 'none', label: 'Please do not contact me' },
        ]}
        validation={z.string().min(1, 'Please select a contact method')}
        useColumns
      />
      <FieldGroup
        watch={['preferredContact']}
        condition={(values) => values.preferredContact === 'email'}
      >
        <Field
          name="email"
          label="Email"
          hint="Enter your email address"
          Component={InputField}
          placeholder="Enter your email"
          validation={z.string().email('Invalid email address')}
          type="email"
        />
      </FieldGroup>
      <FieldGroup
        watch={['preferredContact']}
        condition={(values) =>
          values.preferredContact === 'phone' ||
          values.preferredContact === 'sms'
        }
      >
        <Field
          name="phone"
          label="Phone"
          hint="Enter your phone number"
          Component={InputField}
          placeholder="Enter your phone number"
          validation={z.string().min(10, 'Invalid phone number')}
          type="tel"
        />
      </FieldGroup>

      <SubmitButton className="mt-6" />
    </Form>
  ),
};

export const WithSubmitErrors: Story = {
  render: () => (
    <Form
      onSubmit={async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        action('form-submitted')(data);

        // Simulate server-side validation errors
        // This demonstrates how to return both form-level and field-level errors
        const schema = z
          .object({
            username: z
              .string()
              .min(3, 'Username must be at least 3 characters'),
            email: z.string().email('Invalid email address'),
            password: z
              .string()
              .min(8, 'Password must be at least 8 characters'),
            confirmPassword: z.string(),
          })
          .refine((data) => data.password === data.confirmPassword, {
            message: 'Passwords do not match',
            path: [], // Empty path = form-level error
          })
          .refine((data) => data.username !== 'admin', {
            message: 'Username "admin" is already taken',
            path: ['username'], // Field-level error
          })
          .refine((data) => !data.email.endsWith('@blocked.com'), {
            message: 'Email domain is blocked',
            path: ['email'], // Field-level error
          });

        const result = schema.safeParse(data);

        if (!result.success) {
          return {
            success: false,
            errors: result.error,
          };
        }

        return {
          success: true,
        };
      }}
      className="elevation-high w-2xl rounded bg-white p-10"
    >
      <Field
        name="username"
        label="Username"
        placeholder="Enter username"
        hint="Try entering 'admin' to see a field-level error"
        Component={InputField}
        type="text"
      />
      <Field
        name="email"
        label="Email"
        placeholder="Enter email"
        hint="Try ending with '@blocked.com' to see a field-level error"
        Component={InputField}
        type="text"
      />
      <Field
        name="password"
        label="Password"
        placeholder="Enter password"
        hint="Enter different passwords to see a form-level error"
        Component={InputField}
        type="text"
      />
      <Field
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Confirm password"
        hint="Make sure passwords match"
        Component={InputField}
        type="text"
      />

      <SubmitButton className="mt-6" />
    </Form>
  ),
};

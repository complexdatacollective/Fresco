'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { z } from 'zod';
import { Field, FieldGroup, Form, SubmitButton } from '../components';
import { InputField } from '../components/fields/InputField';
import { RadioGroupField } from './fields/RadioGroup';
import { SelectField } from './fields/Select';
import { TextAreaField } from './fields/TextArea';

const meta: Meta<typeof Form> = {
  title: 'Systems/Form/Form',
  component: Form,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: {
      description: 'Handler called when form is submitted with valid data',
      table: {
        type: {
          summary:
            '(values: Record<string, FieldValue>) => Promise<FormSubmissionResult>',
        },
      },
    },
    children: {
      description: 'Form fields and submit button',
      table: {
        type: { summary: 'React.ReactNode' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <div className="flex w-96 flex-col gap-4">
        <Field name="name" label="Name" component={InputField} />
        <Field name="email" label="Email" component={InputField} />
        <SubmitButton>Submit</SubmitButton>
      </div>
    </Form>
  ),
};

export const WithValidation: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <div className="flex w-96 flex-col gap-4">
        <Field
          name="username"
          label="Username"
          hint="Must be at least 3 characters"
          component={InputField}
          required
          minLength={3}
        />
        <Field
          name="email"
          label="Email"
          hint="Enter a valid email address"
          component={InputField}
          required
          custom={z.string().email('Please enter a valid email address')}
        />
        <Field
          name="password"
          label="Password"
          hint="8-20 characters required"
          component={InputField}
          required
          minLength={8}
          maxLength={20}
        />
        <Field
          name="zipCode"
          label="ZIP Code"
          hint="5-digit US ZIP code"
          component={InputField}
          pattern="^[0-9]{5}$"
        />
        <SubmitButton>Create Account</SubmitButton>
      </div>
    </Form>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Form with various validation rules. Errors appear after blurring a field, then validate on subsequent changes. Try submitting with invalid data to see all errors.',
      },
    },
  },
};

export const BlurThenChangeValidation: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <div className="flex w-96 flex-col gap-4">
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-medium">Validation Behavior:</p>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>Start typing - no errors shown yet</li>
            <li>
              Click away (blur) - field validates, errors appear if invalid
            </li>
            <li>Continue typing - errors update in real-time</li>
          </ol>
        </div>
        <Field
          name="email"
          label="Email"
          hint="Type something invalid, then click away to see validation"
          component={InputField}
          custom={z.string().email('Please enter a valid email address')}
        />
        <Field
          name="minLength"
          label="Minimum Length Field"
          hint="Requires at least 5 characters"
          component={InputField}
          minLength={5}
        />
        <SubmitButton>Submit</SubmitButton>
      </div>
    </Form>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the "blur first, then validate on change" pattern. Users are not bombarded with errors while typing their first characters, but get real-time feedback on subsequent edits.',
      },
    },
  },
};

export const ConditionalFieldsWithFieldGroup: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <div className="flex w-96 flex-col gap-4">
        <Field
          name="hasAccount"
          label="Do you have an existing account?"
          component={RadioGroupField}
          options={[
            { value: 'yes', label: 'Yes, I have an account' },
            { value: 'no', label: 'No, I am new' },
          ]}
        />

        <FieldGroup
          watch={['hasAccount'] as const}
          condition={(values) => values.hasAccount === 'yes'}
        >
          <Field
            name="accountEmail"
            label="Account Email"
            hint="Enter your existing account email"
            component={InputField}
            custom={z.string().email('Please enter a valid email')}
          />
        </FieldGroup>

        <FieldGroup
          watch={['hasAccount'] as const}
          condition={(values) => values.hasAccount === 'no'}
        >
          <Field
            name="newEmail"
            label="Email"
            hint="We'll create a new account for you"
            component={InputField}
            required
            custom={z.string().email('Please enter a valid email')}
          />
          <Field
            name="newPassword"
            label="Choose a Password"
            hint="At least 8 characters"
            component={InputField}
            required
            minLength={8}
          />
        </FieldGroup>

        <SubmitButton>Continue</SubmitButton>
      </div>
    </Form>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'FieldGroup conditionally renders fields based on other field values. Select an option to see different fields appear with smooth animations.',
      },
    },
  },
};

export const NestedConditionalFields: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <div className="flex w-96 flex-col gap-4">
        <Field
          name="contactMethod"
          label="Preferred contact method"
          component={SelectField}
          options={[
            { value: '', label: 'Select a method...' },
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone' },
            { value: 'mail', label: 'Postal Mail' },
          ]}
        />

        <FieldGroup
          watch={['contactMethod'] as const}
          condition={(values) => values.contactMethod === 'email'}
        >
          <Field
            name="emailAddress"
            label="Email Address"
            component={InputField}
            required
            custom={z.string().email('Invalid email')}
          />
        </FieldGroup>

        <FieldGroup
          watch={['contactMethod'] as const}
          condition={(values) => values.contactMethod === 'phone'}
        >
          <Field
            name="phoneNumber"
            label="Phone Number"
            component={InputField}
            required
            pattern="^[0-9]{10}$"
          />
          <Field
            name="phoneType"
            label="Phone Type"
            component={RadioGroupField}
            options={[
              { value: 'mobile', label: 'Mobile' },
              { value: 'home', label: 'Home' },
              { value: 'work', label: 'Work' },
            ]}
          />

          <FieldGroup
            watch={['phoneType'] as const}
            condition={(values) => values.phoneType === 'work'}
          >
            <Field
              name="companyName"
              label="Company Name"
              hint="Required for work phone"
              component={InputField}
              required
            />
          </FieldGroup>
        </FieldGroup>

        <FieldGroup
          watch={['contactMethod'] as const}
          condition={(values) => values.contactMethod === 'mail'}
        >
          <Field
            name="street"
            label="Street Address"
            component={InputField}
            required
          />
          <Field name="city" label="City" component={InputField} required />
          <Field name="state" label="State" component={InputField} required />
          <Field
            name="zip"
            label="ZIP Code"
            component={InputField}
            required
            pattern="^[0-9]{5}$"
          />
        </FieldGroup>

        <SubmitButton>Save Preferences</SubmitButton>
      </div>
    </Form>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates nested conditional fields. Select "Phone" then "Work" to see a nested FieldGroup reveal additional fields.',
      },
    },
  },
};

export const MultiFieldCondition: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <div className="flex w-96 flex-col gap-4">
        <Field
          name="role"
          label="Your Role"
          component={SelectField}
          options={[
            { value: '', label: 'Select a role...' },
            { value: 'student', label: 'Student' },
            { value: 'professional', label: 'Professional' },
            { value: 'researcher', label: 'Researcher' },
          ]}
        />

        <Field
          name="experienceLevel"
          label="Experience Level"
          component={RadioGroupField}
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ]}
        />

        <FieldGroup
          watch={['role', 'experienceLevel'] as const}
          condition={(values) =>
            values.role === 'researcher' &&
            values.experienceLevel === 'advanced'
          }
        >
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
            Advanced researcher fields unlocked!
          </div>
          <Field
            name="publications"
            label="Number of Publications"
            component={InputField}
            custom={z.coerce.number().min(0, 'Must be a positive number')}
          />
          <Field
            name="researchArea"
            label="Primary Research Area"
            component={TextAreaField}
          />
        </FieldGroup>

        <FieldGroup
          watch={['role', 'experienceLevel'] as const}
          condition={(values) =>
            values.role === 'student' && values.experienceLevel === 'beginner'
          }
        >
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            Welcome! Here are some helpful fields for beginners.
          </div>
          <Field name="school" label="School Name" component={InputField} />
          <Field
            name="graduationYear"
            label="Expected Graduation Year"
            component={InputField}
            pattern="^[0-9]{4}$"
          />
        </FieldGroup>

        <SubmitButton>Submit Application</SubmitButton>
      </div>
    </Form>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'FieldGroup can watch multiple fields and show content based on combined conditions. Select "Researcher" + "Advanced" or "Student" + "Beginner" to see conditional content.',
      },
    },
  },
};

export const FormWithAllFieldTypes: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <div className="flex w-[500px] flex-col gap-4">
        <Field
          name="fullName"
          label="Full Name"
          hint="Enter your first and last name"
          component={InputField}
          required
        />

        <Field
          name="email"
          label="Email Address"
          component={InputField}
          required
          custom={z.string().email('Invalid email format')}
        />

        <Field
          name="country"
          label="Country"
          component={SelectField}
          options={[
            { value: '', label: 'Select your country...' },
            { value: 'us', label: 'United States' },
            { value: 'uk', label: 'United Kingdom' },
            { value: 'ca', label: 'Canada' },
            { value: 'au', label: 'Australia' },
            { value: 'other', label: 'Other' },
          ]}
          required
        />

        <Field
          name="gender"
          label="Gender"
          component={RadioGroupField}
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' },
          ]}
        />

        <Field
          name="bio"
          label="Short Bio"
          hint="Tell us about yourself (max 500 characters)"
          component={TextAreaField}
          maxLength={500}
        />

        <SubmitButton>Save Profile</SubmitButton>
      </div>
    </Form>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A complete form example showcasing various field types: text input, email with validation, select dropdown, radio group, and textarea.',
      },
    },
  },
};

export const SubmissionHandling: Story = {
  render: () => (
    <Form
      onSubmit={async (data) => {
        action('form-submitting')(data);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        action('form-submitted')(data);
        return { success: true };
      }}
    >
      <div className="flex w-96 flex-col gap-4">
        <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
          This form simulates a 2-second API call on submit. Watch the submit
          button show a loading state.
        </div>
        <Field
          name="message"
          label="Message"
          component={TextAreaField}
          required
        />
        <SubmitButton>Send Message</SubmitButton>
      </div>
    </Form>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates async form submission with loading state. The submit button will show a loading indicator during the simulated API call.',
      },
    },
  },
};

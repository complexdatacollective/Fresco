'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { PersonStandingIcon } from 'lucide-react';
import { z } from 'zod';
import { Field, FieldGroup, Form, SubmitButton } from '../components';
import { InputField } from '../components/fields/Input';
import { RadioGroupField } from '../components/fields/RadioGroup';
import { SelectField } from '../components/fields/Select';
import { FormStoreProvider } from '../store/formStoreProvider';

const meta: Meta<typeof Form> = {
  title: 'Systems/Form/Form',
  component: Form,
  decorators: [
    (Story) => (
      <FormStoreProvider>
        <Story />
      </FormStoreProvider>
    ),
  ],
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

        console.log('form-submitted', data);

        return {
          success: true,
        };
      }}
      className="w-2xl rounded-md bg-white p-10 shadow-2xl"
    >
      <Field
        name="name"
        label="Name"
        placeholder="Enter your name"
        hint="Please enter your full name"
        Component={InputField}
        validation={z.string().min(2, 'Name must be at least 2 characters')}
        prefixComponent={<PersonStandingIcon />}
      />
      <Field
        name="age"
        hint="Enter your age. You must be 18 or older."
        label="Age"
        Component={InputField}
        placeholder="Enter your age"
        validation={z.coerce
          .number()
          .min(18, 'You must be at least 18 years old')}
        type="number"
      />
      <Field
        name="country"
        label="Country"
        hint="Select your country of residence"
        Component={SelectField}
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
      {/* <Field
        name="hobbies"
        label="Hobbies"
        hint="Add your hobbies (at least 2 required)"
        Component={InputArrayField}
        placeholder="Enter hobby"
        addButtonText="Add Hobby"
        initialValue={['Reading']}
        validation={z
          .array(z.string().min(1, 'Hobby cannot be empty'))
          .min(2, 'At least 2 hobbies required')}
      /> */}

      <SubmitButton className="mt-6" />
    </Form>
  ),
};

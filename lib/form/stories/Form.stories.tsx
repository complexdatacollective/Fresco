import type { Meta, StoryObj } from '@storybook/react';
import { z } from 'zod';
import Field from '../components/Field';
import { InputField } from '../components/fields/Input';
import { InputArrayField } from '../components/fields/InputArrayField';
import { SelectField } from '../components/fields/Select';
import Form from '../components/Form';
import SubmitButton from '../components/SubmitButton';
import { FormStoreProvider } from '../store/formStoreProvider';

const meta: Meta<typeof Form> = {
  title: 'Form/Form',
  component: Form,
  decorators: [
    (Story) => (
      <FormStoreProvider>
        <div className="mx-auto max-w-2xl bg-white p-8">
          <Story />
        </div>
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
    <Form onSubmit={(data) => console.log('form-submitted', data)}>
      <Field
        name="name"
        label="Name"
        placeholder="Enter your name"
        hint="Please enter your full name"
        Component={InputField}
        validation={z.string().min(2, 'Name must be at least 2 characters')}
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
        name="verifyAge"
        hint="Enter your age again for verification"
        label="Age (verify)"
        Component={InputField}
        placeholder="Enter your age"
        validation={(context) =>
          z.coerce
            .number()
            .min(18, 'You must be at least 18 years old')
            .refine(async (val) => {
              console.log('context', context);

              const {
                formValues: { age },
              } = context;

              // Simulate an async validation
              await new Promise((resolve) => {
                setTimeout(() => {
                  resolve(val >= 18);
                }, 1000);
              });

              console.log('verifying age', val, age);

              return Number(val) === Number(age);
            }, 'Your answer must match the age you entered above')
        }
        type="number"
      />

      <Field
        name="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        hint="We'll use this to contact you"
        Component={InputField}
        validation={z.string().email('Please enter a valid email')}
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
      />

      <SubmitButton />
    </Form>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';
import { z } from 'zod';
import Field from '../components/Field';
import { InputField } from '../components/fields/Input';
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
      <SubmitButton />
    </Form>
  ),
};

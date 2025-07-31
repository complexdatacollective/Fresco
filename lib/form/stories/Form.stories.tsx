import type { Meta, StoryObj } from '@storybook/react';
import { z } from 'zod';
import { Field, Form, InputField, SubmitButton } from '../components/Form';

const meta: Meta<typeof Form> = {
  title: 'Form/Form',
  component: Form,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl bg-white p-8">
        <Story />
      </div>
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
      name="default-form"
      onSubmit={(data) => console.log('form-submitted', data)}
    >
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
        validation={() =>
          z.string().refine((val) => {
            const num = parseInt(val, 10);
            return !isNaN(num) && num >= 18;
          }, 'You must be at least 18 years old')
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

export const WithInitialValues: Story = {
  render: () => (
    <Form
      name="initial-values-form"
      onSubmit={(data) => console.log('form-submitted', data)}
    >
      <Field
        name="name"
        label="Name"
        placeholder="Enter your name"
        initialValue="John Doe"
        Component={InputField}
        validation={z.string().min(2, 'Name must be at least 2 characters')}
      />

      <Field
        name="age"
        hint="Enter your age. You must be 18 or older."
        label="Age"
        Component={InputField}
        placeholder="Enter your age"
        validation={() =>
          z.string().refine((val) => {
            const num = parseInt(val, 10);
            return !isNaN(num) && num >= 18;
          }, 'You must be at least 18 years old')
        }
        initialValue="25"
        type="number"
      />

      <Field
        name="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        initialValue="john@example.com"
        Component={InputField}
        validation={z.string().email('Please enter a valid email')}
      />
      <SubmitButton />
    </Form>
  ),
};

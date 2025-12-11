'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { action } from 'storybook/actions';
import { z } from 'zod';
import Surface from '~/components/layout/Surface';
import { Field, Form, SubmitButton } from '../components';
import { ArrayField } from '../components/fields/ArrayField/ArrayField';
import {
  Editor,
  SimpleItem,
} from '../components/fields/ArrayField/ItemRenderers';
import { InputField } from '../components/fields/InputField';
import { RichTextEditorField } from '../components/fields/RichTextEditor';

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

        if (data.name === 'admin') {
          return {
            fieldErrors: {
              name: 'The name "admin" is not allowed',
            },
            success: false,
          };
        }

        return {
          success: true,
        };
      }}
    >
      <Surface>
        <Field
          name="introductionPanel.title"
          label="Title"
          hint="The title of the introduction panel"
          component={InputField}
          required
          // maxLength={10}
          // minLength={2}
          // minValue={2}
          // maxValue={10}
          // minSelected={2}
          // maxSelected={5}
          // unique
          // differentFromField="example"
          // sameAsField="example"
          // greaterThanField="age"
          // lessThanField="age"
          validation={z.string().min(2, 'Title must be at least 2 characters')}
        />
        <Field
          name="introductionPanel.text"
          hint="The main text content of the introduction panel"
          label="Text"
          component={RichTextEditorField}
          required
        />
      </Surface>
      <Surface>
        <Field
          name="form"
          label="Form Fields"
          hint="Add one or more fields to your form to collect attributes about each node the participant creates. Use the drag handle on the left of each prompt adjust its order."
          component={ArrayField<{ id: string; label: string }>}
          required
          sortable
          addButtonLabel="Add Field"
          emptyStateMessage="No fields added yet. Click 'Add Field' to get started."
          itemTemplate={() => ({ id: crypto.randomUUID(), label: '' })}
          itemComponent={SimpleItem}
          editorComponent={Editor}
        />
      </Surface>
    </Form>
  ),
};

export const WithCustomComponents: Story = {
  render: () => (
    <Form
      onSubmit={async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        action('form-submitted')(data);
        return { success: true };
      }}
    >
      <Field
        name="tasks"
        label="Tasks"
        hint="Create and manage your tasks. Drag to reorder, click Edit to modify, or × to remove."
        component={ArrayField<{ id: string; label: string }>}
        required
        sortable
        itemComponent={SimpleItem}
        editorComponent={Editor}
        itemTemplate={() => ({
          id: crypto.randomUUID(),
          label: '',
        })}
      />
      <SubmitButton className="self-end">Submit</SubmitButton>
    </Form>
  ),
};

export const WithServerSideErrors: Story = {
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
            email: z.email('Invalid email address'),
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
      className="elevation-high bg-surface w-2xl rounded p-10"
    >
      <Field
        name="username"
        label="Username"
        hint="Try entering 'admin' to see a field-level error"
        component={InputField}
        type="text"
      />
      <Field
        name="email"
        label="Email"
        hint="Try ending with '@blocked.com' to see a field-level error"
        component={InputField}
        type="text"
      />
      <Field
        name="password"
        label="Password"
        hint="Enter different passwords to see a form-level error"
        component={InputField}
        type="text"
      />
      <Field
        name="confirmPassword"
        label="Confirm Password"
        hint="Make sure passwords match"
        component={InputField}
        type="text"
      />

      <SubmitButton className="mt-6" />
    </Form>
  ),
};

'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PersonStandingIcon } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { createPortal } from 'react-dom';
import { action } from 'storybook/actions';
import { z } from 'zod';
import { Field, Form, SubmitButton } from '../components';
import { InputField } from '../components/fields/Input';
import { MultiSelectField } from '../components/fields/MultiSelectField';

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
      <Field
        name="name"
        label="Name"
        hint="Please enter your full name"
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
        prefixComponent={<PersonStandingIcon />}
        validation={z.string().min(2, 'Name must be at least 2 characters')}
      />
      <Field
        name="tags"
        label="Tags"
        hint="Create at least 2 tags (max 5). Items are sortable - drag to reorder!"
        component={MultiSelectField}
        required
        sortable
        initialValue={[
          { label: 'Example Tag', id: 'example-tag' },
          { label: 'Another Tag', id: 'another-tag' },
        ]}
        validation={z
          .array(z.any())
          .min(2, 'Please add at least 2 tags')
          .max(5, 'You can add up to 5 tags')}
        EditorComponent={(props) => {
          const { onCancel, onSave, item, layoutId } = props;

          return createPortal(
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 z-50 m-auto flex w-96 flex-col gap-4 rounded-lg bg-white p-6 shadow-lg"
            >
              <InputField
                type="text"
                value={item?.label ?? ''}
                onChange={(e) => {
                  // Create a new item object with updated label
                  const updatedItem = {
                    ...item,
                    label: e.target.value,
                  };
                  // Call onSave with updated item
                  onSave(updatedItem);
                }}
                placeholder="Enter tag label..."
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (item) {
                      onSave(item);
                    }
                  }}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </motion.div>,
            document.body,
          );
        }}
      />
      {/* <Field
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
      </FieldGroup> */}

      <SubmitButton className="self-end" />
    </Form>
  ),
};

export const WithCustomComponents: Story = {
  render: () => {
    type Task = {
      id: string;
      label: string;
      priority: 'low' | 'medium' | 'high';
      completed: boolean;
    };

    const TaskItemComponent = ({
      item,
      onEdit,
      onRemove,
    }: {
      item: Task;
      onEdit?: () => void;
      onRemove?: () => void;
    }) => {
      const priorityColors = {
        low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        medium:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      };

      return (
        <div className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm dark:bg-slate-800">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold ${item.completed ? 'line-through opacity-50' : ''}`}
              >
                {item.label}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[item.priority]}`}
              >
                {item.priority}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Edit
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-destructive rounded px-2 py-1 hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                ×
              </button>
            )}
          </div>
        </div>
      );
    };

    const TaskEditorComponent = ({
      item,
      onSave,
      onCancel,
    }: {
      item?: Task;
      onSave: (item: Task) => void;
      onCancel: () => void;
    }) => {
      const [label, setLabel] = React.useState(item?.label ?? '');
      const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>(
        item?.priority ?? 'medium',
      );
      const [completed, setCompleted] = React.useState(
        item?.completed ?? false,
      );

      return (
        <div className="flex flex-col gap-2 rounded-lg border bg-white p-3 shadow-sm dark:bg-slate-800">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 rounded border bg-white px-2 py-1 dark:bg-slate-900"
            placeholder="Task name..."
            autoFocus
          />
          <div className="flex items-center gap-2">
            <label className="text-sm">Priority:</label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as 'low' | 'medium' | 'high')
              }
              className="rounded border bg-white px-2 py-1 text-sm dark:bg-slate-900"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
              />
              Completed
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (label.trim()) {
                  onSave({
                    id: item?.id ?? crypto.randomUUID(),
                    label: label.trim(),
                    priority,
                    completed,
                  });
                }
              }}
              className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded px-3 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    };

    return (
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
          component={MultiSelectField<Task>}
          required
          min={1}
          sortable
          ItemComponent={TaskItemComponent}
          EditorComponent={TaskEditorComponent}
        />
        <SubmitButton className="self-end" />
      </Form>
    );
  },
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

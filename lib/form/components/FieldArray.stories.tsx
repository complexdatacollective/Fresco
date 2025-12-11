'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Reorder, useDragControls } from 'motion/react';
import { action } from 'storybook/actions';
import { z } from 'zod';
import Surface from '~/components/layout/Surface';
import { Button, IconButton } from '~/components/ui/Button';
import Field from './Field';
import FieldArray from './FieldArray';
import Form from './Form';
import SubmitButton from './SubmitButton';
import { InputField } from './fields/InputField';
import { SelectField } from './fields/Select';
import type { FieldArrayItemWrapper } from '../hooks/useFieldArray';

const meta: Meta<typeof FieldArray> = {
  title: 'Systems/Form/FieldArray',
  component: FieldArray,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

type Person = {
  firstName: string;
  lastName: string;
  email: string;
};

export const BasicUsage: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return { success: true };
      }}
    >
      <Surface>
        <FieldArray<Person>
          name="people"
          label="Team Members"
          hint="Add team members to your project"
        >
          {({ fields }) => (
            <div className="flex flex-col gap-4">
              {fields.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No team members added yet
                </p>
              )}
              {fields.map((item, index) => (
                <div
                  key={item._key}
                  className="bg-surface-1 flex flex-col gap-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Member {index + 1}
                    </span>
                    <IconButton
                      size="sm"
                      variant="text"
                      color="destructive"
                      onClick={() => fields.removeByKey(item._key)}
                      icon={<Trash2 />}
                      aria-label="Remove member"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      name={`people.${item._key}.firstName`}
                      label="First Name"
                      component={InputField}
                      initialValue={item.data.firstName}
                    />
                    <Field
                      name={`people.${item._key}.lastName`}
                      label="Last Name"
                      component={InputField}
                      initialValue={item.data.lastName}
                    />
                  </div>
                  <Field
                    name={`people.${item._key}.email`}
                    label="Email"
                    component={InputField}
                    initialValue={item.data.email}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  fields.push({ firstName: '', lastName: '', email: '' })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
          )}
        </FieldArray>
      </Surface>
      <SubmitButton className="self-end">Save Team</SubmitButton>
    </Form>
  ),
};

type Task = {
  title: string;
  priority: 'low' | 'medium' | 'high';
};

// Reorderable task item component
function ReorderableTaskItem({
  item,
  onRemove,
}: {
  item: FieldArrayItemWrapper<Task>;
  onRemove: () => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="bg-surface-1 flex items-center gap-3 rounded-lg border p-3"
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex flex-1 items-center gap-3">
        <div className="flex-1">
          <Field
            name={`tasks.${item._key}.title`}
            label="Task"
            component={InputField}
            initialValue={item.data.title}
          />
        </div>
        <div className="w-32">
          <Field
            name={`tasks.${item._key}.priority`}
            label="Priority"
            component={SelectField}
            initialValue={item.data.priority ?? 'medium'}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
        </div>
      </div>
      <IconButton
        size="sm"
        variant="text"
        color="destructive"
        onClick={onRemove}
        icon={<Trash2 />}
        aria-label="Remove task"
      />
    </Reorder.Item>
  );
}

export const WithDragReorder: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return { success: true };
      }}
    >
      <Surface>
        <FieldArray<Task>
          name="tasks"
          label="Tasks"
          hint="Drag the handle to reorder tasks"
          initialValue={[
            { title: 'First task', priority: 'high' },
            { title: 'Second task', priority: 'medium' },
            { title: 'Third task', priority: 'low' },
          ]}
        >
          {({ fields }) => (
            <div className="flex flex-col gap-2">
              {fields.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No tasks yet. Add one to get started!
                </p>
              )}
              <Reorder.Group
                axis="y"
                values={fields.items}
                onReorder={fields.handleReorder}
                className="flex flex-col gap-2"
              >
                {fields.map((item) => (
                  <ReorderableTaskItem
                    key={item._key}
                    item={item}
                    onRemove={() => fields.removeByKey(item._key)}
                  />
                ))}
              </Reorder.Group>
              <Button
                type="button"
                variant="outline"
                onClick={() => fields.push({ title: '', priority: 'medium' })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
          )}
        </FieldArray>
      </Surface>
      <SubmitButton className="self-end">Save Tasks</SubmitButton>
    </Form>
  ),
};

type SimpleItem = string;

export const SimpleStringArray: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return { success: true };
      }}
    >
      <Surface>
        <FieldArray<SimpleItem>
          name="tags"
          label="Tags"
          hint="Add tags to categorize your content"
          initialValue={['react', 'typescript']}
        >
          {({ fields }) => (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {fields.map((item) => (
                  <div
                    key={item._key}
                    className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-3 py-1"
                  >
                    <span className="text-sm">{item.data || 'Empty tag'}</span>
                    <button
                      type="button"
                      onClick={() => fields.removeByKey(item._key)}
                      className="hover:bg-primary/20 ml-1 rounded-full p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <InputField
                  id="new-tag"
                  placeholder="Enter a tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        fields.push(input.value.trim());
                        input.value = '';
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById(
                      'new-tag',
                    ) as HTMLInputElement;
                    if (input?.value.trim()) {
                      fields.push(input.value.trim());
                      input.value = '';
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </FieldArray>
      </Surface>
      <SubmitButton className="self-end">Save</SubmitButton>
    </Form>
  ),
};

type Address = {
  street: string;
  city: string;
  country: string;
};

export const WithInitialValues: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return { success: true };
      }}
    >
      <Surface>
        <FieldArray<Address>
          name="addresses"
          label="Addresses"
          hint="Edit or add addresses"
          initialValue={[
            { street: '123 Main St', city: 'New York', country: 'USA' },
            { street: '456 Oak Ave', city: 'Los Angeles', country: 'USA' },
          ]}
        >
          {({ fields }) => (
            <div className="flex flex-col gap-4">
              {fields.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No addresses added yet
                </p>
              )}
              {fields.map((item, index) => (
                <div
                  key={item._key}
                  className="bg-surface-1 flex flex-col gap-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Address {index + 1}
                    </span>
                    <IconButton
                      size="sm"
                      variant="text"
                      color="destructive"
                      onClick={() => fields.removeByKey(item._key)}
                      icon={<Trash2 />}
                      aria-label="Remove address"
                    />
                  </div>
                  <Field
                    name={`addresses.${item._key}.street`}
                    label="Street"
                    component={InputField}
                    initialValue={item.data.street}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      name={`addresses.${item._key}.city`}
                      label="City"
                      component={InputField}
                      initialValue={item.data.city}
                      required
                    />
                    <Field
                      name={`addresses.${item._key}.country`}
                      label="Country"
                      component={InputField}
                      initialValue={item.data.country}
                      required
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  fields.push({ street: '', city: '', country: '' })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </div>
          )}
        </FieldArray>
      </Surface>
      <SubmitButton className="self-end">Save Addresses</SubmitButton>
    </Form>
  ),
};

export const ArrayMethods: Story = {
  name: 'Array Methods Demo',
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return { success: true };
      }}
    >
      <Surface>
        <FieldArray<string>
          name="items"
          label="Items"
          hint="Demonstrates all available array methods"
          initialValue={['First', 'Second', 'Third']}
        >
          {({ fields }) => (
            <div className="flex flex-col gap-4">
              <div className="bg-surface-2 rounded-lg p-4">
                <p className="mb-2 text-sm font-medium">
                  Current items ({fields.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {fields.map((item, index) => (
                    <div
                      key={item._key}
                      className="bg-surface-1 flex items-center gap-2 rounded border px-3 py-1.5"
                    >
                      <span className="text-muted-foreground text-xs">
                        [{index}]
                      </span>
                      <span>{item.data}</span>
                      <button
                        type="button"
                        onClick={() => fields.removeByKey(item._key)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fields.push(`Item ${fields.length + 1}`)}
                >
                  push()
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fields.pop()}
                  disabled={fields.length === 0}
                >
                  pop()
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fields.unshift(`First Item`)}
                >
                  unshift()
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fields.shift()}
                  disabled={fields.length === 0}
                >
                  shift()
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fields.insert(1, 'Inserted')}
                  disabled={fields.length === 0}
                >
                  insert(1, &apos;Inserted&apos;)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fields.remove(0)}
                  disabled={fields.length === 0}
                >
                  remove(0)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fields.swap(0, 1)}
                  disabled={fields.length < 2}
                >
                  swap(0, 1)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fields.move(0, fields.length - 1)}
                  disabled={fields.length < 2}
                >
                  move(0, last)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fields.update(0, 'Updated!')}
                  disabled={fields.length === 0}
                >
                  update(0)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fields.replace(['A', 'B', 'C'])}
                >
                  replace([A,B,C])
                </Button>
              </div>
            </div>
          )}
        </FieldArray>
      </Surface>
      <SubmitButton className="self-end">Submit</SubmitButton>
    </Form>
  ),
};

type ContactInfo = {
  name: string;
  email: string;
  phone: string;
};

export const WithValidation: Story = {
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return { success: true };
      }}
    >
      <Surface>
        <FieldArray<ContactInfo>
          name="contacts"
          label="Emergency Contacts"
          hint="Add contacts with validated fields. Try submitting with empty or invalid fields."
        >
          {({ fields }) => (
            <div className="flex flex-col gap-4">
              {fields.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No contacts added. Click below to add one.
                </p>
              )}
              {fields.map((item, index) => (
                <div
                  key={item._key}
                  className="bg-surface-1 flex flex-col gap-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Contact {index + 1}
                    </span>
                    <IconButton
                      size="sm"
                      variant="text"
                      color="destructive"
                      onClick={() => fields.removeByKey(item._key)}
                      icon={<Trash2 />}
                      aria-label="Remove contact"
                    />
                  </div>
                  <Field
                    name={`contacts.${item._key}.name`}
                    label="Full Name"
                    component={InputField}
                    initialValue={item.data.name}
                    validation={z
                      .string()
                      .min(2, 'Name must be at least 2 characters')}
                    required
                  />
                  <Field
                    name={`contacts.${item._key}.email`}
                    label="Email Address"
                    component={InputField}
                    initialValue={item.data.email}
                    validation={z
                      .string()
                      .email('Please enter a valid email address')}
                    required
                  />
                  <Field
                    name={`contacts.${item._key}.phone`}
                    label="Phone Number"
                    hint="Format: 123-456-7890"
                    component={InputField}
                    initialValue={item.data.phone}
                    validation={z
                      .string()
                      .regex(
                        /^\d{3}-\d{3}-\d{4}$/,
                        'Phone must be in format: 123-456-7890',
                      )}
                    required
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => fields.push({ name: '', email: '', phone: '' })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </div>
          )}
        </FieldArray>
      </Surface>
      <SubmitButton className="self-end">Save Contacts</SubmitButton>
    </Form>
  ),
};

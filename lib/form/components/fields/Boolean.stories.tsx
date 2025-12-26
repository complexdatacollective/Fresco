import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { BooleanField } from './Boolean';

const meta: Meta<typeof BooleanField> = {
  title: 'Systems/Form/Fields/BooleanField',
  component: BooleanField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-invalid': { control: 'boolean' },
    'value': {
      control: 'radio',
      options: [true, false, null],
      description: 'Current value of the boolean field',
      table: {
        type: { summary: 'boolean | null' },
        defaultValue: { summary: 'null' },
      },
    },
    'disabled': {
      control: 'boolean',
      description: 'Whether the field is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'readOnly': {
      control: 'boolean',
      description: 'Whether the field is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'noReset': {
      control: 'boolean',
      description: 'Hide the reset button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'options': {
      control: 'object',
      description: 'Custom options for yes/no buttons',
      table: {
        type: { summary: 'Array<{ label: string; value: boolean }>' },
        defaultValue: {
          summary:
            '[{ label: "Yes. I wish to participate in the study in accordance with the terms outlined above.", value: true }, { label: "No. I decline to participate, and wish to immediately withdraw from this study.", value: false }]',
        },
      },
    },
    'aria-invalid': {
      control: 'radio',
      options: [undefined, true, false],
      description: 'Indicates the field has a validation error',
      table: {
        type: { summary: "'true' | 'false' | boolean" },
        defaultValue: { summary: 'undefined' },
      },
    },
    'onChange': {
      action: 'onChange',
      description: 'Callback when value changes',
      table: {
        type: { summary: '(value: boolean | null) => void' },
      },
    },
  },
  args: {
    disabled: false,
    readOnly: false,
    noReset: false,
    options: [
      {
        label:
          'Yes. I wish to participate in the study in accordance with the terms outlined above.',
        value: true,
      },
      {
        label:
          'No. I decline to participate, and wish to immediately withdraw from this study.',
        value: false,
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<boolean | null>(null);

    return (
      <div className="w-full max-w-2xl">
        <BooleanField
          value={value}
          onChange={setValue}
          options={[
            {
              label:
                'Yes. I wish to participate in the study in accordance with the terms outlined above.',
              value: true,
            },
            {
              label:
                'No. I decline to participate in the study, and wish to immediately withdraw.',
              value: false,
            },
          ]}
        />
      </div>
    );
  },
};

export const DisabledWithSelection: Story = {
  render: () => {
    return (
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <p className="mb-2 text-sm font-medium">
            Disabled with Yes selected:
          </p>
          <BooleanField
            value={true}
            disabled
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Disabled with No selected:</p>
          <BooleanField
            value={false}
            disabled
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">
            Disabled with no selection:
          </p>
          <BooleanField
            value={null}
            disabled
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ]}
          />
        </div>
      </div>
    );
  },
};

export const Invalid: Story = {
  render: () => {
    const [value, setValue] = useState<boolean | null>(null);

    return (
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <p className="mb-2 text-sm font-medium">Invalid with no selection:</p>
          <BooleanField
            value={value}
            onChange={setValue}
            aria-invalid={true}
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Invalid with Yes selected:</p>
          <BooleanField
            value={true}
            aria-invalid={true}
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Invalid with No selected:</p>
          <BooleanField
            value={false}
            aria-invalid={true}
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ]}
          />
        </div>
      </div>
    );
  },
};

export const ReadOnly: Story = {
  render: () => {
    return (
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <p className="mb-2 text-sm font-medium">
            Read-only with Yes selected:
          </p>
          <BooleanField
            value={true}
            readOnly
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">
            Read-only with No selected:
          </p>
          <BooleanField
            value={false}
            readOnly
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">
            Read-only with no selection:
          </p>
          <BooleanField
            value={null}
            readOnly
            options={[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ]}
          />
        </div>
      </div>
    );
  },
};

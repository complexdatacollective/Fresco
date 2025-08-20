import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BooleanField } from './Boolean';

const meta: Meta<typeof BooleanField> = {
  title: 'Components/Fields/BooleanField',
  component: BooleanField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'radio',
      options: [true, false, null],
      description: 'Current value of the boolean field',
      table: {
        type: { summary: 'boolean | null' },
        defaultValue: { summary: 'null' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the field is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    noReset: {
      control: 'boolean',
      description: 'Hide the reset button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    options: {
      control: false,
      description: 'Custom options for yes/no buttons',
      table: {
        type: { summary: 'Array<{ label: string; value: boolean }>' },
        defaultValue: { summary: '[{ label: "Yes", value: true }, { label: "No", value: false }]' },
      },
    },
    onChange: {
      action: 'onChange',
      description: 'Callback when value changes',
      table: {
        type: { summary: '(value: boolean | null) => void' },
      },
    },
  },
  args: {
    disabled: false,
    noReset: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<boolean | null>(null);

    return (
      <div className="w-full max-w-md">
        <BooleanField
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    value: true,
    disabled: true,
  },
};
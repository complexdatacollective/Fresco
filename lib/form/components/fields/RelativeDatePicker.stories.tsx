import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RelativeDatePickerField } from './RelativeDatePicker';

const meta: Meta<typeof RelativeDatePickerField> = {
  title: 'Components/Fields/RelativeDatePickerField',
  component: RelativeDatePickerField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    anchor: {
      control: 'text',
      description: 'Anchor date as ISO string (defaults to today)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'today' },
      },
    },
    before: {
      control: 'number',
      description: 'Number of days before anchor date to allow',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '180' },
      },
    },
    after: {
      control: 'number',
      description: 'Number of days after anchor date to allow',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the date picker is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    defaultValue: {
      control: 'text',
      description: 'Default date value (YYYY-MM-DD format)',
      table: {
        type: { summary: 'string' },
      },
    },
    onChange: {
      action: 'onChange',
      description: 'Callback when date value changes',
      table: {
        type: { summary: '(event: ChangeEvent<HTMLInputElement>) => void' },
      },
    },
  },
  args: {
    before: 180,
    after: 0,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div className="w-full max-w-md">
        <RelativeDatePickerField
          before={30}
          after={30}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    before: 30,
    after: 30,
  },
};
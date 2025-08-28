import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DatePickerField } from './DatePicker';

const meta: Meta<typeof DatePickerField> = {
  title: 'Components/Fields/DatePickerField',
  component: DatePickerField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the date picker is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the date picker is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the date picker is required',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    min: {
      control: 'text',
      description: 'Minimum date (YYYY-MM-DD format)',
      table: {
        type: { summary: 'string' },
      },
    },
    max: {
      control: 'text',
      description: 'Maximum date (YYYY-MM-DD format)',
      table: {
        type: { summary: 'string' },
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
    type: {
      control: 'select',
      options: ['full', 'month', 'year'],
      description: 'The type of date input',
      table: {
        type: { summary: 'string' },
      },
    },
  },
  args: {
    disabled: false,
    readOnly: false,
    required: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    disabled: false,
  },

  render: () => {
    const [selectedDate, setSelectedDate] = useState('');

    return (
      <div className="w-full max-w-md">
        <DatePickerField
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          aria-label="Select Date"
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    'disabled': true,
    'defaultValue': '2024-01-01',
    'aria-label': 'Disabled Date',
  },
};

export const Month: Story = {
  args: {
    'type': 'month',
    'defaultValue': '2024-01',
    'aria-label': 'Select Month',
  },
};

export const Year: Story = {
  args: {
    'type': 'year',
    'defaultValue': '2024',
    'aria-label': 'Select Year',
  },
};

export const WithMinMax: Story = {
  args: {
    'type': 'full',
    'min': '2024-01-01',
    'max': '2024-12-31',
    'defaultValue': '2024-06-15',
    'aria-label': 'Select Date',
  },
};

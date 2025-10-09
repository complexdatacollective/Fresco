import type { Meta, StoryObj } from '@storybook/nextjs-vite';
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
          onChange={(value: string) => setSelectedDate(value)}
          aria-label="Select Date"
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    'disabled': true,
    'aria-label': 'Disabled Date',
  },
};

export const Month: Story = {
  args: {
    'type': 'month',
    'aria-label': 'Select Month',
  },
};

export const Year: Story = {
  args: {
    'type': 'year',
    'aria-label': 'Select Year',
  },
};

export const WithMinMax: Story = {
  args: {
    'type': 'full',
    'min': '2024-01-01',
    'max': '2024-12-31',
    'aria-label': 'Select Date',
  },
};

export const MonthYearWithMinMax: Story = {
  args: {
    'type': 'month',
    'min': '2022-01-01',
    'max': '2023-12-31',
    'aria-label': 'Select Date',
  },
};

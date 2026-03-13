import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import DatePickerField from './DatePicker';

const meta: Meta<typeof DatePickerField> = {
  title: 'Systems/Form/Fields/DatePickerField',
  component: DatePickerField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-invalid': { control: 'boolean' },
    'readOnly': {
      control: 'boolean',
      description: 'Whether the date picker is read-only',
    },
    'type': {
      control: 'select',
      options: ['full', 'month', 'year'],
      description:
        'Type of date input - full (native date picker), month (select dropdowns), or year (select dropdown)',
      table: {
        type: { summary: 'full | month | year' },
        defaultValue: { summary: 'full' },
      },
    },
    'disabled': {
      control: 'boolean',
      description: 'Whether the date picker is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'required': {
      control: 'boolean',
      description: 'Whether the date picker is required (HTML validation)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'min': {
      control: 'text',
      description: 'Minimum date (YYYY-MM-DD format) - defaults to 1920-01-01',
      table: {
        type: { summary: 'string' },
      },
    },
    'max': {
      control: 'text',
      description: 'Maximum date (YYYY-MM-DD format) - defaults to today',
      table: {
        type: { summary: 'string' },
      },
    },
    'value': {
      control: 'text',
      description: 'Current date value (YYYY-MM-DD or YYYY-MM format)',
      table: {
        type: { summary: 'string' },
      },
    },
    'onChange': {
      control: false,
      description: 'Change handler - receives date string value',
      table: {
        type: { summary: '(value: string) => void' },
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

export const FullDate: Story = {
  name: 'Full Date Picker',
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div className="w-full max-w-md space-y-2">
        <DatePickerField
          type="full"
          value={value}
          onChange={(v) => setValue(v ?? '')}
          name="full-date"
        />
        <Paragraph margin="none" className="text-xs text-current opacity-70">
          Selected: {value || 'none'}
        </Paragraph>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Native HTML date picker with calendar interface. Uses the browser&apos;s built-in date picker.',
      },
    },
  },
};

export const MonthYear: Story = {
  name: 'Month/Year Picker',
  render: () => {
    const [value, setValue] = useState<string | undefined>(undefined);

    return (
      <div className="w-full max-w-md space-y-2">
        <DatePickerField
          type="month"
          value={value}
          onChange={(v) => setValue(v ?? '')}
          name="month-year"
        />
        <Paragraph margin="none" className="text-xs text-current opacity-70">
          Selected: {value ?? 'none'}
        </Paragraph>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Custom month and year picker using select dropdowns. Returns value in YYYY-MM format.',
      },
    },
  },
};

export const YearOnly: Story = {
  name: 'Year Only Picker',
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div className="w-full max-w-md space-y-2">
        <DatePickerField
          type="year"
          value={value}
          onChange={(v) => setValue(v ?? '')}
          name="year-only"
        />
        <Paragraph margin="none" className="text-xs text-current opacity-70">
          Selected: {value || 'none'}
        </Paragraph>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Year-only picker using a select dropdown. Useful for birth years or year-based selections.',
      },
    },
  },
};

export const AllTypes: Story = {
  name: 'All Types Comparison',
  render: () => {
    const [fullDate, setFullDate] = useState('');
    const [monthYear, setMonthYear] = useState('');
    const [year, setYear] = useState('');

    return (
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div>
          <Heading level="h3" margin="none" className="mb-2 text-sm">
            Full Date
          </Heading>
          <DatePickerField
            type="full"
            value={fullDate}
            onChange={(v) => setFullDate(v ?? '')}
            name="full-comparison"
          />
          <Paragraph
            margin="none"
            className="mt-1 text-xs text-current opacity-70"
          >
            Value: {fullDate || 'none'}
          </Paragraph>
        </div>
        <div>
          <Heading level="h3" margin="none" className="mb-2 text-sm">
            Month/Year
          </Heading>
          <DatePickerField
            type="month"
            value={monthYear}
            onChange={(v) => setMonthYear(v ?? '')}
            name="month-comparison"
          />
          <Paragraph
            margin="none"
            className="mt-1 text-xs text-current opacity-70"
          >
            Value: {monthYear || 'none'}
          </Paragraph>
        </div>
        <div>
          <Heading level="h3" margin="none" className="mb-2 text-sm">
            Year Only
          </Heading>
          <DatePickerField
            type="year"
            value={year}
            onChange={(v) => setYear(v ?? '')}
            name="year-comparison"
          />
          <Paragraph
            margin="none"
            className="mt-1 text-xs text-current opacity-70"
          >
            Value: {year || 'none'}
          </Paragraph>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'All three date picker types side by side for comparison',
      },
    },
  },
};

export const WithConstraints: Story = {
  name: 'With Min/Max Constraints',
  render: () => {
    const [fullDate, setFullDate] = useState('');
    const [monthYear, setMonthYear] = useState('');
    const [year, setYear] = useState('');

    return (
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div>
          <Heading level="h3" margin="none" className="mb-2 text-sm">
            Full Date (2024 only)
          </Heading>
          <DatePickerField
            type="full"
            min="2024-01-01"
            max="2024-12-31"
            value={fullDate}
            onChange={(v) => setFullDate(v ?? '')}
            name="constrained-full"
          />
          <Paragraph
            margin="none"
            className="mt-1 text-xs text-current opacity-70"
          >
            Range: Jan 1, 2024 - Dec 31, 2024
          </Paragraph>
        </div>
        <div>
          <Heading level="h3" margin="none" className="mb-2 text-sm">
            Month/Year (2022-2023)
          </Heading>
          <DatePickerField
            type="month"
            min="2022-01-01"
            max="2023-12-31"
            value={monthYear}
            onChange={(v) => setMonthYear(v ?? '')}
            name="constrained-month"
          />
          <Paragraph
            margin="none"
            className="mt-1 text-xs text-current opacity-70"
          >
            Range: Jan 2022 - Dec 2023
          </Paragraph>
        </div>
        <div>
          <Heading level="h3" margin="none" className="mb-2 text-sm">
            Year (1990-2000)
          </Heading>
          <DatePickerField
            type="year"
            min="1990-01-01"
            max="2000-12-31"
            value={year}
            onChange={(v) => setYear(v ?? '')}
            name="constrained-year"
          />
          <Paragraph
            margin="none"
            className="mt-1 text-xs text-current opacity-70"
          >
            Range: 1990 - 2000
          </Paragraph>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date pickers with min/max constraints. Month picker intelligently limits available months based on the selected year.',
      },
    },
  },
};

export const AllStates: Story = {
  name: 'All States Comparison',
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div>
        <Heading level="h3" margin="none" className="mb-2 text-sm">
          Full Date
        </Heading>
        <div className="space-y-3">
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Normal
            </Paragraph>
            <DatePickerField
              type="full"
              value="2024-06-15"
              onChange={() => {
                // no-op
              }}
              name="normal-full"
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Disabled
            </Paragraph>
            <DatePickerField
              type="full"
              disabled
              value="2024-06-15"
              onChange={() => {
                // no-op
              }}
              name="disabled-full"
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Read-Only
            </Paragraph>
            <DatePickerField
              type="full"
              readOnly
              value="2024-06-15"
              onChange={() => {
                // no-op
              }}
              name="readonly-full"
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Invalid
            </Paragraph>
            <DatePickerField
              type="full"
              aria-invalid
              value="2024-06-15"
              onChange={() => {
                // no-op
              }}
              name="invalid-full"
            />
          </div>
        </div>
      </div>

      <div>
        <Heading level="h3" margin="none" className="mb-2 text-sm">
          Month/Year
        </Heading>
        <div className="space-y-3">
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Normal
            </Paragraph>
            <DatePickerField
              type="month"
              value="2024-06"
              onChange={() => {
                // no-op
              }}
              name="normal-month"
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Disabled
            </Paragraph>
            <DatePickerField
              type="month"
              disabled
              value="2024-06"
              onChange={() => {
                // no-op
              }}
              name="disabled-month"
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Read-Only
            </Paragraph>
            <DatePickerField
              type="month"
              readOnly
              value="2024-06"
              onChange={() => {
                // no-op
              }}
              name="readonly-month"
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Invalid
            </Paragraph>
            <DatePickerField
              type="month"
              aria-invalid
              value="2024-06"
              onChange={() => {
                // no-op
              }}
              name="invalid-month"
            />
          </div>
        </div>
      </div>

      <div>
        <Heading level="h3" margin="none" className="mb-2 text-sm">
          Year Only
        </Heading>
        <div className="space-y-3">
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Normal
            </Paragraph>
            <DatePickerField
              type="year"
              value="2024"
              onChange={() => {
                // no-op
              }}
              name="normal-year"
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Disabled
            </Paragraph>
            <DatePickerField
              type="year"
              disabled
              value="2024"
              onChange={() => {
                // no-op
              }}
              name="disabled-year"
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Read-Only
            </Paragraph>
            <DatePickerField
              type="year"
              readOnly
              value="2024"
              onChange={() => {
                // no-op
              }}
              name="readonly-year"
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Invalid
            </Paragraph>
            <DatePickerField
              type="year"
              aria-invalid
              value="2024"
              onChange={() => {
                // no-op
              }}
              name="invalid-year"
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All field states for each date picker type. State priority: disabled > readOnly > invalid > normal',
      },
    },
  },
};

export const BirthDateExample: Story = {
  name: 'Example: Birth Date',
  render: () => {
    const [birthDate, setBirthDate] = useState('');
    const today = new Date();
    const maxDate = today.toISOString().split('T')[0];
    const minDate = new Date(today.getFullYear() - 120, 0, 1)
      .toISOString()
      .split('T')[0];

    return (
      <div className="w-full max-w-md space-y-3">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Date of Birth
          </label>
          <DatePickerField
            type="full"
            value={birthDate}
            onChange={(v) => setBirthDate(v ?? '')}
            min={minDate}
            max={maxDate}
            required
            name="birth-date"
          />
        </div>
        {birthDate && (
          <Paragraph margin="none" className="text-xs text-current opacity-70">
            Age:{' '}
            {Math.floor(
              (today.getTime() - new Date(birthDate).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000),
            )}{' '}
            years
          </Paragraph>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Real-world example: birth date picker with calculated age. Limits range to 120 years ago to today.',
      },
    },
  },
};

export const Playground: Story = {
  args: {
    type: 'full',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use the controls to experiment with different prop combinations',
      },
    },
  },
};

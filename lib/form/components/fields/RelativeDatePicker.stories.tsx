import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { RelativeDatePickerField } from './RelativeDatePicker';

const meta: Meta<typeof RelativeDatePickerField> = {
  title: 'Systems/Form/Fields/RelativeDatePickerField',
  component: RelativeDatePickerField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-invalid': { control: 'boolean' },
    'anchor': {
      control: 'text',
      description: 'Anchor date as ISO string (defaults to today)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'today' },
      },
    },
    'before': {
      control: 'number',
      description: 'Number of days before anchor date to allow',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '180' },
      },
    },
    'after': {
      control: 'number',
      description: 'Number of days after anchor date to allow',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
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
    'defaultValue': {
      control: 'text',
      description: 'Default date value (YYYY-MM-DD format)',
      table: {
        type: { summary: 'string' },
      },
    },
    'onChange': {
      control: false,
      description: 'Type-safe change handler - receives value directly',
      table: {
        type: { summary: '(value: string) => void' },
      },
    },
    'size': {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the date picker field',
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'md' },
      },
    },
    'readOnly': {
      control: 'boolean',
      description: 'Whether the date picker is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'aria-invalid': {
      control: 'boolean',
      description: 'Whether the date picker has aria-invalid state styling',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
  args: {
    before: 180,
    after: 0,
    disabled: false,
    readOnly: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div className="w-full max-w-md space-y-2">
        <RelativeDatePickerField
          before={30}
          after={30}
          value={value}
          onChange={setValue}
          name="relative-date"
        />
        <p className="text-xs text-current opacity-70">
          Selected: {value || 'none'} (±30 days from today)
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date picker with relative date range. Allows selection within 30 days before or after today.',
      },
    },
  },
};

export const AllSizes: Story = {
  name: 'All Sizes Comparison',
  render: () => {
    const [small, setSmall] = useState('');
    const [medium, setMedium] = useState('');
    const [large, setLarge] = useState('');

    return (
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Small</h3>
          <RelativeDatePickerField
            size="sm"
            before={30}
            after={30}
            value={small}
            onChange={setSmall}
            name="small-date"
          />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Medium (default)</h3>
          <RelativeDatePickerField
            size="md"
            before={30}
            after={30}
            value={medium}
            onChange={setMedium}
            name="medium-date"
          />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Large</h3>
          <RelativeDatePickerField
            size="lg"
            before={30}
            after={30}
            value={large}
            onChange={setLarge}
            name="large-date"
          />
        </div>
      </div>
    );
  },
};

export const AllStates: Story = {
  name: 'All States Comparison',
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-current opacity-70">
            Normal
          </p>
          <RelativeDatePickerField
            before={30}
            after={30}
            value="2024-06-15"
            onChange={() => {
              // no-op
            }}
            name="normal"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-current opacity-70">
            Disabled
          </p>
          <RelativeDatePickerField
            before={30}
            after={30}
            disabled
            value="2024-06-15"
            onChange={() => {
              // no-op
            }}
            name="disabled"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-current opacity-70">
            Read-Only
          </p>
          <RelativeDatePickerField
            before={30}
            after={30}
            readOnly
            value="2024-06-15"
            onChange={() => {
              // no-op
            }}
            name="readonly"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-current opacity-70">
            Invalid
          </p>
          <RelativeDatePickerField
            before={30}
            after={30}
            aria-invalid
            value="2024-06-15"
            onChange={() => {
              // no-op
            }}
            name="invalid"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All field states for relative date picker. State priority: disabled > readOnly > invalid > normal',
      },
    },
  },
};

export const PastOnly: Story = {
  name: 'Past Dates Only',
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div className="w-full max-w-md space-y-2">
        <RelativeDatePickerField
          before={365}
          after={0}
          value={value}
          onChange={setValue}
          name="past-date"
        />
        <p className="text-xs text-current opacity-70">
          Allows selection up to 365 days in the past (after=0)
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date picker configured to only allow past dates by setting after=0',
      },
    },
  },
};

export const FutureOnly: Story = {
  name: 'Future Dates Only',
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div className="w-full max-w-md space-y-2">
        <RelativeDatePickerField
          before={0}
          after={90}
          value={value}
          onChange={setValue}
          name="future-date"
        />
        <p className="text-xs text-current opacity-70">
          Allows selection up to 90 days in the future (before=0)
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date picker configured to only allow future dates by setting before=0',
      },
    },
  },
};

export const WithCustomAnchor: Story = {
  name: 'With Custom Anchor Date',
  render: () => {
    const [value, setValue] = useState('');
    const anchor = '2024-12-25'; // Christmas 2024

    return (
      <div className="w-full max-w-md space-y-2">
        <RelativeDatePickerField
          anchor={anchor}
          before={7}
          after={7}
          value={value}
          onChange={setValue}
          name="anchor-date"
        />
        <p className="text-xs text-current opacity-70">
          Anchored to {anchor} (±7 days)
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date picker with a custom anchor date instead of today. Useful for scheduling around specific events.',
      },
    },
  },
};

export const Playground: Story = {
  args: {
    before: 30,
    after: 30,
    size: 'md',
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

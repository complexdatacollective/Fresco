import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'components/fields/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: {
      control: 'boolean',
    },
    readOnly: {
      control: 'boolean',
    },
    invalid: {
      control: 'boolean',
    },
    checked: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    'size': 'md',
    'disabled': false,
    'readOnly': false,
    'invalid': false,
    'aria-label': 'Checkbox',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="xs" aria-label="Extra small checkbox" />
        <span className="text-xs text-current/70">Extra Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="sm" aria-label="Small checkbox" />
        <span className="text-xs text-current/70">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="md" aria-label="Medium checkbox" />
        <span className="text-xs text-current/70">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="lg" aria-label="Large checkbox" />
        <span className="text-xs text-current/70">Large</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="xl" aria-label="Extra large checkbox" />
        <span className="text-xs text-current/70">Extra Large</span>
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Checkbox aria-label="Normal unchecked checkbox" />
        <span className="text-sm">Normal (Unchecked)</span>
      </div>
      <div className="flex items-center gap-4">
        <Checkbox defaultChecked aria-label="Normal checked checkbox" />
        <span className="text-sm">Normal (Checked)</span>
      </div>
      <div className="flex items-center gap-4">
        <Checkbox readOnly aria-label="ReadOnly unchecked checkbox" />
        <span className="text-sm">ReadOnly (Unchecked)</span>
      </div>
      <div className="flex items-center gap-4">
        <Checkbox
          readOnly
          defaultChecked
          aria-label="ReadOnly checked checkbox"
        />
        <span className="text-sm">ReadOnly (Checked)</span>
      </div>
      <div className="flex items-center gap-4">
        <Checkbox disabled aria-label="Disabled unchecked checkbox" />
        <span className="text-sm">Disabled (Unchecked)</span>
      </div>
      <div className="flex items-center gap-4">
        <Checkbox
          disabled
          defaultChecked
          aria-label="Disabled checked checkbox"
        />
        <span className="text-sm">Disabled (Checked)</span>
      </div>
    </div>
  ),
};

export const InvalidState: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Checkbox invalid aria-label="Invalid unchecked checkbox" />
        <span className="text-sm">Invalid (Unchecked)</span>
      </div>
      <div className="flex items-center gap-4">
        <Checkbox
          invalid
          defaultChecked
          aria-label="Invalid checked checkbox"
        />
        <span className="text-sm">Invalid (Checked)</span>
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  render: function InteractiveCheckbox() {
    const [checked, setChecked] = useState(false);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={checked}
            onCheckedChange={setChecked}
            aria-label="Interactive checkbox"
          />
          <span className="text-sm">{checked ? 'Checked' : 'Unchecked'}</span>
        </div>
        <button
          onClick={() => setChecked(!checked)}
          className="text-primary text-sm underline"
          type="button"
        >
          Toggle programmatically
        </button>
      </div>
    );
  },
};

export const WithLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-3">
        <Checkbox aria-label="Accept terms" />
        <span className="text-sm">Accept terms and conditions</span>
      </label>
      <label className="flex items-center gap-3">
        <Checkbox aria-label="Subscribe to newsletter" />
        <span className="text-sm">Subscribe to newsletter</span>
      </label>
      <label className="flex items-center gap-3">
        <Checkbox defaultChecked aria-label="Remember me" />
        <span className="text-sm">Remember me</span>
      </label>
      <label className="flex items-center gap-3 opacity-50">
        <Checkbox disabled aria-label="Disabled option" />
        <span className="text-sm">Disabled option</span>
      </label>
    </div>
  ),
};

export const AllSizesAllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="mb-2 flex items-center gap-4">
        <span className="w-32 text-sm font-medium"></span>
        <span className="w-24 text-center text-xs font-medium text-current/50">
          Normal
        </span>
        <span className="w-24 text-center text-xs font-medium text-current/50">
          Checked
        </span>
        <span className="w-24 text-center text-xs font-medium text-current/50">
          ReadOnly
        </span>
        <span className="w-24 text-center text-xs font-medium text-current/50">
          Disabled
        </span>
        <span className="w-24 text-center text-xs font-medium text-current/50">
          Invalid
        </span>
      </div>

      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} className="flex items-center gap-4">
          <span className="w-32 text-sm font-medium capitalize">{size}:</span>
          <div className="flex w-24 justify-center">
            <Checkbox size={size} aria-label={`${size} normal`} />
          </div>
          <div className="flex w-24 justify-center">
            <Checkbox
              size={size}
              defaultChecked
              aria-label={`${size} checked`}
            />
          </div>
          <div className="flex w-24 justify-center">
            <Checkbox
              size={size}
              readOnly
              defaultChecked
              aria-label={`${size} readonly`}
            />
          </div>
          <div className="flex w-24 justify-center">
            <Checkbox
              size={size}
              disabled
              defaultChecked
              aria-label={`${size} disabled`}
            />
          </div>
          <div className="flex w-24 justify-center">
            <Checkbox
              size={size}
              invalid
              defaultChecked
              aria-label={`${size} invalid`}
            />
          </div>
        </div>
      ))}
    </div>
  ),
};

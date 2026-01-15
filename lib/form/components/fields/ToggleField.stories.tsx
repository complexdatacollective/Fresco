import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import ToggleField from './ToggleField';

const meta: Meta<typeof ToggleField> = {
  title: 'Systems/Form/Fields/ToggleField',
  component: ToggleField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    'value': {
      control: 'boolean',
      description: 'Whether the toggle is checked',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'disabled': {
      control: 'boolean',
      description: 'Whether the toggle is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'readOnly': {
      control: 'boolean',
      description: 'Whether the toggle is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
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
    'size': {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size variant of the toggle',
      table: {
        type: { summary: "'sm' | 'md' | 'lg' | 'xl'" },
        defaultValue: { summary: 'md' },
      },
    },
    'onChange': {
      action: 'onChange',
      description: 'Callback when toggle state changes',
      table: {
        type: { summary: '(value: boolean) => void' },
      },
    },
  },
  args: {
    value: false,
    disabled: false,
    readOnly: false,
    size: 'md',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(false);

    return (
      <div className="w-full max-w-md">
        <ToggleField
          value={value}
          onChange={setValue}
          aria-label="Enable Option"
        />
      </div>
    );
  },
};

export const SizeVariants: Story = {
  render: () => {
    const [values, setValues] = useState({
      sm: false,
      md: true,
      lg: false,
      xl: true,
    });

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="w-12 text-sm text-current opacity-70">sm</span>
          <ToggleField
            size="sm"
            value={values.sm}
            onChange={(v) => setValues((prev) => ({ ...prev, sm: v }))}
            aria-label="Small toggle"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="w-12 text-sm text-current opacity-70">md</span>
          <ToggleField
            size="md"
            value={values.md}
            onChange={(v) => setValues((prev) => ({ ...prev, md: v }))}
            aria-label="Medium toggle"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="w-12 text-sm text-current opacity-70">lg</span>
          <ToggleField
            size="lg"
            value={values.lg}
            onChange={(v) => setValues((prev) => ({ ...prev, lg: v }))}
            aria-label="Large toggle"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="w-12 text-sm text-current opacity-70">xl</span>
          <ToggleField
            size="xl"
            value={values.xl}
            onChange={(v) => setValues((prev) => ({ ...prev, xl: v }))}
            aria-label="Extra large toggle"
          />
        </div>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm text-current opacity-70">
          Disabled Off
        </span>
        <ToggleField disabled value={false} aria-label="Disabled toggle off" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm text-current opacity-70">
          Disabled On
        </span>
        <ToggleField disabled value={true} aria-label="Disabled toggle on" />
      </div>
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="w-28 text-sm text-current opacity-70">
          Read-only Off
        </span>
        <ToggleField readOnly value={false} aria-label="Read-only toggle off" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-28 text-sm text-current opacity-70">
          Read-only On
        </span>
        <ToggleField readOnly value={true} aria-label="Read-only toggle on" />
      </div>
    </div>
  ),
};

export const Invalid: Story = {
  name: 'Invalid State',
  render: () => {
    const [offValue, setOffValue] = useState(false);
    const [onValue, setOnValue] = useState(true);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="w-24 text-sm text-current opacity-70">
            Invalid Off
          </span>
          <ToggleField
            value={offValue}
            onChange={setOffValue}
            aria-label="Invalid toggle off"
            aria-invalid={true}
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="w-24 text-sm text-current opacity-70">
            Invalid On
          </span>
          <ToggleField
            value={onValue}
            onChange={setOnValue}
            aria-label="Invalid toggle on"
            aria-invalid={true}
          />
        </div>
      </div>
    );
  },
};

export const AllStates: Story = {
  render: () => {
    const [normalOff, setNormalOff] = useState(false);
    const [normalOn, setNormalOn] = useState(true);
    const [invalidOff, setInvalidOff] = useState(false);
    const [invalidOn, setInvalidOn] = useState(true);

    return (
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="mb-4 text-sm font-medium">Normal</h3>
          <div className="flex gap-4">
            <ToggleField
              value={normalOff}
              onChange={setNormalOff}
              aria-label="Normal toggle off"
            />
            <ToggleField
              value={normalOn}
              onChange={setNormalOn}
              aria-label="Normal toggle on"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-medium">Disabled</h3>
          <div className="flex gap-4">
            <ToggleField
              disabled
              value={false}
              aria-label="Disabled toggle off"
            />
            <ToggleField
              disabled
              value={true}
              aria-label="Disabled toggle on"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-medium">Read-only</h3>
          <div className="flex gap-4">
            <ToggleField
              readOnly
              value={false}
              aria-label="Read-only toggle off"
            />
            <ToggleField
              readOnly
              value={true}
              aria-label="Read-only toggle on"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-medium">Invalid</h3>
          <div className="flex gap-4">
            <ToggleField
              value={invalidOff}
              onChange={setInvalidOff}
              aria-label="Invalid toggle off"
              aria-invalid={true}
            />
            <ToggleField
              value={invalidOn}
              onChange={setInvalidOn}
              aria-label="Invalid toggle on"
              aria-invalid={true}
            />
          </div>
        </div>
      </div>
    );
  },
};

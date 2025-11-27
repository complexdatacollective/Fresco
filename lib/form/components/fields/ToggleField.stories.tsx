import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { ToggleField } from './ToggleField';

const meta: Meta<typeof ToggleField> = {
  title: 'Components/Fields/ToggleField',
  component: ToggleField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'boolean',
      description: 'Whether the toggle is checked',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the toggle is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the toggle is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size variant of the toggle',
      table: {
        type: { summary: "'sm' | 'md' | 'lg' | 'xl'" },
        defaultValue: { summary: 'md' },
      },
    },
    onChange: {
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
          <span className="text-muted-foreground w-12 text-sm">sm</span>
          <ToggleField
            size="sm"
            value={values.sm}
            onChange={(v) => setValues((prev) => ({ ...prev, sm: v }))}
            aria-label="Small toggle"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-12 text-sm">md</span>
          <ToggleField
            size="md"
            value={values.md}
            onChange={(v) => setValues((prev) => ({ ...prev, md: v }))}
            aria-label="Medium toggle"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-12 text-sm">lg</span>
          <ToggleField
            size="lg"
            value={values.lg}
            onChange={(v) => setValues((prev) => ({ ...prev, lg: v }))}
            aria-label="Large toggle"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-12 text-sm">xl</span>
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
        <span className="text-muted-foreground w-24 text-sm">Disabled Off</span>
        <ToggleField disabled value={false} aria-label="Disabled toggle off" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground w-24 text-sm">Disabled On</span>
        <ToggleField disabled value={true} aria-label="Disabled toggle on" />
      </div>
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground w-28 text-sm">
          Read-only Off
        </span>
        <ToggleField readOnly value={false} aria-label="Read-only toggle off" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground w-28 text-sm">Read-only On</span>
        <ToggleField readOnly value={true} aria-label="Read-only toggle on" />
      </div>
    </div>
  ),
};

export const ErrorState: Story = {
  name: 'Error State',
  render: () => {
    const [value, setValue] = useState(false);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground w-24 text-sm">With Error</span>
          <div className="group" data-dirty="true" data-invalid="true">
            <ToggleField
              value={value}
              onChange={setValue}
              aria-label="Toggle with error"
              aria-invalid="true"
            />
          </div>
        </div>
      </div>
    );
  },
};

export const AllStates: Story = {
  name: 'All States',
  render: () => {
    const [normalValue, setNormalValue] = useState(true);
    const [errorValue, setErrorValue] = useState(false);

    return (
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="mb-4 text-sm font-medium">Normal</h3>
          <div className="flex items-center gap-4">
            <ToggleField
              value={normalValue}
              onChange={setNormalValue}
              aria-label="Normal toggle"
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
          <h3 className="mb-4 text-sm font-medium">Error</h3>
          <div
            className="group inline-block"
            data-dirty="true"
            data-invalid="true"
          >
            <ToggleField
              value={errorValue}
              onChange={setErrorValue}
              aria-label="Toggle with error"
              aria-invalid="true"
            />
          </div>
        </div>
      </div>
    );
  },
};

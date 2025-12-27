import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import VisualAnalogScaleField from './VisualAnalogScale';

const meta: Meta<typeof VisualAnalogScaleField> = {
  title: 'Systems/Form/Fields/VisualAnalogScaleField',
  component: VisualAnalogScaleField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-invalid': { control: 'boolean' },
    'readOnly': {
      control: 'boolean',
      description: 'Whether the scale is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'value': {
      control: 'number',
      description: 'Current value of the scale',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    'min': {
      control: 'number',
      description: 'Minimum value of the scale',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    'max': {
      control: 'number',
      description: 'Maximum value of the scale',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '100' },
      },
    },
    'step': {
      control: 'number',
      description: 'Step increment for the scale',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0.1' },
      },
    },
    'minLabel': {
      control: 'text',
      description: 'Label for the minimum value',
      table: {
        type: { summary: 'string' },
      },
    },
    'maxLabel': {
      control: 'text',
      description: 'Label for the maximum value',
      table: {
        type: { summary: 'string' },
      },
    },
    'disabled': {
      control: 'boolean',
      description: 'Whether the scale is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'onChange': {
      action: 'onChange',
      description: 'Callback when scale value changes',
      table: {
        type: { summary: '(value: number) => void' },
      },
    },
  },
  args: {
    value: 50,
    min: 0,
    max: 100,
    step: 0.1,
    disabled: false,
    readOnly: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(50);

    return (
      <div className="w-xl">
        <VisualAnalogScaleField
          value={value}
          onChange={setValue}
          min={0}
          max={100}
          step={0.1}
          minLabel="Minimum"
          maxLabel="Maximum"
        />
      </div>
    );
  },
};

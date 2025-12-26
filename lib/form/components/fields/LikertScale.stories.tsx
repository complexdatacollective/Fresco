import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { LikertScaleField } from './LikertScale';

const meta: Meta<typeof LikertScaleField> = {
  title: 'Systems/Form/Fields/LikertScaleField',
  component: LikertScaleField,
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
      control: false,
      description: 'Currently selected value',
      table: {
        type: { summary: 'string | number' },
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
    'options': {
      control: false,
      description: 'Array of scale options with labels and values',
      table: {
        type: { summary: 'Array<{ label: string; value: string | number }>' },
        defaultValue: { summary: '[]' },
      },
    },
    'onChange': {
      action: 'onChange',
      description: 'Callback when scale value changes',
      table: {
        type: { summary: '(value: string | number) => void' },
      },
    },
  },
  args: {
    disabled: false,
    readOnly: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const agreementOptions = [
  { label: 'Strongly Disagree', value: 1 },
  { label: 'Disagree', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: 'Agree', value: 4 },
  { label: 'Strongly Agree', value: 5 },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | number | undefined>(3);

    return (
      <div className="w-xl">
        <LikertScaleField
          options={agreementOptions}
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

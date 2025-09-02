import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ToggleButtonGroupField } from './ToggleButtonGroup';

const meta: Meta<typeof ToggleButtonGroupField> = {
  title: 'Components/Fields/ToggleButtonGroupField',
  component: ToggleButtonGroupField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: false,
      description: 'Array of selected values',
      table: {
        type: { summary: '(string | number)[]' },
        defaultValue: { summary: '[]' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button group is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    options: {
      control: false,
      description: 'Array of options with label and value',
      table: {
        type: { summary: 'Array<{ label: string; value: string | number }>' },
        defaultValue: { summary: '[]' },
      },
    },
    onChange: {
      action: 'onChange',
      description: 'Callback when selection changes',
      table: {
        type: { summary: '(value: (string | number)[]) => void' },
      },
    },
  },
  args: {
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const basicOptions = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
];

export const Default: Story = {
  render: () => {
    const [selectedOptions, setSelectedOptions] = useState<(string | number)[]>([]);

    return (
      <div className="w-full max-w-md">
        <ToggleButtonGroupField
          options={basicOptions}
          value={selectedOptions}
          onChange={setSelectedOptions}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    options: basicOptions,
    value: ['a'],
    disabled: true,
  },
};
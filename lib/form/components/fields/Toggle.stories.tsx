import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ToggleField } from './Toggle';

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
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: true,
  },
};
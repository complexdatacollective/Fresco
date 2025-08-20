import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SliderField } from './Slider';

const meta: Meta<typeof SliderField> = {
  title: 'Components/Fields/SliderField',
  component: SliderField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    min: {
      control: 'number',
      description: 'Minimum value of the slider',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    max: {
      control: 'number',
      description: 'Maximum value of the slider',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '100' },
      },
    },
    step: {
      control: 'number',
      description: 'Step increment for the slider',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1' },
      },
    },
    defaultValue: {
      control: 'number',
      description: 'Default value of the slider',
      table: {
        type: { summary: 'number' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the slider is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onChange: {
      action: 'onChange',
      description: 'Callback when slider value changes',
      table: {
        type: { summary: '(event: ChangeEvent<HTMLInputElement>) => void' },
      },
    },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    defaultValue: 50,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(50);

    return (
      <div className="w-full max-w-md">
        <SliderField
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 75,
  },
};
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useState } from 'react';
import Surface from '~/components/layout/Surface';
import VisualAnalogScaleField from './VisualAnalogScale';

const meta = {
  title: 'Systems/Form/Fields/VisualAnalogScaleField',
  component: VisualAnalogScaleField,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Surface noContainer className="w-2xl">
        <Story />
      </Surface>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    'aria-invalid': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'disabled': { control: 'boolean' },
    'value': { control: 'number' },
    'min': { control: 'number' },
    'max': { control: 'number' },
    'step': { control: 'number' },
    'minLabel': { control: 'text' },
    'maxLabel': { control: 'text' },
    'onChange': { action: 'onChange' },
  },
  args: {
    value: 50,
    min: 0,
    max: 100,
    step: 0.1,
    disabled: false,
    readOnly: false,
  },
} satisfies Meta<typeof VisualAnalogScaleField>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledVAS({
  initialValue = 50,
  ...args
}: Omit<
  React.ComponentProps<typeof VisualAnalogScaleField>,
  'value' | 'onChange'
> & {
  initialValue?: number;
  onChange?: (value: number) => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <VisualAnalogScaleField
      {...args}
      value={value}
      onChange={(newValue) => {
        if (newValue !== undefined) {
          setValue(newValue);
          args.onChange?.(newValue);
        }
      }}
    />
  );
}

export const Default: Story = {
  args: {
    value: 50,
    minLabel: 'Minimum',
    maxLabel: 'Maximum',
  },
  render: (args) => <ControlledVAS {...args} initialValue={args.value} />,
};

export const AtMinimum: Story = {
  args: {
    value: 0,
    minLabel: 'Not at all',
    maxLabel: 'Extremely',
  },
  render: (args) => <ControlledVAS {...args} initialValue={args.value} />,
};

export const AtMaximum: Story = {
  args: {
    value: 100,
    minLabel: 'Not at all',
    maxLabel: 'Extremely',
  },
  render: (args) => <ControlledVAS {...args} initialValue={args.value} />,
};

export const Disabled: Story = {
  args: {
    value: 50,
    minLabel: 'Low',
    maxLabel: 'High',
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    value: 75,
    minLabel: 'Low',
    maxLabel: 'High',
    readOnly: true,
  },
};

export const Invalid: Story = {
  args: {
    'value': 50,
    'minLabel': 'Low',
    'maxLabel': 'High',
    'aria-invalid': true,
  },
  render: (args) => <ControlledVAS {...args} initialValue={args.value} />,
};

export const NoLabels: Story = {
  args: {
    value: 50,
  },
  render: (args) => <ControlledVAS {...args} initialValue={args.value} />,
};

export const CustomRange: Story = {
  args: {
    value: 5,
    min: 0,
    max: 10,
    step: 1,
    minLabel: '0',
    maxLabel: '10',
  },
  render: (args) => <ControlledVAS {...args} initialValue={args.value} />,
};

export const FineGrained: Story = {
  args: {
    value: 50,
    min: 0,
    max: 100,
    step: 0.01,
    minLabel: 'None',
    maxLabel: 'Complete',
  },
  render: (args) => <ControlledVAS {...args} initialValue={args.value} />,
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-2 text-xs font-medium text-current/50">Normal</p>
        <VisualAnalogScaleField value={50} minLabel="Low" maxLabel="High" />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-current/50">Disabled</p>
        <VisualAnalogScaleField
          value={50}
          minLabel="Low"
          maxLabel="High"
          disabled
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-current/50">Read Only</p>
        <VisualAnalogScaleField
          value={75}
          minLabel="Low"
          maxLabel="High"
          readOnly
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-current/50">Invalid</p>
        <VisualAnalogScaleField
          value={50}
          minLabel="Low"
          maxLabel="High"
          aria-invalid={true}
        />
      </div>
    </div>
  ),
};

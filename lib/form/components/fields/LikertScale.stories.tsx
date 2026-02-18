import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useState } from 'react';
import Surface from '~/components/layout/Surface';
import LikertScaleField from './LikertScale';

const meta = {
  title: 'Systems/Form/Fields/LikertScaleField',
  component: LikertScaleField,
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
    'options': { control: false },
    'value': { control: false },
    'onChange': { action: 'onChange' },
  },
  args: {
    disabled: false,
    readOnly: false,
  },
} satisfies Meta<typeof LikertScaleField>;

export default meta;
type Story = StoryObj<typeof meta>;

const agreementOptions = [
  { label: 'Strongly Disagree', value: 1 },
  { label: 'Disagree', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: 'Agree', value: 4 },
  { label: 'Strongly Agree', value: 5 },
];

const longLabelOptions = [
  { label: 'Completely disagree with this statement', value: 1 },
  { label: 'Somewhat disagree', value: 2 },
  { label: 'Neither agree nor disagree with the premise', value: 3 },
  { label: 'Somewhat agree', value: 4 },
  { label: 'Completely agree with this statement', value: 5 },
];

const binaryOptions = [
  { label: 'No', value: 0 },
  { label: 'Yes', value: 1 },
];

const threePointOptions = [
  { label: 'Low', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'High', value: 3 },
];

function ControlledLikert({
  initialValue = 1,
  ...args
}: Omit<React.ComponentProps<typeof LikertScaleField>, 'value' | 'onChange'> & {
  initialValue?: string | number;
  onChange?: (value: string | number) => void;
}) {
  const [value, setValue] = useState<string | number | undefined>(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <LikertScaleField
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
    options: agreementOptions,
    value: 3,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const AtMinimum: Story = {
  args: {
    options: agreementOptions,
    value: 1,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const AtMaximum: Story = {
  args: {
    options: agreementOptions,
    value: 5,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const Disabled: Story = {
  args: {
    options: agreementOptions,
    value: 3,
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    options: agreementOptions,
    value: 4,
    readOnly: true,
  },
};

export const Invalid: Story = {
  args: {
    'options': agreementOptions,
    'value': 3,
    'aria-invalid': true,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const LongLabels: Story = {
  args: {
    options: longLabelOptions,
    value: 3,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const BinaryChoice: Story = {
  args: {
    options: binaryOptions,
    value: 0,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const ThreePoint: Story = {
  args: {
    options: threePointOptions,
    value: 2,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-2 text-xs font-medium text-current/50">Normal</p>
        <LikertScaleField options={agreementOptions} value={3} />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-current/50">Disabled</p>
        <LikertScaleField options={agreementOptions} value={3} disabled />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-current/50">Read Only</p>
        <LikertScaleField options={agreementOptions} value={4} readOnly />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-current/50">Invalid</p>
        <LikertScaleField
          options={agreementOptions}
          value={3}
          aria-invalid={true}
        />
      </div>
    </div>
  ),
};

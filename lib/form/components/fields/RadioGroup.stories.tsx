import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RadioGroupField from './RadioGroup';

const meta = {
  title: 'Systems/Form/Fields/RadioGroup',
  component: RadioGroupField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-invalid': { control: 'boolean' },
    'orientation': {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
    },
    'size': {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    'disabled': {
      control: { type: 'boolean' },
    },
    'readOnly': {
      control: { type: 'boolean' },
    },
    'useColumns': {
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof RadioGroupField>;

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { value: 'option1', label: 'First Option' },
  { value: 'option2', label: 'Second Option' },
  { value: 'option3', label: 'Third Option' },
];

const longLabelOptions = [
  {
    value: 'long1',
    label: 'This is a very long label that might wrap to multiple lines',
  },
  { value: 'long2', label: 'Another long option with detailed description' },
  { value: 'long3', label: 'Third option with extended text content' },
];

export const Default: Story = {
  args: {
    'name': 'example',
    options,
    'aria-label': 'Select Option',
  },
};

export const Horizontal: Story = {
  args: {
    name: 'horizontal',
    options,
    orientation: 'horizontal',
  },
};

export const WithDefaultValue: Story = {
  args: {
    name: 'default-value',
    options,
    defaultValue: 'option2',
  },
};

export const Small: Story = {
  args: {
    name: 'small',
    options,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    name: 'large',
    options,
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    name: 'disabled',
    options,
    disabled: true,
    defaultValue: 'option1',
  },
};

export const DisabledOptions: Story = {
  args: {
    name: 'disabled-options',
    options: [
      { value: 'enabled1', label: 'Enabled Option' },
      { value: 'disabled1', label: 'Disabled Option', disabled: true },
      { value: 'enabled2', label: 'Another Enabled Option' },
      { value: 'disabled2', label: 'Another Disabled Option', disabled: true },
    ],
  },
};

export const Invalid: Story = {
  args: {
    'name': 'invalid',
    options,
    'aria-invalid': 'true',
    'defaultValue': 'option1',
  },
};

export const ReadOnly: Story = {
  args: {
    name: 'readonly',
    options,
    readOnly: true,
    defaultValue: 'option2',
  },
};

export const LongLabels: Story = {
  args: {
    name: 'long-labels',
    options: longLabelOptions,
  },
};

export const LongLabelsHorizontal: Story = {
  args: {
    name: 'long-labels-horizontal',
    options: longLabelOptions,
    orientation: 'horizontal',
  },
};

export const ManyOptions: Story = {
  args: {
    name: 'many-options',
    options: Array.from({ length: 8 }, (_, i) => ({
      value: `option${i + 1}`,
      label: `Option ${i + 1}`,
    })),
  },
};

export const ManyOptionsHorizontal: Story = {
  args: {
    name: 'many-options-horizontal',
    options: Array.from({ length: 6 }, (_, i) => ({
      value: `option${i + 1}`,
      label: `Option ${i + 1}`,
    })),
    orientation: 'horizontal',
  },
};

export const WithColumns: Story = {
  args: {
    name: 'with-columns',
    options: Array.from({ length: 8 }, (_, i) => ({
      value: `option${i + 1}`,
      label: `Option ${i + 1}`,
    })),
    useColumns: true,
  },
};

export const WithColumnsLongLabels: Story = {
  args: {
    name: 'with-columns-long',
    options: [
      { value: 'opt1', label: 'First option with a longer description' },
      { value: 'opt2', label: 'Second option with more text' },
      { value: 'opt3', label: 'Third option here' },
      { value: 'opt4', label: 'Fourth option with details' },
      { value: 'opt5', label: 'Fifth option choice' },
      { value: 'opt6', label: 'Sixth and final option' },
    ],
    useColumns: true,
  },
};

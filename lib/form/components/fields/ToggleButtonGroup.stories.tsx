import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { ToggleButtonGroupField } from './ToggleButtonGroup';

const meta: Meta<typeof ToggleButtonGroupField> = {
  title: 'Systems/Form/Fields/ToggleButtonGroupField',
  component: ToggleButtonGroupField,
  parameters: {
    layout: 'padded',
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
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the toggle buttons',
      table: {
        type: { summary: "'sm' | 'md' | 'lg' | 'xl'" },
        defaultValue: { summary: "'md'" },
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
    const [selectedOptions, setSelectedOptions] = useState<(string | number)[]>(
      [],
    );

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

export const WithPreselected: Story = {
  render: () => {
    const [selectedOptions, setSelectedOptions] = useState<(string | number)[]>(
      ['a', 'c'],
    );

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

export const ManyOptions: Story = {
  render: () => {
    const manyOptions = [
      { label: 'Red', value: 'red' },
      { label: 'Orange', value: 'orange' },
      { label: 'Yellow', value: 'yellow' },
      { label: 'Green', value: 'green' },
      { label: 'Blue', value: 'blue' },
      { label: 'Indigo', value: 'indigo' },
      { label: 'Violet', value: 'violet' },
      { label: 'Pink', value: 'pink' },
      { label: 'Brown', value: 'brown' },
      { label: 'Gray', value: 'gray' },
    ];

    const [selectedOptions, setSelectedOptions] = useState<(string | number)[]>(
      [],
    );

    return (
      <div className="w-full max-w-xl">
        <ToggleButtonGroupField
          options={manyOptions}
          value={selectedOptions}
          onChange={setSelectedOptions}
        />
      </div>
    );
  },
};

export const LongLabels: Story = {
  render: () => {
    const longLabelOptions = [
      { label: 'Very Long Label', value: 'long1' },
      { label: 'Another Lengthy Option', value: 'long2' },
      { label: 'Short', value: 'short' },
      { label: 'Extremely Long Text Here', value: 'long3' },
    ];

    const [selectedOptions, setSelectedOptions] = useState<(string | number)[]>(
      [],
    );

    return (
      <div className="w-full max-w-md">
        <ToggleButtonGroupField
          options={longLabelOptions}
          value={selectedOptions}
          onChange={setSelectedOptions}
        />
      </div>
    );
  },
};

export const MixedLengthLabels: Story = {
  render: () => {
    const mixedOptions = [
      { label: 'A', value: '1' },
      { label: 'AB', value: '2' },
      { label: 'ABC', value: '3' },
      {
        label: 'This is a much longer label that will need truncation',
        value: '4',
      },
      { label: 'Medium Length', value: '5' },
      { label: 'X', value: '6' },
    ];

    const [selectedOptions, setSelectedOptions] = useState<(string | number)[]>(
      ['4'],
    );

    return (
      <div className="w-full max-w-lg">
        <ToggleButtonGroupField
          options={mixedOptions}
          value={selectedOptions}
          onChange={setSelectedOptions}
        />
      </div>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [smSelected, setSmSelected] = useState<(string | number)[]>(['a']);
    const [mdSelected, setMdSelected] = useState<(string | number)[]>(['b']);
    const [lgSelected, setLgSelected] = useState<(string | number)[]>(['c']);
    const [xlSelected, setXlSelected] = useState<(string | number)[]>(['a']);

    return (
      <div className="flex w-full flex-col gap-8">
        <div>
          <p className="mb-2 text-sm font-medium">Small (sm)</p>
          <ToggleButtonGroupField
            options={basicOptions}
            value={smSelected}
            onChange={setSmSelected}
            size="sm"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Medium (md) - Default</p>
          <ToggleButtonGroupField
            options={basicOptions}
            value={mdSelected}
            onChange={setMdSelected}
            size="md"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Large (lg)</p>
          <ToggleButtonGroupField
            options={basicOptions}
            value={lgSelected}
            onChange={setLgSelected}
            size="lg"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Extra Large (xl)</p>
          <ToggleButtonGroupField
            options={basicOptions}
            value={xlSelected}
            onChange={setXlSelected}
            size="xl"
          />
        </div>
      </div>
    );
  },
};

export const SizeComparison: Story = {
  render: () => {
    const [selected, setSelected] = useState<(string | number)[]>([]);
    const longOptions = [
      { label: 'Very Long Label Here', value: 'long1' },
      { label: 'Another Long One', value: 'long2' },
      { label: 'Short', value: 'short' },
    ];

    return (
      <div className="flex w-full flex-col gap-8">
        <div>
          <p className="mb-2 text-sm font-medium">
            Small - Long labels truncate more
          </p>
          <ToggleButtonGroupField
            options={longOptions}
            value={selected}
            onChange={setSelected}
            size="sm"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">
            Extra Large - More room for text
          </p>
          <ToggleButtonGroupField
            options={longOptions}
            value={selected}
            onChange={setSelected}
            size="xl"
          />
        </div>
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

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import BooleanOption from './BooleanOption';

const meta: Meta<typeof BooleanOption> = {
  title: 'Interview/Components/BooleanOption',
  component: BooleanOption,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    selected: {
      control: 'boolean',
      description: 'Whether the option is selected',
    },
    negative: {
      control: 'boolean',
      description: 'Whether this is a negative/destructive option',
    },
    label: {
      control: 'text',
      description: 'The label text for the option',
    },
    onClick: {
      action: 'clicked',
      description: 'Callback when the option is clicked',
    },
  },
  args: {
    selected: false,
    negative: false,
    label: 'Option',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Yes',
  },
};

export const Selected: Story = {
  args: {
    label: 'Yes',
    selected: true,
  },
};

export const Negative: Story = {
  args: {
    label: 'No Relationship',
    negative: true,
  },
};

export const NegativeSelected: Story = {
  args: {
    label: 'No Relationship',
    negative: true,
    selected: true,
  },
};

export const Interactive: Story = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);

    return (
      <div className="flex gap-4">
        <BooleanOption
          label="Weak"
          selected={selected === 'weak'}
          onClick={() => setSelected('weak')}
        />
        <BooleanOption
          label="Moderate"
          selected={selected === 'moderate'}
          onClick={() => setSelected('moderate')}
        />
        <BooleanOption
          label="Strong"
          selected={selected === 'strong'}
          onClick={() => setSelected('strong')}
        />
        <BooleanOption
          label="No Friendship"
          negative
          selected={selected === 'none'}
          onClick={() => setSelected('none')}
        />
      </div>
    );
  },
};

export const TieStrengthExample: Story = {
  render: () => {
    const [selected, setSelected] = useState<number | false | null>(null);

    const options = [
      { label: 'Weak', value: 1 },
      { label: 'Moderate', value: 2 },
      { label: 'Strong', value: 3 },
    ];

    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-center text-lg">
          How strong is the friendship between these two people?
        </p>
        <div className="grid auto-cols-fr grid-flow-col gap-4">
          {options.map((option) => (
            <BooleanOption
              key={option.value}
              label={option.label}
              selected={selected === option.value}
              onClick={() => setSelected(option.value)}
            />
          ))}
          <BooleanOption
            label="No Friendship"
            negative
            selected={selected === false}
            onClick={() => setSelected(false)}
          />
        </div>
      </div>
    );
  },
};

export const BinaryChoice: Story = {
  render: () => {
    const [selected, setSelected] = useState<boolean | null>(null);

    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-center text-lg">Are these two people friends?</p>
        <div className="grid auto-cols-fr grid-flow-col gap-4">
          <BooleanOption
            label="Yes"
            selected={selected === true}
            onClick={() => setSelected(true)}
          />
          <BooleanOption
            label="No"
            negative
            selected={selected === false}
            onClick={() => setSelected(false)}
          />
        </div>
      </div>
    );
  },
};

export const WithMarkdown: Story = {
  args: {
    label: '**Bold** and *italic* text',
    selected: false,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-medium">Unselected:</p>
        <div className="flex gap-4">
          <BooleanOption label="Normal" />
          <BooleanOption label="Negative" negative />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Selected:</p>
        <div className="flex gap-4">
          <BooleanOption label="Normal" selected />
          <BooleanOption label="Negative" negative selected />
        </div>
      </div>
    </div>
  ),
};

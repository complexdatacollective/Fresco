import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import CheckboxGroupField from './CheckboxGroup';

const meta = {
  title: 'Systems/Form/Fields/CheckboxGroup',
  component: CheckboxGroupField,
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
      options: ['sm', 'md', 'lg', 'xl'],
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
} satisfies Meta<typeof CheckboxGroupField>;

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
    'aria-label': 'Select Options',
  },
};

export const Horizontal: Story = {
  args: {
    'name': 'horizontal',
    options,
    'orientation': 'horizontal',
    'aria-label': 'Horizontal Options',
  },
};

export const WithDefaultValue: Story = {
  args: {
    'name': 'default-value',
    options,
    'defaultValue': ['option1', 'option3'],
    'aria-label': 'Pre-selected Options',
  },
};

export const Small: Story = {
  args: {
    'name': 'small',
    options,
    'size': 'sm',
    'aria-label': 'Small Size Options',
  },
};

export const Large: Story = {
  args: {
    'name': 'large',
    options,
    'size': 'lg',
    'aria-label': 'Large Size Options',
  },
};

export const Disabled: Story = {
  args: {
    'name': 'disabled',
    options,
    'disabled': true,
    'defaultValue': ['option1'],
    'aria-label': 'Disabled Options',
  },
};

export const DisabledOptions: Story = {
  args: {
    'name': 'disabled-options',
    'options': [
      { value: 'enabled1', label: 'Enabled Option' },
      { value: 'disabled1', label: 'Disabled Option', disabled: true },
      { value: 'enabled2', label: 'Another Enabled Option' },
      { value: 'disabled2', label: 'Another Disabled Option', disabled: true },
    ],
    'aria-label': 'Mixed Disabled Options',
  },
};

export const Invalid: Story = {
  args: {
    'name': 'invalid',
    options,
    'aria-invalid': true,
    'aria-label': 'Invalid State Options',
  },
};

export const LongLabels: Story = {
  args: {
    'name': 'long-labels',
    'options': longLabelOptions,
    'aria-label': 'Long Label Options',
  },
};

export const LongLabelsHorizontal: Story = {
  args: {
    'name': 'long-labels-horizontal',
    'options': longLabelOptions,
    'orientation': 'horizontal',
    'aria-label': 'Long Labels Horizontal',
  },
};

export const ManyOptions: Story = {
  args: {
    'name': 'many-options',
    'options': Array.from({ length: 8 }, (_, i) => ({
      value: `option${i + 1}`,
      label: `Option ${i + 1}`,
    })),
    'aria-label': 'Many Options',
  },
};

export const ManyOptionsHorizontal: Story = {
  args: {
    'name': 'many-options-horizontal',
    'options': Array.from({ length: 6 }, (_, i) => ({
      value: `option${i + 1}`,
      label: `Option ${i + 1}`,
    })),
    'orientation': 'horizontal',
    'aria-label': 'Many Options Horizontal',
  },
};

export const PreSelected: Story = {
  args: {
    'name': 'pre-selected',
    'options': Array.from({ length: 5 }, (_, i) => ({
      value: `option${i + 1}`,
      label: `Option ${i + 1}`,
    })),
    'defaultValue': ['option2', 'option4'],
    'aria-label': 'Pre-selected Options',
  },
};

export const ReadOnly: Story = {
  args: {
    'name': 'readonly',
    options,
    'readOnly': true,
    'defaultValue': ['option1'],
    'aria-label': 'ReadOnly Options',
  },
};

export const WithColumns: Story = {
  args: {
    'name': 'with-columns',
    'options': Array.from({ length: 12 }, (_, i) => ({
      value: `option${i + 1}`,
      label: `Option ${i + 1}`,
    })),
    'useColumns': true,
    'aria-label': 'Columned Options',
  },
};

export const AllSizes: Story = {
  args: {
    name: 'sizes',
    options: options,
  },
  render: () => (
    <div className="flex flex-col gap-8">
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} className="flex flex-col gap-2">
          <span className="text-sm font-medium capitalize">{size}:</span>
          <CheckboxGroupField
            name={`size-${size}`}
            options={options}
            size={size}
            defaultValue={['option1']}
            aria-label={`${size} size options`}
            onChange={() => {
              /* no-op */
            }}
          />
        </div>
      ))}
    </div>
  ),
};

export const AllStates: Story = {
  args: {
    name: 'states',
    options: options,
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Normal:</span>
        <CheckboxGroupField
          name="state-normal"
          options={options}
          defaultValue={['option1']}
          aria-label="Normal state"
          onChange={() => {
            /* no-op */
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">ReadOnly:</span>
        <CheckboxGroupField
          name="state-readonly"
          options={options}
          readOnly
          defaultValue={['option1']}
          aria-label="ReadOnly state"
          onChange={() => {
            /* no-op */
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Disabled:</span>
        <CheckboxGroupField
          name="state-disabled"
          options={options}
          disabled
          defaultValue={['option1']}
          aria-label="Disabled state"
          onChange={() => {
            /* no-op */
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Invalid:</span>
        <CheckboxGroupField
          name="state-invalid"
          options={options}
          aria-invalid={true}
          defaultValue={['option1']}
          aria-label="Invalid state"
          onChange={() => {
            /* no-op */
          }}
        />
      </div>
    </div>
  ),
};

export const AllOrientations: Story = {
  args: {
    name: 'orientations',
    options: options,
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Vertical:</span>
        <CheckboxGroupField
          name="orientation-vertical"
          options={options}
          orientation="vertical"
          defaultValue={['option1']}
          aria-label="Vertical orientation"
          onChange={() => {
            /* no-op */
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Horizontal:</span>
        <CheckboxGroupField
          name="orientation-horizontal"
          options={options}
          orientation="horizontal"
          defaultValue={['option1']}
          aria-label="Horizontal orientation"
          onChange={() => {
            /* no-op */
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">With Columns:</span>
        <CheckboxGroupField
          name="orientation-columns"
          options={Array.from({ length: 9 }, (_, i) => ({
            value: `option${i + 1}`,
            label: `Option ${i + 1}`,
          }))}
          useColumns
          defaultValue={['option1']}
          aria-label="Columns layout"
          onChange={() => {
            /* no-op */
          }}
        />
      </div>
    </div>
  ),
};

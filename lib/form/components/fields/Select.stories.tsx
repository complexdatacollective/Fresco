import type { Meta, StoryObj } from '@storybook/react';
import { SelectField } from './Select';

const sampleOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4' },
];

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
];

const priorityOptions = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent' },
];

const meta: Meta<typeof SelectField> = {
  title: 'Components/Fields/SelectField',
  component: SelectField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: false,
      description: 'Array of options to display in the select',
      table: {
        type: { summary: 'SelectOption[]' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the select',
      table: {
        type: { summary: 'string' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the select is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the select is required',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    multiple: {
      control: 'boolean',
      description: 'Whether multiple options can be selected',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the select field',
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'md' },
      },
    },
    defaultValue: {
      control: 'text',
      description: 'Default value of the select',
      table: {
        type: { summary: 'string' },
      },
    },
  },
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...',
    disabled: false,
    readOnly: false,
    required: false,
    multiple: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: sampleOptions,
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    options: sampleOptions,
    placeholder: 'Small select',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    options: sampleOptions,
    placeholder: 'Large select',
  },
};

export const WithValue: Story = {
  args: {
    options: sampleOptions,
    defaultValue: 'option2',
  },
};

export const Disabled: Story = {
  args: {
    options: sampleOptions,
    disabled: true,
    defaultValue: 'option1',
  },
};

export const ReadOnly: Story = {
  args: {
    options: sampleOptions,
    readOnly: true,
    defaultValue: 'option2',
  },
};

export const Required: Story = {
  args: {
    options: sampleOptions,
    required: true,
    placeholder: 'Required field',
  },
};

export const Multiple: Story = {
  args: {
    options: sampleOptions,
    multiple: true,
    placeholder: 'Select multiple options',
  },
  parameters: {
    docs: {
      description: {
        story: 'Select field with multiple selection enabled',
      },
    },
  },
};

export const CountrySelector: Story = {
  name: 'Country Selector',
  args: {
    options: countryOptions,
    placeholder: 'Select your country',
  },
};

export const PrioritySelector: Story = {
  name: 'Priority Selector',
  args: {
    options: priorityOptions,
    placeholder: 'Select priority level',
    defaultValue: 'medium',
  },
};

export const Invalid: Story = {
  name: 'Invalid State',
  args: {
    options: sampleOptions,
    defaultValue: 'option1',
    'aria-invalid': true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Select with invalid state styling (uses aria-invalid)',
      },
    },
  },
};

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div className="flex flex-col gap-4">
      <SelectField
        size="sm"
        options={sampleOptions}
        placeholder="Small select"
      />
      <SelectField
        size="md"
        options={sampleOptions}
        placeholder="Medium select"
      />
      <SelectField
        size="lg"
        options={sampleOptions}
        placeholder="Large select"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all available sizes side by side',
      },
    },
  },
};

export const DisabledStates: Story = {
  name: 'Disabled States',
  render: () => (
    <div className="flex flex-col gap-4">
      <SelectField
        options={sampleOptions}
        disabled
        placeholder="Disabled with placeholder"
      />
      <SelectField
        options={sampleOptions}
        disabled
        defaultValue="option2"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows disabled states with and without values',
      },
    },
  },
};

export const ReadOnlyStates: Story = {
  name: 'Read-Only States',
  render: () => (
    <div className="flex flex-col gap-4">
      <SelectField
        options={sampleOptions}
        readOnly
        defaultValue="option1"
      />
      <SelectField
        options={countryOptions}
        readOnly
        defaultValue="us"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows read-only states with different option sets',
      },
    },
  },
};

export const InvalidStates: Story = {
  name: 'Invalid States',
  render: () => (
    <div className="flex flex-col gap-4">
      <SelectField
        options={sampleOptions}
        aria-invalid
        placeholder="Invalid with placeholder"
      />
      <SelectField
        options={sampleOptions}
        aria-invalid
        defaultValue="option3"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows invalid states with and without values',
      },
    },
  },
};

export const LongOptionList: Story = {
  name: 'Long Option List',
  args: {
    options: [
      { value: '1', label: 'Afghanistan' },
      { value: '2', label: 'Albania' },
      { value: '3', label: 'Algeria' },
      { value: '4', label: 'American Samoa' },
      { value: '5', label: 'Andorra' },
      { value: '6', label: 'Angola' },
      { value: '7', label: 'Anguilla' },
      { value: '8', label: 'Antarctica' },
      { value: '9', label: 'Antigua and Barbuda' },
      { value: '10', label: 'Argentina' },
      { value: '11', label: 'Armenia' },
      { value: '12', label: 'Aruba' },
      { value: '13', label: 'Australia' },
      { value: '14', label: 'Austria' },
      { value: '15', label: 'Azerbaijan' },
    ],
    placeholder: 'Select a country',
  },
  parameters: {
    docs: {
      description: {
        story: 'Select with a long list of options to test scrolling behavior',
      },
    },
  },
};

export const NumericValues: Story = {
  name: 'Numeric Values',
  args: {
    options: [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
      { value: 3, label: 'Three' },
      { value: 4, label: 'Four' },
      { value: 5, label: 'Five' },
    ],
    placeholder: 'Select a number',
    defaultValue: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Select with numeric values instead of string values',
      },
    },
  },
};

export const Playground: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Playground - try different combinations',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use the controls to experiment with different prop combinations',
      },
    },
  },
};
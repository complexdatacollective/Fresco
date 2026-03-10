import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { UnorderedList } from '~/components/typography/UnorderedList';
import NativeSelectField from './Native';
import type { SelectOption } from './shared';
import StyledSelectField from './Styled';

const sampleOptions: SelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4' },
];

const countryOptions: SelectOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
];

const priorityOptions: SelectOption[] = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent' },
];

const meta: Meta<typeof NativeSelectField> = {
  title: 'Systems/Form/Fields/SelectField',
  component: NativeSelectField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    'readOnly': {
      control: 'boolean',
      description: 'Whether the select is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'options': {
      control: false,
      description: 'Array of options to display in the select',
      table: {
        type: { summary: 'SelectOption[]' },
      },
    },
    'placeholder': {
      control: 'text',
      description: 'Placeholder text for the select',
      table: {
        type: { summary: 'string' },
      },
    },
    'disabled': {
      control: 'boolean',
      description: 'Whether the select is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'aria-invalid': {
      control: 'boolean',
      description: 'Whether the select has aria-invalid state styling',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'required': {
      control: 'boolean',
      description: 'Whether the select is required (HTML validation)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'onChange': {
      control: false,
      description: 'Callback when value changes - receives value directly',
      table: {
        type: { summary: '(value: string | number) => void' },
      },
    },
    'size': {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the select field',
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'md' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Overview and Comparison
export const Overview: Story = {
  name: 'Overview: Native vs Styled',
  render: () => {
    const [nativeValue, setNativeValue] = useState<string | number>('');
    const [styledValue, setStyledValue] = useState<string | number>('');

    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <Heading level="h3" margin="none" className="text-lg">
            Native Select
          </Heading>
          <Paragraph margin="none" className="text-sm opacity-70">
            Uses HTML <code>&lt;select&gt;</code> element with custom styling
          </Paragraph>
          <div className="w-80">
            <NativeSelectField
              name="native-select"
              options={sampleOptions}
              placeholder="Select an option..."
              value={nativeValue}
              onChange={(v) => setNativeValue(v ?? '')}
            />
          </div>
          <Paragraph margin="none" className="text-xs opacity-70">
            Selected: {nativeValue || 'none'}
          </Paragraph>
        </div>

        <div className="space-y-2">
          <Heading level="h3" margin="none" className="text-lg">
            Styled Select (Base UI)
          </Heading>
          <Paragraph margin="none" className="text-sm opacity-70">
            Custom dropdown with better accessibility and UX
          </Paragraph>
          <UnorderedList className="mb-2 list-inside space-y-1 text-xs opacity-70">
            <li>Check indicator for selected items</li>
            <li>Better keyboard navigation</li>
            <li>Hover and focus states</li>
            <li>Portal-based positioning</li>
          </UnorderedList>
          <div className="w-80">
            <StyledSelectField
              name="styled-select"
              options={sampleOptions}
              placeholder="Select an option..."
              value={styledValue}
              onChange={(v) => setStyledValue(v ?? '')}
            />
          </div>
          <Paragraph margin="none" className="text-xs opacity-70">
            Selected: {styledValue || 'none'}
          </Paragraph>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Compare native HTML select with styled Base UI select component. Both share the same API and support string | number values.',
      },
    },
  },
};

// Property-based comparisons
export const Sizes: Story = {
  name: 'Sizes: All Variants',
  render: () => {
    const [nativeSm, setNativeSm] = useState<string | number>('');
    const [nativeMd, setNativeMd] = useState<string | number>('');
    const [nativeLg, setNativeLg] = useState<string | number>('');
    const [styledSm, setStyledSm] = useState<string | number>('');
    const [styledMd, setStyledMd] = useState<string | number>('');
    const [styledLg, setStyledLg] = useState<string | number>('');

    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <Heading level="h3" margin="none" className="text-lg">
            Native Select Sizes
          </Heading>
          <div className="flex w-full flex-col gap-3">
            <NativeSelectField
              name="native-sm-size"
              size="sm"
              options={sampleOptions}
              placeholder="Small (sm)"
              value={nativeSm}
              onChange={(v) => setNativeSm(v ?? '')}
            />
            <NativeSelectField
              name="native-md-size"
              size="md"
              options={sampleOptions}
              placeholder="Medium (md) - default"
              value={nativeMd}
              onChange={(v) => setNativeMd(v ?? '')}
            />
            <NativeSelectField
              name="native-lg-size"
              size="lg"
              options={sampleOptions}
              placeholder="Large (lg)"
              value={nativeLg}
              onChange={(v) => setNativeLg(v ?? '')}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Heading level="h3" margin="none" className="text-lg">
            Styled Select Sizes
          </Heading>
          <div className="flex w-full flex-col gap-3">
            <StyledSelectField
              name="styled-sm-size"
              size="sm"
              options={sampleOptions}
              placeholder="Small (sm)"
              value={styledSm}
              onChange={(v) => setStyledSm(v ?? '')}
            />
            <StyledSelectField
              name="styled-md-size"
              size="md"
              options={sampleOptions}
              placeholder="Medium (md) - default"
              value={styledMd}
              onChange={(v) => setStyledMd(v ?? '')}
            />
            <StyledSelectField
              name="styled-lg-size"
              size="lg"
              options={sampleOptions}
              placeholder="Large (lg)"
              value={styledLg}
              onChange={(v) => setStyledLg(v ?? '')}
            />
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'All available sizes (sm, md, lg) for both native and styled select components. Medium is the default size.',
      },
    },
  },
};

export const States: Story = {
  name: 'States: All Variants',
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="space-y-3">
        <Heading level="h3" margin="none" className="text-lg">
          Native Select States
        </Heading>
        <div className="flex w-full flex-col gap-3">
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Normal
            </Paragraph>
            <NativeSelectField
              name="native-normal"
              options={sampleOptions}
              placeholder="Normal state"
              value=""
              onChange={() => {
                // no-op
              }}
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Disabled
            </Paragraph>
            <NativeSelectField
              name="native-disabled-state"
              options={sampleOptions}
              disabled
              value="option2"
              onChange={() => {
                // no-op
              }}
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Invalid
            </Paragraph>
            <NativeSelectField
              name="native-invalid-state"
              options={sampleOptions}
              aria-invalid
              value="option2"
              onChange={() => {
                // no-op
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Heading level="h3" margin="none" className="text-lg">
          Styled Select States
        </Heading>
        <div className="flex w-full flex-col gap-3">
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Normal
            </Paragraph>
            <StyledSelectField
              name="styled-normal"
              options={sampleOptions}
              placeholder="Normal state"
              value=""
              onChange={() => {
                // no-op
              }}
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Disabled
            </Paragraph>
            <StyledSelectField
              name="styled-disabled-state"
              options={sampleOptions}
              disabled
              value="option2"
              onChange={() => {
                // no-op
              }}
            />
          </div>
          <div>
            <Paragraph
              margin="none"
              className="mb-1 text-xs font-medium text-current opacity-70"
            >
              Invalid
            </Paragraph>
            <StyledSelectField
              name="styled-invalid-state"
              options={sampleOptions}
              aria-invalid
              value="option2"
              onChange={() => {
                // no-op
              }}
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All available states for both native and styled select components. State priority: disabled > readOnly > invalid > normal',
      },
    },
  },
};

// Real-world usage examples
export const UsageExamples: Story = {
  render: () => {
    const [country, setCountry] = useState<string | number>('');
    const [priority, setPriority] = useState<string | number>('medium');

    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <Heading level="h3" margin="none" className="text-lg">
            Country Selector
          </Heading>
          <div className="tablet:grid-cols-2 grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Native</label>
              <NativeSelectField
                name="country-native"
                options={countryOptions}
                placeholder="Select your country"
                value={country}
                onChange={(v) => setCountry(v ?? '')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Styled</label>
              <StyledSelectField
                name="country-styled"
                options={countryOptions}
                placeholder="Select your country"
                value={country}
                onChange={(v) => setCountry(v ?? '')}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Heading level="h3" margin="none" className="text-lg">
            Priority Selector
          </Heading>
          <div className="tablet:grid-cols-2 grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Native</label>
              <NativeSelectField
                name="priority-native"
                options={priorityOptions}
                placeholder="Select priority level"
                value={priority}
                onChange={(v) => setPriority(v ?? 'medium')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Styled</label>
              <StyledSelectField
                name="priority-styled"
                options={priorityOptions}
                placeholder="Select priority level"
                value={priority}
                onChange={(v) => setPriority(v ?? 'medium')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Real-world usage examples showing both implementations side-by-side with the same data',
      },
    },
  },
};

export const LongOptionList: Story = {
  render: () => {
    const [value, setValue] = useState<string | number>('');

    const longOptions: SelectOption[] = [
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
    ];

    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <Heading level="h3" margin="none" className="text-lg">
            Native Select
          </Heading>
          <NativeSelectField
            name="countries-native"
            options={longOptions}
            placeholder="Select a country"
            value={value}
            onChange={(v) => setValue(v ?? '')}
          />
        </div>
        <div className="space-y-3">
          <Heading level="h3" margin="none" className="text-lg">
            Styled Select
          </Heading>
          <StyledSelectField
            name="countries-styled"
            options={longOptions}
            placeholder="Select a country"
            value={value}
            onChange={(v) => setValue(v ?? '')}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Behavior with a long list of options. The styled select shows a max height with scrolling.',
      },
    },
  },
};

export const NumericValues: Story = {
  render: () => {
    const [value, setValue] = useState<string | number>(3);

    const numericOptions: SelectOption[] = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
      { value: 3, label: 'Three' },
      { value: 4, label: 'Four' },
      { value: 5, label: 'Five' },
    ];

    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <Heading level="h3" margin="none" className="text-lg">
            Native Select
          </Heading>
          <NativeSelectField
            name="numbers-native"
            options={numericOptions}
            placeholder="Select a number"
            value={value}
            onChange={(v) => setValue(v ?? '')}
          />
          <Paragraph margin="none" className="text-xs opacity-70">
            Value: {value} (type: {typeof value})
          </Paragraph>
        </div>
        <div className="space-y-3">
          <Heading level="h3" margin="none" className="text-lg">
            Styled Select
          </Heading>
          <StyledSelectField
            name="numbers-styled"
            options={numericOptions}
            placeholder="Select a number"
            value={value}
            onChange={(v) => setValue(v ?? '')}
          />
          <Paragraph margin="none" className="text-xs opacity-70">
            Value: {value} (type: {typeof value})
          </Paragraph>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Both components support numeric values (number type) in addition to string values',
      },
    },
  },
};

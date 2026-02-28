import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import ComboboxField from './Combobox';
import type { ComboboxOption } from './shared';

const sampleOptions: ComboboxOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4' },
];

const participantOptions: ComboboxOption[] = [
  { value: 'p1', label: 'Alice Johnson' },
  { value: 'p2', label: 'Bob Smith' },
  { value: 'p3', label: 'Charlie Brown' },
  { value: 'p4', label: 'Diana Ross' },
  { value: 'p5', label: 'Edward Norton' },
];

const countryOptions: ComboboxOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'br', label: 'Brazil' },
  { value: 'mx', label: 'Mexico' },
  { value: 'in', label: 'India' },
];

const meta: Meta<typeof ComboboxField> = {
  title: 'Systems/Form/Fields/ComboboxField',
  component: ComboboxField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    'options': {
      control: false,
      description: 'Array of options to display in the combobox',
      table: {
        type: { summary: 'ComboboxOption[]' },
      },
    },
    'placeholder': {
      control: 'text',
      description: 'Placeholder text for the trigger button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Select items...' },
      },
    },
    'searchPlaceholder': {
      control: 'text',
      description: 'Placeholder text for the search input',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Search...' },
      },
    },
    'emptyMessage': {
      control: 'text',
      description: 'Message shown when no items match the search',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'No items found.' },
      },
    },
    'showSearch': {
      control: 'boolean',
      description: 'Toggle search input visibility',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    'showSelectAll': {
      control: 'boolean',
      description: 'Show "Select All" action',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    'showDeselectAll': {
      control: 'boolean',
      description: 'Show "Deselect All" action',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    'singular': {
      control: 'text',
      description:
        'Singular label for count display (e.g., "1 Participant selected")',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'item' },
      },
    },
    'plural': {
      control: 'text',
      description:
        'Plural label for count display (e.g., "3 Participants selected")',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'items' },
      },
    },
    'disabled': {
      control: 'boolean',
      description: 'Whether the combobox is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'readOnly': {
      control: 'boolean',
      description: 'Whether the combobox is read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'aria-invalid': {
      control: 'boolean',
      description: 'Whether the combobox has invalid state styling',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'size': {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the combobox field',
      table: {
        type: { summary: 'sm | md | lg | xl' },
        defaultValue: { summary: 'md' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => {
    const [value, setValue] = useState<(string | number)[]>([]);

    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Multi-Select Combobox</h3>
          <p className="text-sm opacity-70">
            A searchable multi-select dropdown with bulk actions
          </p>
          <ul className="mb-2 list-inside list-disc space-y-1 text-xs opacity-70">
            <li>Search/filter items</li>
            <li>Select All / Deselect All actions</li>
            <li>Check indicators for selected items</li>
            <li>Count display in trigger</li>
            <li>Keyboard navigation</li>
          </ul>
          <div className="w-80">
            <ComboboxField
              name="overview"
              options={sampleOptions}
              placeholder="Select options..."
              value={value}
              onChange={(v) => setValue(v ?? [])}
            />
          </div>
          <p className="text-xs opacity-70">
            Selected: {value.length === 0 ? 'none' : value.join(', ')}
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The ComboboxField is a multi-select dropdown with search, bulk actions, and keyboard navigation. Built on Base-UI Combobox.',
      },
    },
  },
};

export const Sizes: Story = {
  name: 'Sizes: All Variants',
  render: () => {
    const [smValue, setSmValue] = useState<(string | number)[]>(['option1']);
    const [mdValue, setMdValue] = useState<(string | number)[]>([
      'option1',
      'option2',
    ]);
    const [lgValue, setLgValue] = useState<(string | number)[]>([
      'option1',
      'option2',
      'option3',
    ]);
    const [xlValue, setXlValue] = useState<(string | number)[]>([]);

    return (
      <div className="flex flex-col gap-6">
        <h3 className="text-lg font-semibold">Combobox Sizes</h3>
        <div className="flex w-full flex-col gap-4">
          <div>
            <p className="mb-1 text-xs font-medium opacity-70">Small (sm)</p>
            <ComboboxField
              name="size-sm"
              size="sm"
              options={sampleOptions}
              placeholder="Small combobox"
              value={smValue}
              onChange={(v) => setSmValue(v ?? [])}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium opacity-70">
              Medium (md) - default
            </p>
            <ComboboxField
              name="size-md"
              size="md"
              options={sampleOptions}
              placeholder="Medium combobox"
              value={mdValue}
              onChange={(v) => setMdValue(v ?? [])}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium opacity-70">Large (lg)</p>
            <ComboboxField
              name="size-lg"
              size="lg"
              options={sampleOptions}
              placeholder="Large combobox"
              value={lgValue}
              onChange={(v) => setLgValue(v ?? [])}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium opacity-70">
              Extra Large (xl)
            </p>
            <ComboboxField
              name="size-xl"
              size="xl"
              options={sampleOptions}
              placeholder="Extra large combobox"
              value={xlValue}
              onChange={(v) => setXlValue(v ?? [])}
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
          'All available sizes (sm, md, lg, xl). Medium is the default size.',
      },
    },
  },
};

export const States: Story = {
  name: 'States: All Variants',
  render: () => (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold">Combobox States</h3>
      <div className="flex w-full flex-col gap-4">
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">Normal</p>
          <ComboboxField
            name="state-normal"
            options={sampleOptions}
            placeholder="Normal state"
            value={[]}
            onChange={() => {
              // no-op
            }}
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">With Selection</p>
          <ComboboxField
            name="state-selected"
            options={sampleOptions}
            placeholder="With selection"
            value={['option1', 'option2']}
            onChange={() => {
              // no-op
            }}
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">Disabled</p>
          <ComboboxField
            name="state-disabled"
            options={sampleOptions}
            disabled
            value={['option2']}
            onChange={() => {
              // no-op
            }}
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">Read Only</p>
          <ComboboxField
            name="state-readonly"
            options={sampleOptions}
            readOnly
            value={['option1', 'option3']}
            onChange={() => {
              // no-op
            }}
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">Invalid</p>
          <ComboboxField
            name="state-invalid"
            options={sampleOptions}
            aria-invalid
            value={['option2']}
            onChange={() => {
              // no-op
            }}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All available states. State priority: disabled > readOnly > invalid > normal',
      },
    },
  },
};

export const WithSearch: Story = {
  render: () => {
    const [value, setValue] = useState<(string | number)[]>([]);

    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Search Filtering</h3>
          <p className="text-sm opacity-70">
            Type to filter the list of options
          </p>
          <div className="w-80">
            <ComboboxField
              name="with-search"
              options={countryOptions}
              placeholder="Search countries..."
              searchPlaceholder="Type to filter..."
              emptyMessage="No countries found."
              value={value}
              onChange={(v) => setValue(v ?? [])}
            />
          </div>
          <p className="text-xs opacity-70">
            Selected: {value.length === 0 ? 'none' : value.join(', ')}
          </p>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Without Search</h3>
          <p className="text-sm opacity-70">
            Search can be disabled for shorter lists
          </p>
          <div className="w-80">
            <ComboboxField
              name="without-search"
              options={sampleOptions}
              placeholder="Select options..."
              showSearch={false}
              value={[]}
              onChange={() => {
                // no-op
              }}
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
          'The search input filters options as you type. Can be disabled with showSearch={false}.',
      },
    },
  },
};

export const WithSelectAll: Story = {
  name: 'Bulk Actions',
  render: () => {
    const [withActions, setWithActions] = useState<(string | number)[]>([]);
    const [withoutActions, setWithoutActions] = useState<(string | number)[]>(
      [],
    );

    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">With Bulk Actions (Default)</h3>
          <p className="text-sm opacity-70">
            Select All and Deselect All buttons
          </p>
          <div className="w-80">
            <ComboboxField
              name="with-bulk-actions"
              options={participantOptions}
              placeholder="Select participants..."
              singular="Participant"
              plural="Participants"
              value={withActions}
              onChange={(v) => setWithActions(v ?? [])}
            />
          </div>
          <p className="text-xs opacity-70">
            Selected: {withActions.length} / {participantOptions.length}
          </p>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Without Bulk Actions</h3>
          <p className="text-sm opacity-70">
            Can be disabled with showSelectAll/showDeselectAll props
          </p>
          <div className="w-80">
            <ComboboxField
              name="without-bulk-actions"
              options={participantOptions}
              placeholder="Select participants..."
              showSelectAll={false}
              showDeselectAll={false}
              value={withoutActions}
              onChange={(v) => setWithoutActions(v ?? [])}
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
          'Bulk selection actions (Select All / Deselect All) can be toggled independently.',
      },
    },
  },
};

export const LongOptionList: Story = {
  render: () => {
    const [value, setValue] = useState<(string | number)[]>([]);

    const longOptions: ComboboxOption[] = Array.from(
      { length: 30 },
      (_, i) => ({
        value: `item-${i + 1}`,
        label: `Item ${i + 1} - A longer description here`,
      }),
    );

    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Long List with Scroll</h3>
        <p className="text-sm opacity-70">
          Lists with many items show a scrollable dropdown with max height
        </p>
        <div className="w-96">
          <ComboboxField
            name="long-list"
            options={longOptions}
            placeholder="Select items..."
            value={value}
            onChange={(v) => setValue(v ?? [])}
          />
        </div>
        <p className="text-xs opacity-70">Selected: {value.length} items</p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'The dropdown shows a max height with scrolling for long lists.',
      },
    },
  },
};

export const UsageExamples: Story = {
  render: () => {
    const [selectedParticipants, setSelectedParticipants] = useState<
      (string | number)[]
    >(participantOptions.map((p) => p.value));
    const [selectedCountries, setSelectedCountries] = useState<
      (string | number)[]
    >(['us', 'uk']);

    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Participant Selector</h3>
          <p className="text-sm opacity-70">
            Typical usage for selecting participants (default all selected)
          </p>
          <div className="w-80">
            <ComboboxField
              name="participants"
              options={participantOptions}
              placeholder="Select Participants..."
              singular="Participant"
              plural="Participants"
              value={selectedParticipants}
              onChange={(v) => setSelectedParticipants(v ?? [])}
            />
          </div>
          <p className="text-xs opacity-70">
            {selectedParticipants.length === participantOptions.length
              ? 'All participants selected'
              : `${selectedParticipants.length} of ${participantOptions.length} participants selected`}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Country Multi-Select</h3>
          <p className="text-sm opacity-70">
            Filter by multiple countries with search
          </p>
          <div className="w-80">
            <ComboboxField
              name="countries"
              options={countryOptions}
              placeholder="Select Countries..."
              searchPlaceholder="Search countries..."
              singular="Country"
              plural="Countries"
              value={selectedCountries}
              onChange={(v) => setSelectedCountries(v ?? [])}
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
          'Real-world usage examples showing participant selection and country filtering.',
      },
    },
  },
};

export const DisabledOptions: Story = {
  render: () => {
    const [value, setValue] = useState<(string | number)[]>(['option1']);

    const optionsWithDisabled: ComboboxOption[] = [
      { value: 'option1', label: 'Available Option 1' },
      { value: 'option2', label: 'Disabled Option 2', disabled: true },
      { value: 'option3', label: 'Available Option 3' },
      { value: 'option4', label: 'Disabled Option 4', disabled: true },
      { value: 'option5', label: 'Available Option 5' },
    ];

    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Disabled Options</h3>
        <p className="text-sm opacity-70">Individual options can be disabled</p>
        <div className="w-80">
          <ComboboxField
            name="disabled-options"
            options={optionsWithDisabled}
            placeholder="Select options..."
            value={value}
            onChange={(v) => setValue(v ?? [])}
          />
        </div>
        <p className="text-xs opacity-70">
          Note: Select All only selects enabled options
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Individual options can be disabled. Select All respects disabled state.',
      },
    },
  },
};

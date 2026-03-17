import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  AlertCircle,
  Calendar,
  Check,
  DollarSign,
  Loader2,
  Lock,
  Mail,
  Search,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import Paragraph from '~/components/typography/Paragraph';
import InputField from './InputField';

const meta: Meta<typeof InputField> = {
  title: 'Systems/Form/Fields/InputField',
  component: InputField,
  tags: ['autodocs'],
  argTypes: {
    'size': {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the input field',
      table: {
        type: { summary: 'xs | sm | md | lg | xl' },
        defaultValue: { summary: 'md' },
      },
    },
    'type': {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description:
        'HTML input type - affects onChange value type (number type returns number, others return string)',
      table: {
        type: {
          summary: 'text | email | password | number | tel | url | search',
        },
        defaultValue: { summary: 'text' },
      },
    },
    'disabled': {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    'readOnly': {
      control: 'boolean',
      description: 'Whether the input is read-only',
    },
    'aria-invalid': {
      control: 'boolean',
      description: 'Whether the input has aria-invalid state styling',
    },
    'placeholder': {
      control: 'text',
      description: 'Placeholder text for the input',
    },
    'prefixComponent': {
      control: false,
      description: 'ReactNode to display before the input (e.g., icons)',
    },
    'suffixComponent': {
      control: false,
      description:
        'ReactNode to display after the input (e.g., buttons, icons)',
    },
    'onChange': {
      control: false,
      description:
        'Type-safe change handler - receives number for type="number", string for others',
    },
  },
  args: {
    placeholder: 'Enter text...',
    type: 'text',
    size: 'md',
    disabled: false,
    readOnly: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default input field with interactive controls. Use the Controls panel to experiment with different configurations.
 */
export const Default: Story = {
  args: {},
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <InputField
        {...args}
        value={value}
        onChange={(v) => setValue(v ?? '')}
        data-testid="default-input"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('default-input');

    await expect(input).toHaveValue('');
    await userEvent.type(input, 'Hello World');
    await expect(input).toHaveValue('Hello World');
  },
};

/**
 * All available sizes from extra-small to extra-large.
 * Use controls to change placeholder, disabled, and readOnly states for all inputs.
 */
export const Sizes: Story = {
  args: {
    placeholder: 'Type here...',
  },
  argTypes: {
    'disabled': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
    'size': { control: false },
    'type': { control: false },
  },
  render: (args) => (
    <div className="flex w-full flex-col gap-4">
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <InputField
          key={size}
          {...args}
          size={size}
          placeholder={`${args.placeholder} (${size})`}
          aria-label={`${size} size input`}
          prefixComponent={<Search className="size-4" />}
        />
      ))}
    </div>
  ),
};

/**
 * Input states: normal, disabled, read-only, and invalid.
 * State priority: disabled > readOnly > invalid > normal.
 * Use controls to change size, type, and placeholder for all inputs.
 */
export const States: Story = {
  args: {
    size: 'md',
  },
  argTypes: {
    'disabled': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
  render: function Render(args) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { value: _value, onChange: _onChange, ...restArgs } = args;
    const [normalValue, setNormalValue] = useState('');
    const [disabledValue, setDisabledValue] = useState('Cannot edit this');
    const [readonlyValue, setReadonlyValue] = useState('Read-only text');
    const [invalidValue, setInvalidValue] = useState('Invalid value');

    return (
      <div className="flex w-80 flex-col gap-4">
        <div>
          <Paragraph
            margin="none"
            className="mb-1 text-xs font-medium opacity-70"
          >
            Normal
          </Paragraph>
          <InputField
            {...restArgs}
            value={normalValue}
            onChange={(v) => setNormalValue(v ?? '')}
            placeholder="Normal state"
            aria-label="Normal state input"
            data-testid="normal-input"
          />
        </div>
        <div>
          <Paragraph
            margin="none"
            className="mb-1 text-xs font-medium opacity-70"
          >
            Disabled
          </Paragraph>
          <InputField
            {...restArgs}
            disabled
            value={disabledValue}
            onChange={(v) => setDisabledValue(v ?? '')}
            aria-label="Disabled state input"
            data-testid="disabled-input"
          />
        </div>
        <div>
          <Paragraph
            margin="none"
            className="mb-1 text-xs font-medium opacity-70"
          >
            Read-Only
          </Paragraph>
          <InputField
            {...restArgs}
            readOnly
            value={readonlyValue}
            onChange={(v) => setReadonlyValue(v ?? '')}
            aria-label="Read-only state input"
            data-testid="readonly-input"
          />
        </div>
        <div>
          <Paragraph
            margin="none"
            className="mb-1 text-xs font-medium opacity-70"
          >
            Invalid
          </Paragraph>
          <InputField
            {...restArgs}
            aria-invalid
            value={invalidValue}
            onChange={(v) => setInvalidValue(v ?? '')}
            aria-label="Invalid state input"
            data-testid="invalid-input"
            suffixComponent={
              <AlertCircle className="text-destructive size-4" />
            }
          />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const disabledInput = canvas.getByTestId('disabled-input');
    await expect(disabledInput).toBeDisabled();
    await expect(disabledInput).toHaveValue('Cannot edit this');
    await userEvent.type(disabledInput, 'new text');
    await expect(disabledInput).toHaveValue('Cannot edit this');

    const readonlyInput = canvas.getByTestId('readonly-input');
    await expect(readonlyInput).toHaveAttribute('readonly');

    const invalidInput = canvas.getByTestId('invalid-input');
    await expect(invalidInput).toHaveAttribute('aria-invalid', 'true');
  },
};

/**
 * All supported HTML input types. Number type returns number on onChange, others return string.
 * Use controls to change size, disabled, and readOnly for all inputs.
 */
export const InputTypes: Story = {
  args: {
    size: 'md',
  },
  argTypes: {
    'disabled': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
    'type': { control: false },
    'placeholder': { control: false },
  },
  render: function Render(args) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { value: _value, onChange: _onChange, ...restArgs } = args;
    const [numberValue, setNumberValue] = useState<number | undefined>();

    return (
      <div className="flex w-80 flex-col gap-3">
        <InputField
          {...restArgs}
          type="text"
          placeholder="Text"
          aria-label="Text input"
        />
        <InputField
          {...restArgs}
          type="email"
          placeholder="email@example.com"
          aria-label="Email input"
          prefixComponent={<Mail className="size-4" />}
        />
        <InputField
          {...restArgs}
          type="password"
          placeholder="Password"
          aria-label="Password input"
          prefixComponent={<Lock className="size-4" />}
        />
        <InputField
          {...restArgs}
          type="number"
          placeholder="Enter number"
          aria-label="Number input"
          data-testid="number-input"
          value={numberValue?.toString() ?? ''}
          onChange={(v) => setNumberValue(v ? Number(v) : undefined)}
        />
        <Paragraph
          margin="none"
          className="text-xs opacity-70"
          data-testid="number-value"
        >
          Number value: {numberValue ?? 'undefined'} (type: {typeof numberValue}
          )
        </Paragraph>
        <InputField
          {...restArgs}
          type="tel"
          placeholder="+1 (555) 123-4567"
          aria-label="Telephone input"
        />
        <InputField
          {...restArgs}
          type="url"
          placeholder="https://example.com"
          aria-label="URL input"
        />
        <InputField
          {...restArgs}
          type="search"
          placeholder="Search..."
          aria-label="Search input"
          prefixComponent={<Search className="size-4" />}
        />
        <InputField
          {...restArgs}
          type="date"
          aria-label="Date input"
          prefixComponent={<Calendar className="size-4" />}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const numberInput = canvas.getByTestId('number-input');

    await userEvent.type(numberInput, '42');

    const valueDisplay = canvas.getByTestId('number-value');
    await expect(valueDisplay).toHaveTextContent('Number value: 42');
    await expect(valueDisplay).toHaveTextContent('type: number');
  },
};

/**
 * Input with prefix and suffix icons demonstrating various use cases.
 * Use controls to change size for all inputs.
 */
export const WithIcons: Story = {
  args: {
    size: 'md',
  },
  argTypes: {
    'disabled': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
    'type': { control: false },
    'placeholder': { control: false },
  },
  render: (args) => (
    <div className="flex w-80 flex-col gap-4">
      <InputField
        {...args}
        placeholder="Search..."
        aria-label="Search input"
        prefixComponent={<Search className="size-4" />}
      />
      <InputField
        {...args}
        placeholder="Username"
        aria-label="Username input"
        prefixComponent={<User className="size-4" />}
      />
      <InputField
        {...args}
        type="number"
        placeholder="0.00"
        aria-label="Price input"
        prefixComponent={<DollarSign className="size-4" />}
        suffixComponent={<span className="text-sm">USD</span>}
      />
      <InputField
        {...args}
        defaultValue="Valid input"
        aria-label="Valid input"
        suffixComponent={<Check className="text-success size-4" />}
      />
      <InputField
        {...args}
        placeholder="Loading..."
        aria-label="Loading input"
        disabled
        suffixComponent={<Loader2 className="size-4 animate-spin" />}
      />
    </div>
  ),
};

/**
 * Number input features: step, min/max constraints, decimal precision,
 * and prefix/suffix components alongside stepper buttons.
 */
export const NumberInputFeatures: Story = {
  args: {
    size: 'md',
  },
  argTypes: {
    'disabled': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
    'type': { control: false },
    'placeholder': { control: false },
  },
  render: function Render(args) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { value: _value, onChange: _onChange, ...restArgs } = args;
    const [wholeValue, setWholeValue] = useState('10');
    const [decimalValue, setDecimalValue] = useState('0.50');
    const [constrainedValue, setConstrainedValue] = useState('5');
    const [fineValue, setFineValue] = useState('1.000');
    const [priceValue, setPriceValue] = useState('9.99');

    return (
      <div className="flex w-96 flex-col gap-6">
        <div className="space-y-1">
          <Paragraph margin="none" className="text-sm font-medium">
            Default (step=1)
          </Paragraph>
          <InputField
            {...restArgs}
            type="number"
            value={wholeValue}
            onChange={(v) => setWholeValue(v ?? '')}
            placeholder="Whole numbers"
            aria-label="Whole number input"
            data-testid="whole-number"
          />
          <Paragraph margin="none" className="text-xs opacity-70">
            Value: {wholeValue || 'empty'}
          </Paragraph>
        </div>

        <div className="space-y-1">
          <Paragraph margin="none" className="text-sm font-medium">
            Decimal (step=0.01)
          </Paragraph>
          <InputField
            {...restArgs}
            type="number"
            step="0.01"
            value={decimalValue}
            onChange={(v) => setDecimalValue(v ?? '')}
            placeholder="0.00"
            aria-label="Decimal input"
            data-testid="decimal-number"
          />
          <Paragraph margin="none" className="text-xs opacity-70">
            Value: {decimalValue || 'empty'}
          </Paragraph>
        </div>

        <div className="space-y-1">
          <Paragraph margin="none" className="text-sm font-medium">
            Constrained (min=0, max=10, step=1)
          </Paragraph>
          <InputField
            {...restArgs}
            type="number"
            min="0"
            max="10"
            value={constrainedValue}
            onChange={(v) => setConstrainedValue(v ?? '')}
            placeholder="0-10"
            aria-label="Constrained number input"
            data-testid="constrained-number"
          />
          <Paragraph margin="none" className="text-xs opacity-70">
            Value: {constrainedValue || 'empty'}
          </Paragraph>
        </div>

        <div className="space-y-1">
          <Paragraph margin="none" className="text-sm font-medium">
            Fine precision (step=0.001)
          </Paragraph>
          <InputField
            {...restArgs}
            type="number"
            step="0.001"
            value={fineValue}
            onChange={(v) => setFineValue(v ?? '')}
            placeholder="0.000"
            aria-label="Fine precision input"
            data-testid="fine-number"
          />
          <Paragraph margin="none" className="text-xs opacity-70">
            Value: {fineValue || 'empty'}
          </Paragraph>
        </div>

        <div className="space-y-1">
          <Paragraph margin="none" className="text-sm font-medium">
            With prefix/suffix (step=0.01)
          </Paragraph>
          <InputField
            {...restArgs}
            type="number"
            step="0.01"
            min="0"
            value={priceValue}
            onChange={(v) => setPriceValue(v ?? '')}
            placeholder="0.00"
            aria-label="Price input"
            data-testid="price-number"
            prefixComponent={<DollarSign className="size-4" />}
            suffixComponent={<span className="text-sm opacity-50">USD</span>}
          />
          <Paragraph margin="none" className="text-xs opacity-70">
            Value: {priceValue || 'empty'}
          </Paragraph>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const constrainedInput = canvas.getByTestId('constrained-number');
    const increaseButton = canvas
      .getByTestId('constrained-number')
      .closest('div')
      ?.parentElement?.querySelector('[aria-label="Increase value"]');

    if (increaseButton) {
      // Click increase until we hit max
      for (let i = 0; i < 6; i++) {
        await userEvent.click(increaseButton);
      }
    }

    // Value should be clamped at 10
    await expect(constrainedInput).toHaveValue(10);
  },
};

/**
 * Input with a clear button that appears when there's text.
 * Use controls to change size, disabled, and readOnly states.
 */
export const ClearableInput: Story = {
  args: {
    size: 'md',
    placeholder: 'Type something...',
  },
  argTypes: {
    'disabled': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
    'type': { control: false },
  },
  render: function Render(args) {
    const [value, setValue] = useState('Sample text');

    return (
      <div className="w-80 space-y-2">
        <InputField
          {...args}
          value={value}
          onChange={(v) => setValue(v ?? '')}
          aria-label="Clearable text input"
          data-testid="clearable-input"
          suffixComponent={
            value && (
              <button
                type="button"
                data-testid="clear-button"
                onClick={() => setValue('')}
                className="hover:text-current"
                aria-label="Clear input"
              >
                <X className="size-4" />
              </button>
            )
          }
        />
        <Paragraph margin="none" className="text-xs opacity-70">
          Current value: &ldquo;{value}&rdquo;
        </Paragraph>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('clearable-input');

    await expect(input).toHaveValue('Sample text');
    const clearButton = canvas.getByTestId('clear-button');
    await userEvent.click(clearButton);
    await expect(input).toHaveValue('');
  },
};

/**
 * Demonstrates the type-safe onChange handler.
 * Text inputs return string, number inputs return number (or undefined when empty).
 * Use controls to change size for both inputs.
 */
export const TypeSafeOnChange: Story = {
  args: {
    size: 'md',
  },
  argTypes: {
    'aria-invalid': { control: 'boolean' },
    'type': { control: false },
    'placeholder': { control: false },
  },
  render: function Render(args) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { value: _value, onChange: _onChange, ...restArgs } = args;
    const [textValue, setTextValue] = useState('');
    const [numberValue, setNumberValue] = useState<number | undefined>(42);

    return (
      <div className="flex w-80 flex-col gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Text Input</label>
          <InputField
            {...restArgs}
            type="text"
            value={textValue}
            onChange={(v) => setTextValue(v ?? '')}
            placeholder="Type text..."
            data-testid="text-input"
          />
          <Paragraph
            margin="none"
            className="text-xs opacity-70"
            data-testid="text-info"
          >
            Type: {typeof textValue} | Value: &ldquo;{textValue}&rdquo;
          </Paragraph>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Number Input</label>
          <InputField
            {...restArgs}
            type="number"
            value={numberValue?.toString() ?? ''}
            onChange={(v) => setNumberValue(v ? Number(v) : undefined)}
            placeholder="Enter number..."
            data-testid="number-input"
          />
          <Paragraph
            margin="none"
            className="text-xs opacity-70"
            data-testid="number-info"
          >
            Type: {typeof numberValue} | Value: {numberValue ?? 'undefined'}
          </Paragraph>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const textInput = canvas.getByTestId('text-input');
    await userEvent.type(textInput, 'hello');
    const textInfo = canvas.getByTestId('text-info');
    await expect(textInfo).toHaveTextContent('Type: string');

    const numberInput = canvas.getByTestId('number-input');
    await userEvent.clear(numberInput);
    await userEvent.type(numberInput, '100');
    const numberInfo = canvas.getByTestId('number-info');
    await expect(numberInfo).toHaveTextContent('Type: number');
    await expect(numberInfo).toHaveTextContent('Value: 100');
  },
};

/**
 * Tests keyboard navigation and focus behavior.
 * All controls are connected.
 */
export const KeyboardNavigation: Story = {
  args: {
    placeholder: 'Tab to focus, type, then tab away',
  },
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <InputField
        {...args}
        value={value}
        onChange={(v) => setValue(v ?? '')}
        data-testid="keyboard-input"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('keyboard-input');

    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.type(input, 'Test');
    await expect(input).toHaveValue('Test');
    await userEvent.tab();
    await expect(input).not.toHaveFocus();
  },
};

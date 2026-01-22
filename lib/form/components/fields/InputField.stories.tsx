import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  AlertCircle,
  Calendar,
  Check,
  DollarSign,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Search,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { type FormChangeEvent } from '../Field/types';
import InputField from './InputField';

/**
 * Helper to extract the value from an InputField onChange event.
 * InputField passes the native ChangeEvent directly, but the TypeScript
 * type signature says it accepts values. Cast through unknown to bridge
 * the type gap for standalone usage in stories.
 */
const getInputValue = (e: unknown) => (e as FormChangeEvent).target.value;

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
        'Change handler that receives the native React.ChangeEvent. Access the value via event.target.value.',
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
        onChange={(e) => setValue(getInputValue(e))}
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
          prefixComponent={<Search className="h-4 w-4" />}
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
          <p className="mb-1 text-xs font-medium opacity-70">Normal</p>
          <InputField
            {...restArgs}
            value={normalValue}
            onChange={(e) => setNormalValue(getInputValue(e))}
            placeholder="Normal state"
            aria-label="Normal state input"
            data-testid="normal-input"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">Disabled</p>
          <InputField
            {...restArgs}
            disabled
            value={disabledValue}
            onChange={(e) => setDisabledValue(getInputValue(e))}
            aria-label="Disabled state input"
            data-testid="disabled-input"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">Read-Only</p>
          <InputField
            {...restArgs}
            readOnly
            value={readonlyValue}
            onChange={(e) => setReadonlyValue(getInputValue(e))}
            aria-label="Read-only state input"
            data-testid="readonly-input"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">Invalid</p>
          <InputField
            {...restArgs}
            aria-invalid
            value={invalidValue}
            onChange={(e) => setInvalidValue(getInputValue(e))}
            aria-label="Invalid state input"
            data-testid="invalid-input"
            suffixComponent={
              <AlertCircle className="text-destructive h-4 w-4" />
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
          prefixComponent={<Mail className="h-4 w-4" />}
        />
        <InputField
          {...restArgs}
          type="password"
          placeholder="Password"
          aria-label="Password input"
          prefixComponent={<Lock className="h-4 w-4" />}
        />
        <InputField
          {...restArgs}
          type="number"
          placeholder="Enter number"
          aria-label="Number input"
          data-testid="number-input"
          value={numberValue?.toString() ?? ''}
          onChange={(e) => {
            const val = getInputValue(e);
            setNumberValue(val ? Number(val) : undefined);
          }}
        />
        <p className="text-xs opacity-70" data-testid="number-value">
          Number value: {numberValue ?? 'undefined'} (type: {typeof numberValue}
          )
        </p>
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
          prefixComponent={<Search className="h-4 w-4" />}
        />
        <InputField
          {...restArgs}
          type="date"
          aria-label="Date input"
          prefixComponent={<Calendar className="h-4 w-4" />}
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
        prefixComponent={<Search className="h-4 w-4" />}
      />
      <InputField
        {...args}
        placeholder="Username"
        aria-label="Username input"
        prefixComponent={<User className="h-4 w-4" />}
      />
      <InputField
        {...args}
        type="number"
        placeholder="0.00"
        aria-label="Price input"
        prefixComponent={<DollarSign className="h-4 w-4" />}
        suffixComponent={<span className="text-sm">USD</span>}
      />
      <InputField
        {...args}
        defaultValue="Valid input"
        aria-label="Valid input"
        suffixComponent={<Check className="text-success h-4 w-4" />}
      />
      <InputField
        {...args}
        placeholder="Loading..."
        aria-label="Loading input"
        disabled
        suffixComponent={<Loader2 className="h-4 w-4 animate-spin" />}
      />
    </div>
  ),
};

/**
 * Password input with visibility toggle button.
 * Use controls to change size, disabled, and readOnly states.
 */
export const PasswordInput: Story = {
  args: {
    size: 'md',
    placeholder: 'Enter password',
  },
  argTypes: {
    'disabled': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
    'type': { control: false },
  },
  render: function Render(args) {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <InputField
        {...args}
        type={showPassword ? 'text' : 'password'}
        defaultValue="secretpassword"
        aria-label="Password input"
        data-testid="password-input"
        prefixComponent={<Lock className="h-4 w-4" />}
        suffixComponent={
          <button
            type="button"
            data-testid="toggle-button"
            onClick={() => setShowPassword(!showPassword)}
            className="hover:text-current"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('password-input');
    const toggleButton = canvas.getByTestId('toggle-button');

    await expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(toggleButton);
    await expect(input).toHaveAttribute('type', 'text');
    await userEvent.click(toggleButton);
    await expect(input).toHaveAttribute('type', 'password');
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
          onChange={(e) => setValue(getInputValue(e))}
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
                <X className="h-4 w-4" />
              </button>
            )
          }
        />
        <p className="text-xs opacity-70">
          Current value: &ldquo;{value}&rdquo;
        </p>
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
            onChange={(e) => setTextValue(getInputValue(e))}
            placeholder="Type text..."
            data-testid="text-input"
          />
          <p className="text-xs opacity-70" data-testid="text-info">
            Type: {typeof textValue} | Value: &ldquo;{textValue}&rdquo;
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Number Input</label>
          <InputField
            {...restArgs}
            type="number"
            value={numberValue?.toString() ?? ''}
            onChange={(e) => {
              const val = getInputValue(e);
              setNumberValue(val ? Number(val) : undefined);
            }}
            placeholder="Enter number..."
            data-testid="number-input"
          />
          <p className="text-xs opacity-70" data-testid="number-info">
            Type: {typeof numberValue} | Value: {numberValue ?? 'undefined'}
          </p>
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
        onChange={(e) => setValue(getInputValue(e))}
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

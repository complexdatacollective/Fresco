import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import NumberCounterField from './NumberCounterField';

const meta: Meta<typeof NumberCounterField> = {
  title: 'Systems/Form/Fields/NumberCounterField',
  component: NumberCounterField,
  tags: ['autodocs'],
  argTypes: {
    'disabled': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
    'size': {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the counter field',
      table: {
        type: { summary: 'sm | md | lg | xl' },
        defaultValue: { summary: 'md' },
      },
    },
    'minValue': {
      control: 'number',
      description: 'Minimum allowed value',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '-Infinity' },
      },
    },
    'maxValue': {
      control: 'number',
      description: 'Maximum allowed value',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 'Infinity' },
      },
    },
    'step': {
      control: 'number',
      description:
        'Step increment/decrement value. Supports decimals (e.g., 0.1) and larger steps (e.g., 5)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1' },
      },
    },
    'value': {
      control: 'number',
      description: 'Controlled value',
    },
    'onChange': {
      control: false,
      description: 'Callback fired when the value changes',
    },
  },
  args: {
    size: 'md',
    step: 1,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default number counter with interactive controls. Use the Controls panel to experiment with different configurations.
 */
export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(0);
    return (
      <div className="space-y-2">
        <NumberCounterField
          {...args}
          value={value}
          onChange={(v) => setValue(v)}
          data-testid="default-counter"
        />
        <p className="text-xs opacity-70" data-testid="counter-value">
          Current value: {value}
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const incrementButton = canvas.getByRole('button', {
      name: /increase/i,
    });
    const decrementButton = canvas.getByRole('button', {
      name: /decrease/i,
    });
    const valueDisplay = canvas.getByTestId('counter-value');

    await expect(valueDisplay).toHaveTextContent('Current value: 0');
    await userEvent.click(incrementButton);
    await expect(valueDisplay).toHaveTextContent('Current value: 1');
    await userEvent.click(incrementButton);
    await expect(valueDisplay).toHaveTextContent('Current value: 2');
    await userEvent.click(decrementButton);
    await expect(valueDisplay).toHaveTextContent('Current value: 1');
  },
};

/**
 * All available sizes from small to extra-large.
 */
export const Sizes: Story = {
  argTypes: {
    'disabled': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
    'size': { control: false },
  },
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} className="flex items-center gap-4">
          <span className="w-8 text-xs font-medium opacity-70">{size}</span>
          <NumberCounterField
            {...args}
            value={5}
            size={size}
            aria-label={`${size} size counter`}
          />
        </div>
      ))}
    </div>
  ),
};

/**
 * Counter states: normal, disabled, read-only, and invalid.
 * State priority: disabled > readOnly > invalid > normal.
 */
export const States: Story = {
  args: {
    size: 'md',
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-xs font-medium opacity-70">Normal</p>
        <NumberCounterField
          {...args}
          value={5}
          aria-label="Normal state counter"
          data-testid="normal-counter"
        />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium opacity-70">Disabled</p>
        <NumberCounterField
          {...args}
          value={5}
          disabled
          aria-label="Disabled state counter"
          data-testid="disabled-counter"
        />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium opacity-70">Read-Only</p>
        <NumberCounterField
          {...args}
          value={5}
          readOnly
          aria-label="Read-only state counter"
          data-testid="readonly-counter"
        />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium opacity-70">Invalid</p>
        <NumberCounterField
          {...args}
          value={5}
          aria-invalid
          aria-label="Invalid state counter"
          data-testid="invalid-counter"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const disabledCounter = canvas.getByTestId('disabled-counter');
    await expect(disabledCounter).toHaveAttribute('aria-disabled', 'true');

    const readonlyCounter = canvas.getByTestId('readonly-counter');
    await expect(readonlyCounter).toHaveAttribute('aria-readonly', 'true');

    const invalidCounter = canvas.getByTestId('invalid-counter');
    await expect(invalidCounter).toHaveAttribute('aria-invalid', 'true');
  },
};

/**
 * Counter with min and max boundaries. Buttons are aria-disabled when limits are reached.
 */
export const WithBoundaries: Story = {
  args: {
    minValue: 0,
    maxValue: 10,
  },
  render: function Render(args) {
    const [value, setValue] = useState(5);
    return (
      <div className="space-y-4">
        <NumberCounterField
          {...args}
          value={value}
          onChange={(v) => setValue(v)}
          aria-label="Bounded counter"
          data-testid="bounded-counter"
        />
        <p className="text-xs opacity-70">
          Value: {value} (min: {args.minValue}, max: {args.maxValue})
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const incrementButton = canvas.getByRole('button', {
      name: /increase/i,
    });
    const decrementButton = canvas.getByRole('button', {
      name: /decrease/i,
    });

    // Click increment until we reach max (10)
    for (let i = 0; i < 6; i++) {
      await userEvent.click(incrementButton);
    }

    // Increment button should be aria-disabled at max
    await expect(incrementButton).toBeDisabled();

    // Click decrement until we reach min (0)
    for (let i = 0; i < 11; i++) {
      await userEvent.click(decrementButton);
    }

    // Decrement button should be aria-disabled at min
    await expect(decrementButton).toBeDisabled();
  },
};

/**
 * Counter with different step values. Useful for quantities, prices, or percentages.
 */
export const StepValues: Story = {
  argTypes: {
    'disabled': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
    'step': { control: false },
  },
  render: function Render(args) {
    const [value1, setValue1] = useState(0);
    const [value5, setValue5] = useState(0);
    const [value01, setValue01] = useState(0);
    const [value025, setValue025] = useState(0);

    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">
            Step: 1 (default) - Value: {value1}
          </p>
          <NumberCounterField
            {...args}
            step={1}
            value={value1}
            onChange={(v) => setValue1(v)}
            aria-label="Counter with step 1"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">
            Step: 5 - Value: {value5}
          </p>
          <NumberCounterField
            {...args}
            step={5}
            value={value5}
            onChange={(v) => setValue5(v)}
            aria-label="Counter with step 5"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">
            Step: 0.1 - Value: {value01}
          </p>
          <NumberCounterField
            {...args}
            step={0.1}
            value={value01}
            onChange={(v) => setValue01(v)}
            aria-label="Counter with step 0.1"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">
            Step: 0.25 - Value: {value025}
          </p>
          <NumberCounterField
            {...args}
            step={0.25}
            value={value025}
            onChange={(v) => setValue025(v)}
            aria-label="Counter with step 0.25"
          />
        </div>
      </div>
    );
  },
};

/**
 * Demonstrates the type-safe onChange handler and controlled mode.
 */
export const ControlledMode: Story = {
  argTypes: {
    'disabled': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
    'value': { control: false },
    'onChange': { control: false },
  },
  render: function Render(args) {
    const [value, setValue] = useState(0);

    return (
      <div className="space-y-4">
        <NumberCounterField
          {...args}
          value={value}
          onChange={(v) => setValue(v)}
          aria-label="Controlled counter"
          data-testid="controlled-counter"
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-input rounded px-3 py-1 text-sm"
            onClick={() => setValue(0)}
          >
            Reset to 0
          </button>
          <button
            type="button"
            className="bg-input rounded px-3 py-1 text-sm"
            onClick={() => setValue(100)}
          >
            Set to 100
          </button>
        </div>
        <p className="text-xs opacity-70" data-testid="controlled-value">
          Type: {typeof value} | Value: {value}
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const valueDisplay = canvas.getByTestId('controlled-value');
    const resetButton = canvas.getByRole('button', { name: /reset to 0/i });
    const setTo100Button = canvas.getByRole('button', { name: /set to 100/i });

    await expect(valueDisplay).toHaveTextContent('Type: number');
    await expect(valueDisplay).toHaveTextContent('Value: 0');

    await userEvent.click(setTo100Button);
    await expect(valueDisplay).toHaveTextContent('Value: 100');

    await userEvent.click(resetButton);
    await expect(valueDisplay).toHaveTextContent('Value: 0');
  },
};

/**
 * Tests keyboard navigation and accessibility.
 * - Arrow Up/Right: Increment
 * - Arrow Down/Left: Decrement
 * - Home: Go to minimum (if set)
 * - End: Go to maximum (if set)
 */
export const KeyboardNavigation: Story = {
  args: {
    minValue: 0,
    maxValue: 10,
  },
  render: function Render(args) {
    const [value, setValue] = useState(5);
    return (
      <div className="space-y-4">
        <p className="text-xs opacity-70">
          Focus the counter and use keyboard:
        </p>
        <ul className="list-disc pl-4 text-xs opacity-70">
          <li>Arrow Up/Right: Increment</li>
          <li>Arrow Down/Left: Decrement</li>
          <li>Home: Go to minimum</li>
          <li>End: Go to maximum</li>
        </ul>
        <NumberCounterField
          {...args}
          value={value}
          onChange={(v) => setValue(v)}
          aria-label="Keyboard navigation counter"
          data-testid="keyboard-counter"
        />
        <p className="text-xs opacity-70" data-testid="keyboard-value">
          Value: {value}
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const counter = canvas.getByRole('spinbutton');
    const valueDisplay = canvas.getByTestId('keyboard-value');

    // Focus the counter
    await userEvent.click(counter);
    await expect(counter).toHaveFocus();

    // Test Arrow Up
    await userEvent.keyboard('{ArrowUp}');
    await expect(valueDisplay).toHaveTextContent('Value: 6');

    // Test Arrow Down
    await userEvent.keyboard('{ArrowDown}');
    await expect(valueDisplay).toHaveTextContent('Value: 5');

    // Test End key (go to max)
    await userEvent.keyboard('{End}');
    await expect(valueDisplay).toHaveTextContent('Value: 10');

    // Test Home key (go to min)
    await userEvent.keyboard('{Home}');
    await expect(valueDisplay).toHaveTextContent('Value: 0');
  },
};

/**
 * Counter used in a practical quantity selector scenario.
 */
export const QuantitySelector: Story = {
  args: {
    minValue: 1,
    maxValue: 99,
  },
  render: function Render(args) {
    const [quantity, setQuantity] = useState(1);
    const pricePerItem = 29.99;

    return (
      <div className="bg-surface rounded-lg border p-4">
        <div className="mb-4">
          <h3 className="font-medium">Product Name</h3>
          <p className="text-sm opacity-70">${pricePerItem.toFixed(2)} each</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm">Quantity:</span>
            <NumberCounterField
              {...args}
              value={quantity}
              onChange={(v) => setQuantity(v)}
              aria-label="Quantity"
            />
          </div>
          <div className="text-right">
            <p className="text-sm opacity-70">Total</p>
            <p className="text-lg font-bold">
              ${(quantity * pricePerItem).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Counter used for rating or scoring scenarios with step of 0.5.
 */
export const RatingCounter: Story = {
  args: {
    minValue: 0,
    maxValue: 5,
    step: 0.5,
    size: 'lg',
  },
  render: function Render(args) {
    const [rating, setRating] = useState(3);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Rating:</span>
          <NumberCounterField
            {...args}
            value={rating}
            onChange={(v) => setRating(v)}
            aria-label="Rating"
          />
          <span className="text-sm opacity-70">/ 5</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-2xl ${rating >= star ? 'text-yellow-500' : rating >= star - 0.5 ? 'text-yellow-500/50' : 'text-gray-300'}`}
            >
              ★
            </span>
          ))}
        </div>
      </div>
    );
  },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import SegmentedCodeField from './SegmentedCodeField';

const meta: Meta<typeof SegmentedCodeField> = {
  title: 'Systems/Form/Fields/SegmentedCodeField',
  component: SegmentedCodeField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    'segments': {
      control: { type: 'number', min: 2, max: 12 },
      description: 'Number of input segments',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '6' },
      },
    },
    'characterSet': {
      control: 'select',
      options: ['numeric', 'alphanumeric', 'hex', 'alpha'],
      description:
        'Allowed character set. Determines input filtering and mobile keyboard.',
      table: {
        type: { summary: "'numeric' | 'alphanumeric' | 'hex' | 'alpha'" },
        defaultValue: { summary: "'numeric'" },
      },
    },
    'size': {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of each segment input',
      table: {
        type: { summary: "'sm' | 'md' | 'lg' | 'xl'" },
        defaultValue: { summary: "'md'" },
      },
    },
    'separatorAfter': {
      control: 'object',
      description:
        'Array of segment indexes after which to show a separator character',
      table: {
        type: { summary: 'number[]' },
        defaultValue: { summary: '[]' },
      },
    },
    'separatorChar': {
      control: 'text',
      description: 'Character displayed between segment groups',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'–'" },
      },
    },
    'disabled': {
      control: 'boolean',
      description: 'Whether all segments are disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'readOnly': {
      control: 'boolean',
      description: 'Whether all segments are read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'aria-invalid': {
      control: 'boolean',
      description: 'Whether the field has aria-invalid state styling',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    'onChange': {
      control: false,
      table: { type: { summary: '(value: string | undefined) => void' } },
    },
    'onComplete': {
      control: false,
      description: 'Called when all segments are filled',
      table: { type: { summary: '(value: string) => void' } },
    },
  },
  args: {
    segments: 6,
    characterSet: 'numeric',
    size: 'md',
    disabled: false,
    readOnly: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <div className="flex flex-col items-center gap-4">
        <SegmentedCodeField
          {...args}
          value={value}
          onChange={(v) => setValue(v ?? '')}
          data-testid="default-code"
        />
        <p className="text-xs opacity-70" data-testid="value-display">
          Value: &ldquo;{value}&rdquo;
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstSegment = canvas.getByLabelText('Digit 1 of 6');

    await userEvent.click(firstSegment);
    await userEvent.keyboard('1');
    await userEvent.keyboard('2');
    await userEvent.keyboard('3');

    const display = canvas.getByTestId('value-display');
    await expect(display).toHaveTextContent('Value: \u201C123\u201D');
  },
};

export const WithSeparators: Story = {
  args: {
    segments: 6,
    separatorAfter: [2],
    separatorChar: '–',
  },
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <SegmentedCodeField
        {...args}
        value={value}
        onChange={(v) => setValue(v ?? '')}
      />
    );
  },
};

export const HexRecoveryCode: Story = {
  args: {
    segments: 8,
    characterSet: 'hex',
    separatorAfter: [3],
    separatorChar: '–',
  },
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <div className="flex flex-col items-center gap-4">
        <SegmentedCodeField
          {...args}
          value={value}
          onChange={(v) => setValue(v ?? '')}
          data-testid="hex-code"
        />
        <p className="text-xs opacity-70">Value: &ldquo;{value}&rdquo;</p>
      </div>
    );
  },
};

export const FourDigitPin: Story = {
  args: {
    segments: 4,
    characterSet: 'numeric',
    size: 'lg',
  },
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <SegmentedCodeField
        {...args}
        value={value}
        onChange={(v) => setValue(v ?? '')}
      />
    );
  },
};

export const Alphanumeric: Story = {
  args: {
    segments: 6,
    characterSet: 'alphanumeric',
  },
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <SegmentedCodeField
        {...args}
        value={value}
        onChange={(v) => setValue(v ?? '')}
        data-testid="alpha-code"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByLabelText('Digit 1 of 6');

    await userEvent.click(first);
    await userEvent.keyboard('a');
    await userEvent.keyboard('1');
    await userEvent.keyboard('B');

    // Non-alphanumeric characters should be ignored
    await userEvent.keyboard('!');
    await userEvent.keyboard('2');
  },
};

export const Sizes: Story = {
  args: {
    segments: 4,
  },
  argTypes: {
    size: { control: false },
  },
  render: function Render(args) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { value: _value, onChange: _onChange, ...restArgs } = args;
    return (
      <div className="flex flex-col items-start gap-6">
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} className="flex flex-col gap-1">
            <p className="text-xs font-medium opacity-70">{size}</p>
            <SegmentedCodeField {...restArgs} size={size} />
          </div>
        ))}
      </div>
    );
  },
};

export const States: Story = {
  args: {
    segments: 6,
  },
  render: function Render(args) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { value: _value, onChange: _onChange, ...restArgs } = args;
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">Normal</p>
          <SegmentedCodeField {...restArgs} data-testid="normal-code" />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">Disabled</p>
          <SegmentedCodeField
            {...restArgs}
            disabled
            value="123456"
            data-testid="disabled-code"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">Read-Only</p>
          <SegmentedCodeField
            {...restArgs}
            readOnly
            value="789012"
            data-testid="readonly-code"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium opacity-70">Invalid</p>
          <SegmentedCodeField
            {...restArgs}
            aria-invalid
            data-testid="invalid-code"
          />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const disabledSegment = canvas.getAllByLabelText(/Digit 1 of 6/)[1]!;
    await expect(disabledSegment).toBeDisabled();

    const readonlySegment = canvas.getAllByLabelText(/Digit 1 of 6/)[2]!;
    await expect(readonlySegment).toHaveAttribute('readonly');
  },
};

export const PasteSupport: Story = {
  args: {
    segments: 6,
  },
  render: function Render(args) {
    const [value, setValue] = useState('');
    const [completed, setCompleted] = useState(false);
    return (
      <div className="flex flex-col items-center gap-4">
        <SegmentedCodeField
          {...args}
          value={value}
          onChange={(v) => setValue(v ?? '')}
          onComplete={() => setCompleted(true)}
          data-testid="paste-code"
        />
        <p className="text-xs opacity-70">
          Try pasting &ldquo;123456&rdquo; into any segment
        </p>
        {completed && (
          <p className="text-success text-sm font-medium">Code complete!</p>
        )}
      </div>
    );
  },
};

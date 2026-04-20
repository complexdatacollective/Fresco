import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useState } from 'react';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import Surface from '~/components/layout/Surface';
import Paragraph from '~/components/typography/Paragraph';
import LikertScaleField from './LikertScale';

const meta = {
  title: 'Systems/Form/Fields/LikertScaleField',
  component: LikertScaleField,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Surface noContainer className="w-2xl">
        <Story />
      </Surface>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    'aria-invalid': { control: 'boolean' },
    'readOnly': { control: 'boolean' },
    'disabled': { control: 'boolean' },
    'options': { control: false },
    'value': { control: false },
    'onChange': { action: 'onChange' },
  },
  args: {
    disabled: false,
    readOnly: false,
  },
} satisfies Meta<typeof LikertScaleField>;

export default meta;
type Story = StoryObj<typeof meta>;

const agreementOptions = [
  { label: 'Strongly Disagree', value: 1 },
  { label: 'Disagree', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: 'Agree', value: 4 },
  { label: 'Strongly Agree', value: 5 },
];

const longLabelOptions = [
  { label: 'Completely disagree with this statement', value: 1 },
  { label: 'Somewhat disagree', value: 2 },
  { label: 'Neither agree nor disagree with the premise', value: 3 },
  { label: 'Somewhat agree', value: 4 },
  { label: 'Completely agree with this statement', value: 5 },
];

const binaryOptions = [
  { label: 'No', value: 0 },
  { label: 'Yes', value: 1 },
];

const threePointOptions = [
  { label: 'Low', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'High', value: 3 },
];

const markdownLabelOptions = [
  { label: '**Strongly** disagree', value: 1 },
  { label: '_Somewhat_ disagree', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: '_Somewhat_ agree', value: 4 },
  { label: '**Strongly** agree', value: 5 },
];

function ControlledLikert({
  initialValue = 1,
  ...args
}: Omit<React.ComponentProps<typeof LikertScaleField>, 'value' | 'onChange'> & {
  initialValue?: string | number;
  onChange?: (value: string | number) => void;
}) {
  const [value, setValue] = useState<string | number | undefined>(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <LikertScaleField
      {...args}
      value={value}
      onChange={(newValue) => {
        if (newValue !== undefined) {
          setValue(newValue);
          args.onChange?.(newValue);
        }
      }}
    />
  );
}

export const Default: Story = {
  args: {
    options: agreementOptions,
    value: 3,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const AtMinimum: Story = {
  args: {
    options: agreementOptions,
    value: 1,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const AtMaximum: Story = {
  args: {
    options: agreementOptions,
    value: 5,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const Disabled: Story = {
  args: {
    options: agreementOptions,
    value: 3,
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    options: agreementOptions,
    value: 4,
    readOnly: true,
  },
};

export const Invalid: Story = {
  args: {
    'options': agreementOptions,
    'value': 3,
    'aria-invalid': true,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const LongLabels: Story = {
  args: {
    options: longLabelOptions,
    value: 3,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const BinaryChoice: Story = {
  args: {
    options: binaryOptions,
    value: 0,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const ThreePoint: Story = {
  args: {
    options: threePointOptions,
    value: 2,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

export const MarkdownLabels: Story = {
  args: {
    options: markdownLabelOptions,
    value: 3,
  },
  render: (args) => <ControlledLikert {...args} initialValue={args.value} />,
};

function UnsetLikertWithValueDisplay({
  options = agreementOptions,
  ...args
}: Omit<React.ComponentProps<typeof LikertScaleField>, 'value' | 'onChange'> & {
  onChange?: (value: string | number) => void;
}) {
  const [value, setValue] = useState<string | number | undefined>(undefined);

  return (
    <div>
      <LikertScaleField
        {...args}
        options={options}
        value={value}
        onChange={(newValue) => {
          if (newValue !== undefined) {
            setValue(newValue);
            args.onChange?.(newValue);
          }
        }}
      />
      <Paragraph className="mt-8">
        Value:&nbsp;
        <span data-testid="likert-value">
          {value === undefined ? 'unset' : String(value)}
        </span>
      </Paragraph>
    </div>
  );
}

export const Unset: Story = {
  args: {
    options: agreementOptions,
    value: undefined,
  },
  render: (args) => <UnsetLikertWithValueDisplay {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const valueDisplay = canvas.getByTestId('likert-value');

    // Thumb should start in pristine state (unset)
    await expect(valueDisplay).toHaveTextContent('unset');
  },
};

export const ClickTrackSetsClickedValue: Story = {
  args: {
    options: agreementOptions,
    value: undefined,
  },
  render: (args) => <UnsetLikertWithValueDisplay {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const valueDisplay = canvas.getByTestId('likert-value');
    const thumb = canvas.getByRole('slider');

    await expect(valueDisplay).toHaveTextContent('unset');

    // Click on the slider control near the right end. With 5 options
    // (values 1–5), this should set value 5 — not the midpoint (3).
    // DOM: input[role=slider] > Thumb div > Track div > Control div
    const control = thumb.parentElement!.parentElement!.parentElement!;
    const rect = control.getBoundingClientRect();

    await fireEvent.pointerDown(control, {
      clientX: rect.right - 2,
      clientY: rect.top + rect.height / 2,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
    });
    await fireEvent.pointerUp(control, {
      clientX: rect.right - 2,
      clientY: rect.top + rect.height / 2,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
    });

    await expect(valueDisplay).toHaveTextContent('5');
  },
};

export const UnsetClickMidpoint: Story = {
  args: {
    options: agreementOptions,
    value: undefined,
  },
  render: (args) => <UnsetLikertWithValueDisplay {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');
    const valueDisplay = canvas.getByTestId('likert-value');

    await expect(valueDisplay).toHaveTextContent('unset');

    // Click on the thumb at the midpoint - should set value to 3
    const thumbRect = thumb.getBoundingClientRect();
    await fireEvent.pointerDown(thumb, {
      clientX: thumbRect.left + thumbRect.width / 2,
      clientY: thumbRect.top + thumbRect.height / 2,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
    });
    await fireEvent.pointerUp(thumb, {
      clientX: thumbRect.left + thumbRect.width / 2,
      clientY: thumbRect.top + thumbRect.height / 2,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
    });

    await expect(valueDisplay).toHaveTextContent('3');
  },
};

export const UnsetKeyboardEnter: Story = {
  args: {
    options: agreementOptions,
    value: undefined,
  },
  render: (args) => <UnsetLikertWithValueDisplay {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');
    const valueDisplay = canvas.getByTestId('likert-value');

    await expect(valueDisplay).toHaveTextContent('unset');

    // Tab to the slider thumb and press Enter to confirm midpoint
    await userEvent.tab();
    await expect(thumb.closest('[tabindex]')!).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(valueDisplay).toHaveTextContent('3');
  },
};

export const UnsetKeyboardSpace: Story = {
  args: {
    options: agreementOptions,
    value: undefined,
  },
  render: (args) => <UnsetLikertWithValueDisplay {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');
    const valueDisplay = canvas.getByTestId('likert-value');

    await expect(valueDisplay).toHaveTextContent('unset');

    // Tab to the slider thumb and press Space to confirm midpoint
    await userEvent.tab();
    await expect(thumb.closest('[tabindex]')!).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(valueDisplay).toHaveTextContent('3');
  },
};

export const UnsetKeyboardArrow: Story = {
  args: {
    options: agreementOptions,
    value: undefined,
  },
  render: (args) => <UnsetLikertWithValueDisplay {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');
    const valueDisplay = canvas.getByTestId('likert-value');

    await expect(valueDisplay).toHaveTextContent('unset');

    // Focus the slider input directly and press ArrowRight to move and set value
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(valueDisplay).toHaveTextContent('4');
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <Paragraph
          margin="none"
          className="mb-2 text-xs font-medium text-current/50"
        >
          Unset
        </Paragraph>
        <LikertScaleField options={agreementOptions} value={undefined} />
      </div>
      <div>
        <Paragraph
          margin="none"
          className="mb-2 text-xs font-medium text-current/50"
        >
          Normal
        </Paragraph>
        <LikertScaleField options={agreementOptions} value={3} />
      </div>
      <div>
        <Paragraph
          margin="none"
          className="mb-2 text-xs font-medium text-current/50"
        >
          Disabled
        </Paragraph>
        <LikertScaleField options={agreementOptions} value={3} disabled />
      </div>
      <div>
        <Paragraph
          margin="none"
          className="mb-2 text-xs font-medium text-current/50"
        >
          Read Only
        </Paragraph>
        <LikertScaleField options={agreementOptions} value={4} readOnly />
      </div>
      <div>
        <Paragraph
          margin="none"
          className="mb-2 text-xs font-medium text-current/50"
        >
          Invalid
        </Paragraph>
        <LikertScaleField
          options={agreementOptions}
          value={3}
          aria-invalid={true}
        />
      </div>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Fragment } from 'react';
import {
  Check,
  ChevronRight,
  Download,
  Plus,
  Settings,
  Trash,
  Upload,
  X,
} from 'lucide-react';
import { Button, ButtonSkeleton, MotionButton } from './Button';
import { BUTTON_COLORS } from './button-constants';

const iconMap = {
  none: undefined,
  check: <Check className="h-4 w-4" />,
  plus: <Plus className="h-4 w-4" />,
  x: <X className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
  upload: <Upload className="h-4 w-4" />,
  trash: <Trash className="h-4 w-4" />,
  chevronRight: <ChevronRight className="h-4 w-4" />,
};

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'text', 'textMuted', 'dashed'],
    },
    color: {
      control: 'select',
      options: BUTTON_COLORS,
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: {
      control: 'boolean',
    },
    asChild: {
      control: 'boolean',
    },
    icon: {
      control: 'select',
      options: Object.keys(iconMap),
      mapping: iconMap,
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    color: 'default',
    size: 'md',
    disabled: false,
    icon: 'none',
    iconPosition: 'left',
  },
};

export const Variants: Story = {
  args: {
    children: 'Button',
    color: 'default',
    size: 'md',
    disabled: false,
    icon: 'none',
    iconPosition: 'left',
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button {...args} variant="default">
          Default
        </Button>
        <Button {...args} variant="outline">
          Outline
        </Button>
        <Button {...args} variant="text">
          Text
        </Button>
        <Button {...args} variant="textMuted">
          Text Muted
        </Button>
        <Button {...args} variant="dashed">
          Dashed
        </Button>
      </div>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Button color="default">Default</Button>
        <Button color="dynamic">Dynamic</Button>
        <Button color="primary">Primary</Button>
        <Button color="secondary">Secondary</Button>
        <Button color="warning">Warning</Button>
        <Button color="info">Info</Button>
        <Button color="destructive">Destructive</Button>
        <Button color="success">Success</Button>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

export const Icons: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {/* Icon Position */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold">Icon Position</h3>
        <div className="flex flex-col gap-2">
          <span className="text-text/70 text-xs">Left (default)</span>
          <div className="flex gap-2">
            <Button icon={<Download />} iconPosition="left">
              Download
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-text/70 text-xs">Right</span>
          <div className="flex gap-2">
            <Button icon={<ChevronRight />} iconPosition="right">
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold">Sizes</h3>
        <div className="flex items-end gap-2">
          <Button icon={<Download />} size="xs">
            XS
          </Button>
          <Button icon={<Download />} size="sm">
            SM
          </Button>
          <Button icon={<Download />} size="md">
            MD
          </Button>
          <Button icon={<Download />} size="lg">
            LG
          </Button>
          <Button icon={<Download />} size="xl">
            XL
          </Button>
        </div>
      </div>

      {/* Variants */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold">Variants</h3>
        <div className="flex gap-2">
          <Button icon={<Check />} variant="default">
            Default
          </Button>
          <Button icon={<Check />} variant="outline">
            Outline
          </Button>
          <Button icon={<Check />} variant="text">
            Text
          </Button>
          <Button icon={<Check />} variant="textMuted">
            Text Muted
          </Button>
          <Button icon={<Check />} variant="dashed">
            Dashed
          </Button>
        </div>
      </div>

      {/* Colors */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold">Colors</h3>
        <div className="flex flex-wrap gap-2">
          <Button icon={<Plus />} color="default">
            Default
          </Button>
          <Button icon={<Plus />} color="dynamic">
            Dynamic
          </Button>
          <Button icon={<Plus />} color="primary">
            Primary
          </Button>
          <Button icon={<Plus />} color="secondary">
            Secondary
          </Button>
          <Button icon={<Plus />} color="success">
            Success
          </Button>
          <Button icon={<Plus />} color="warning">
            Warning
          </Button>
          <Button icon={<Plus />} color="info">
            Info
          </Button>
          <Button icon={<Trash />} color="destructive">
            Destructive
          </Button>
        </div>
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button>Normal</Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  ),
};

export const DisabledStates: Story = {
  render: () => (
    <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-4">
      <span className="text-sm font-medium"></span>
      <span className="text-center text-xs font-medium text-current/70">
        Default
      </span>
      <span className="text-center text-xs font-medium text-current/70">
        Outline
      </span>
      <span className="text-center text-xs font-medium text-current/70">
        Text
      </span>
      <span className="text-center text-xs font-medium text-current/70">
        Text Muted
      </span>
      <span className="text-center text-xs font-medium text-current/70">
        Dashed
      </span>
      {BUTTON_COLORS.map((color) => (
        <Fragment key={color}>
          <span className="text-sm font-medium capitalize">{color}:</span>
          <Button variant="default" color={color} disabled>
            Default
          </Button>
          <Button variant="outline" color={color} disabled>
            Outline
          </Button>
          <Button variant="text" color={color} disabled>
            Text
          </Button>
          <Button variant="textMuted" color={color} disabled>
            Text Muted
          </Button>
          <Button variant="dashed" color={color} disabled>
            Dashed
          </Button>
        </Fragment>
      ))}
    </div>
  ),
};

export const LoadingSkeleton: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <ButtonSkeleton />
        <ButtonSkeleton variant="outline" />
        <ButtonSkeleton size="lg" />
      </div>
    </div>
  ),
};

export const MotionVariant: Story = {
  render: () => (
    <div className="flex gap-4">
      <MotionButton
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        color="primary"
      >
        Animated Button
      </MotionButton>
      <MotionButton
        variant="outline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Fade In Button
      </MotionButton>
    </div>
  ),
};

export const ColorVariantCombinations: Story = {
  render: () => (
    <div className="grid grid-cols-[auto_repeat(6,1fr)] gap-4">
      <span className="text-sm font-medium"></span>
      <span className="text-center text-xs font-medium text-current/70">
        Default
      </span>
      <span className="text-center text-xs font-medium text-current/70">
        Outline
      </span>
      <span className="text-center text-xs font-medium text-current/70">
        Text
      </span>
      <span className="text-center text-xs font-medium text-current/70">
        Text Muted
      </span>
      <span className="text-center text-xs font-medium text-current/70">
        Dashed
      </span>
      <span className="text-center text-xs font-medium text-current/70">
        Disabled
      </span>
      {BUTTON_COLORS.map((color) => (
        <Fragment key={color}>
          <span className="text-sm font-medium capitalize">{color}:</span>
          <Button variant="default" color={color}>
            Default
          </Button>
          <Button variant="outline" color={color}>
            Outline
          </Button>
          <Button variant="text" color={color}>
            Text
          </Button>
          <Button variant="textMuted" color={color}>
            Text Muted
          </Button>
          <Button variant="dashed" color={color}>
            Dashed
          </Button>
          <Button variant="default" color={color} disabled>
            Disabled
          </Button>
        </Fragment>
      ))}
    </div>
  ),
};

export const AdaptiveToContext: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          Dynamic variant adapts to container colors
        </h3>
        <p className="text-text/70 mb-6 text-sm">
          The dynamic button variant uses CSS custom properties to adapt to the
          text and background colors of its container. Hover to see the lighter
          shade effect.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-background text-text publish-colors flex items-center gap-4 rounded-lg border p-6">
          <span className="w-40 text-sm font-medium">Background:</span>
          <Button variant="default" color="dynamic">
            Default
          </Button>
          <Button variant="dashed" color="dynamic">
            Dashed
          </Button>
          <Button variant="outline" color="dynamic">
            Outline
          </Button>
          <Button variant="text" color="dynamic">
            Text
          </Button>
          <Button variant="textMuted" color="dynamic">
            Text Muted
          </Button>
        </div>

        <div className="bg-primary text-primary-contrast publish-colors flex items-center gap-4 rounded-lg border p-6">
          <span className="w-40 text-sm font-medium">Primary:</span>
          <Button variant="default" color="dynamic">
            Default
          </Button>
          <Button variant="dashed" color="dynamic">
            Dashed
          </Button>
          <Button variant="outline" color="dynamic">
            Outline
          </Button>
          <Button variant="text" color="dynamic">
            Text
          </Button>
          <Button variant="textMuted" color="dynamic">
            Text Muted
          </Button>
        </div>

        <div className="bg-secondary text-secondary-contrast publish-colors flex items-center gap-4 rounded-lg border p-6">
          <span className="w-40 text-sm font-medium">Secondary:</span>
          <Button variant="default" color="dynamic">
            Default
          </Button>
          <Button variant="dashed" color="dynamic">
            Dashed
          </Button>
          <Button variant="outline" color="dynamic">
            Outline
          </Button>
          <Button variant="text" color="dynamic">
            Text
          </Button>
          <Button variant="textMuted" color="dynamic">
            Text Muted
          </Button>
        </div>

        <div className="bg-surface-1 text-surface-1-contrast publish-colors flex items-center gap-4 rounded-lg border p-6">
          <span className="w-40 text-sm font-medium">Surface 1:</span>
          <Button variant="default" color="dynamic">
            Default
          </Button>
          <Button variant="dashed" color="dynamic">
            Dashed
          </Button>
          <Button variant="outline" color="dynamic">
            Outline
          </Button>
          <Button variant="text" color="dynamic">
            Text
          </Button>
          <Button variant="textMuted" color="dynamic">
            Text Muted
          </Button>
        </div>

        <div className="bg-surface-2 text-surface-2-contrast publish-colors flex items-center gap-4 rounded-lg border p-6">
          <span className="w-40 text-sm font-medium">Surface 2:</span>
          <Button variant="default" color="dynamic">
            Default
          </Button>
          <Button variant="dashed" color="dynamic">
            Dashed
          </Button>
          <Button variant="outline" color="dynamic">
            Outline
          </Button>
          <Button variant="text" color="dynamic">
            Text
          </Button>
          <Button variant="textMuted" color="dynamic">
            Text Muted
          </Button>
        </div>

        <div className="bg-destructive text-destructive-contrast publish-colors flex items-center gap-4 rounded-lg border p-6">
          <span className="w-40 text-sm font-medium">Destructive:</span>
          <Button variant="default" color="dynamic">
            Default
          </Button>
          <Button variant="dashed" color="dynamic">
            Dashed
          </Button>
          <Button variant="outline" color="dynamic">
            Outline
          </Button>
          <Button variant="text" color="dynamic">
            Text
          </Button>
          <Button variant="textMuted" color="dynamic">
            Text Muted
          </Button>
        </div>

        <div className="bg-success text-success-contrast publish-colors flex items-center gap-4 rounded-lg border p-6">
          <span className="w-40 text-sm font-medium">Success:</span>
          <Button variant="default" color="dynamic">
            Default
          </Button>
          <Button variant="dashed" color="dynamic">
            Dashed
          </Button>
          <Button variant="outline" color="dynamic">
            Outline
          </Button>
          <Button variant="text" color="dynamic">
            Text
          </Button>
          <Button variant="textMuted" color="dynamic">
            Text Muted
          </Button>
        </div>
      </div>
    </div>
  ),
};

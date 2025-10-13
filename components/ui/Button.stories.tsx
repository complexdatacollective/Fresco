import type { Meta, StoryObj } from '@storybook/nextjs-vite';
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
      options: ['default', 'outline', 'text', 'link'],
    },
    color: {
      control: 'select',
      options: [
        'default',
        'primary',
        'secondary',
        'warning',
        'info',
        'destructive',
        'accent',
        'success',
      ],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'icon'],
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
    size: 'default',
    disabled: false,
    icon: 'none',
    iconPosition: 'left',
  },
};

export const Variants: Story = {
  args: {
    children: 'Button',
    color: 'default',
    size: 'default',
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
        <Button {...args} variant="link">
          Link
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
        <Button color="primary">Primary</Button>
        <Button color="secondary">Secondary</Button>
        <Button color="warning">Warning</Button>
        <Button color="info">Info</Button>
        <Button color="destructive">Destructive</Button>
        <Button color="accent">Accent</Button>
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
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" icon={<Plus className="h-4 w-4" />} />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button icon={<Check className="h-4 w-4" />}>Save</Button>
        <Button variant="outline" icon={<X className="h-4 w-4" />}>
          Cancel
        </Button>
        <Button color="primary" icon={<Plus className="h-4 w-4" />}>
          Add Item
        </Button>
      </div>
      <div className="flex gap-4">
        <Button
          size="icon"
          variant="outline"
          icon={<Settings className="h-4 w-4" />}
        />
        <Button
          size="icon"
          color="success"
          icon={<Check className="h-4 w-4" />}
        />
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
    <div className="flex flex-col gap-6">
      <div className="mb-2 flex items-center gap-4">
        <span className="w-24 text-sm font-medium"></span>
        <span className="text-muted-foreground w-24 text-center text-xs font-medium">
          Default
        </span>
        <span className="text-muted-foreground w-24 text-center text-xs font-medium">
          Outline
        </span>
        <span className="text-muted-foreground w-24 text-center text-xs font-medium">
          Text
        </span>
        <span className="text-muted-foreground w-24 text-center text-xs font-medium">
          Link
        </span>
        <span className="text-muted-foreground w-24 text-center text-xs font-medium">
          Disabled
        </span>
      </div>
      {(
        [
          'default',
          'primary',
          'secondary',
          'warning',
          'info',
          'accent',
          'success',
        ] as const
      ).map((color) => (
        <div key={color} className="flex items-center gap-4">
          <span className="w-24 text-sm font-medium capitalize">{color}:</span>
          <Button variant="default" color={color} className="w-24">
            Default
          </Button>
          <Button variant="outline" color={color} className="w-24">
            Outline
          </Button>
          <Button variant="text" color={color} className="w-24">
            Text
          </Button>
          <Button variant="link" color={color} className="w-24">
            Link
          </Button>
          <Button variant="default" color={color} disabled className="w-24">
            Disabled
          </Button>
        </div>
      ))}
    </div>
  ),
};

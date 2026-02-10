import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Fragment } from 'react';
import {
  Check,
  ChevronRight,
  Download,
  Edit,
  Heart,
  Info,
  Mail,
  Plus,
  Search,
  Settings,
  Share,
  Star,
  Trash,
  Upload,
  X,
} from 'lucide-react';
import { IconButton } from './Button';
import { BUTTON_VARIANTS, ICON_BUTTON_COLORS } from './button-constants';

const iconMap = {
  plus: <Plus />,
  x: <X />,
  check: <Check />,
  settings: <Settings />,
  download: <Download />,
  upload: <Upload />,
  trash: <Trash />,
  edit: <Edit />,
  search: <Search />,
  heart: <Heart />,
  star: <Star />,
  share: <Share />,
  mail: <Mail />,
  info: <Info />,
  chevronRight: <ChevronRight />,
};

const meta = {
  title: 'UI/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'text', 'link', 'dashed', 'icon'],
    },
    color: {
      control: 'select',
      options: ICON_BUTTON_COLORS,
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: {
      control: 'boolean',
    },
    icon: {
      control: 'select',
      options: Object.keys(iconMap),
      mapping: iconMap,
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: {
    'icon': <Plus />,
    'aria-label': 'Add',
    'variant': 'default',
    'color': 'default',
    'size': 'md',
    'disabled': false,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <IconButton
          variant="default"
          icon={<Plus />}
          aria-label="Add (Default)"
        />
        <IconButton
          variant="outline"
          icon={<Plus />}
          aria-label="Add (Outline)"
        />
        <IconButton variant="text" icon={<Plus />} aria-label="Add (Text)" />
        <IconButton variant="text" icon={<Plus />} aria-label="Add (Text)" />
        <IconButton
          variant="dashed"
          icon={<Plus />}
          aria-label="Add (Dashed)"
        />
      </div>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <IconButton color="default" icon={<Plus />} aria-label="Add Default" />
        <IconButton color="primary" icon={<Plus />} aria-label="Add Primary" />
        <IconButton
          color="secondary"
          icon={<Plus />}
          aria-label="Add Secondary"
        />
        <IconButton color="warning" icon={<Plus />} aria-label="Add Warning" />
        <IconButton color="info" icon={<Plus />} aria-label="Add Info" />
        <IconButton color="destructive" icon={<Trash />} aria-label="Delete" />
        <IconButton color="success" icon={<Check />} aria-label="Confirm" />
        <IconButton color="accent" icon={<Star />} aria-label="Favorite" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton size="sm" icon={<Plus />} aria-label="Add (Small)" />
      <IconButton size="md" icon={<Plus />} aria-label="Add (Medium)" />
      <IconButton size="lg" icon={<Plus />} aria-label="Add (Large)" />
      <IconButton size="xl" icon={<Plus />} aria-label="Add (Extra Large)" />
    </div>
  ),
};

export const DifferentIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <IconButton icon={<Plus />} aria-label="Add" />
        <IconButton icon={<Edit />} aria-label="Edit" color="primary" />
        <IconButton
          icon={<Trash />}
          aria-label="Delete"
          color="destructive"
          variant="outline"
        />
        <IconButton icon={<Search />} aria-label="Search" variant="text" />
        <IconButton icon={<Settings />} aria-label="Settings" />
      </div>
      <div className="flex gap-4">
        <IconButton icon={<Download />} aria-label="Download" color="info" />
        <IconButton icon={<Upload />} aria-label="Upload" color="success" />
        <IconButton icon={<Share />} aria-label="Share" variant="outline" />
        <IconButton icon={<Heart />} aria-label="Like" color="destructive" />
        <IconButton icon={<Star />} aria-label="Favorite" color="warning" />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <IconButton icon={<Plus />} aria-label="Normal" />
        <IconButton icon={<Plus />} aria-label="Disabled" disabled />
      </div>
      <div className="flex gap-4">
        <IconButton
          icon={<Plus />}
          aria-label="Normal Outline"
          variant="outline"
        />
        <IconButton
          icon={<Plus />}
          aria-label="Disabled Outline"
          variant="outline"
          disabled
        />
      </div>
    </div>
  ),
};

export const ColorVariantCombinations: Story = {
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
        Dashed
      </span>
      <span className="text-center text-xs font-medium text-current/70">
        Disabled
      </span>
      {ICON_BUTTON_COLORS.map((color) => (
        <Fragment key={color}>
          <span className="text-sm font-medium capitalize">{color}:</span>
          <IconButton
            variant="default"
            color={color}
            icon={<Plus />}
            aria-label={`${color} default`}
          />
          <IconButton
            variant="outline"
            color={color}
            icon={<Plus />}
            aria-label={`${color} outline`}
          />
          <IconButton
            variant="text"
            color={color}
            icon={<Plus />}
            aria-label={`${color} text`}
          />
          <IconButton
            variant="dashed"
            color={color}
            icon={<Plus />}
            aria-label={`${color} dashed`}
          />
          <IconButton
            variant="default"
            color={color}
            icon={<Plus />}
            aria-label={`${color} disabled`}
            disabled
          />
        </Fragment>
      ))}
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {BUTTON_VARIANTS.filter((v) => v !== 'dashed').map((variant) => (
        <div key={variant} className="flex flex-col gap-4">
          <span className="text-sm font-medium capitalize">{variant}:</span>
          <div className="flex items-end gap-4">
            <IconButton
              variant={variant}
              size="sm"
              icon={<Plus />}
              aria-label={`${variant} sm`}
            />
            <IconButton
              variant={variant}
              size="md"
              icon={<Plus />}
              aria-label={`${variant} md`}
            />
            <IconButton
              variant={variant}
              size="lg"
              icon={<Plus />}
              aria-label={`${variant} lg`}
            />
            <IconButton
              variant={variant}
              size="xl"
              icon={<Plus />}
              aria-label={`${variant} xl`}
            />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const UseCases: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-sm font-semibold">Action Buttons</h3>
        <div className="flex gap-2">
          <IconButton icon={<Edit />} aria-label="Edit" size="sm" />
          <IconButton
            icon={<Trash />}
            aria-label="Delete"
            color="destructive"
            variant="outline"
            size="sm"
          />
          <IconButton
            icon={<Check />}
            aria-label="Confirm"
            color="success"
            size="sm"
          />
          <IconButton
            icon={<X />}
            aria-label="Cancel"
            variant="text"
            size="sm"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold">Toolbar</h3>
        <div className="flex gap-1 rounded-lg border p-2">
          <IconButton icon={<Edit />} aria-label="Edit" variant="text" />
          <IconButton
            icon={<Download />}
            aria-label="Download"
            variant="text"
          />
          <IconButton icon={<Upload />} aria-label="Upload" variant="text" />
          <IconButton icon={<Share />} aria-label="Share" variant="text" />
          <IconButton
            icon={<Settings />}
            aria-label="Settings"
            variant="text"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold">Floating Action Button</h3>
        <IconButton
          icon={<Plus />}
          aria-label="Add"
          color="primary"
          size="lg"
        />
      </div>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Icon from './Icon';
import customIcons from '~/lib/ui/components/icons';

const meta = {
  title: 'UI/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
    },
    size: {
      control: 'number',
    },
    color: {
      control: 'color',
    },
    strokeWidth: {
      control: 'number',
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Star',
  },
};

export const CustomIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      {Object.keys(customIcons).map((iconName) => (
        <div key={iconName} className="flex flex-col items-center gap-2">
          <Icon name={iconName} />
          <span className="text-xs text-gray-600">{iconName}</span>
        </div>
      ))}
    </div>
  ),
};

export const LucideIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      {[
        'Home',
        'User',
        'Settings',
        'Search',
        'Star',
        'Heart',
        'Mail',
        'Phone',
        'Calendar',
        'Camera',
        'Download',
        'Upload',
        'Edit',
        'Trash',
        'Check',
        'X',
        'Plus',
        'Minus',
      ].map((iconName) => (
        <div key={iconName} className="flex flex-col items-center gap-2">
          <Icon name={iconName} />
          <span className="text-xs text-gray-600">{iconName}</span>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Icon name="Star" size={16} />
      <Icon name="Star" size={24} />
      <Icon name="Star" size={32} />
      <Icon name="Star" size={48} />
      <Icon name="Star" size={64} />
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon name="Heart" color="red" size={32} />
      <Icon name="Heart" color="blue" size={32} />
      <Icon name="Heart" color="green" size={32} />
      <Icon name="Heart" color="purple" size={32} />
      <Icon name="Heart" color="orange" size={32} />
    </div>
  ),
};

export const StrokeWidth: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Icon name="Circle" size={32} strokeWidth={0.5} />
      <Icon name="Circle" size={32} strokeWidth={1} />
      <Icon name="Circle" size={32} strokeWidth={1.5} />
      <Icon name="Circle" size={32} strokeWidth={2} />
      <Icon name="Circle" size={32} strokeWidth={3} />
    </div>
  ),
};

export const InvalidIcon: Story = {
  args: {
    name: 'NonExistentIcon',
  },
};

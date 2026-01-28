import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { icons } from 'lucide-react';
import ActionButton from '~/components/interview/ActionButton';

const meta: Meta<typeof ActionButton> = {
  title: 'Interview/ActionButton',
  component: ActionButton,
  parameters: {
    forceTheme: 'interview',
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    iconName: {
      control: 'select',
      options: Object.keys(icons),
      description: 'The icon to display in the button',
      table: {
        type: { summary: 'InterviewerIconName' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
  args: {
    iconName: 'UserRound',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    iconName: 'UserRound',
  },
};

export const Disabled: Story = {
  args: {
    iconName: 'UserRound',
    disabled: true,
  },
};

export const DifferentIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      <div className="flex flex-col items-center gap-2">
        <ActionButton iconName="UserRound" />
        <span className="text-sm">UserRound</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ActionButton iconName="Users" />
        <span className="text-sm">Users</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ActionButton iconName="House" />
        <span className="text-sm">House</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ActionButton iconName="Building" />
        <span className="text-sm">Building</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ActionButton iconName="Heart" />
        <span className="text-sm">Heart</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ActionButton iconName="Star" />
        <span className="text-sm">Star</span>
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">
        Hover over the button to see the animation
      </h3>
      <ActionButton
        iconName="UserRound"
        onClick={() => alert('Button clicked!')}
      />
    </div>
  ),
};

export const DisabledStates: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="flex flex-col items-center gap-2">
        <ActionButton iconName="UserRound" disabled={false} />
        <span className="text-sm">Enabled</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ActionButton iconName="UserRound" disabled={true} />
        <span className="text-sm">Disabled</span>
      </div>
    </div>
  ),
};

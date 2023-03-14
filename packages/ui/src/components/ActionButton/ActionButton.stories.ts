import type { Meta, StoryObj } from '@storybook/react';
import ActionButton from './ActionButton';
import type { ActionButtonProps } from './ActionButton';
import colors from '@/components/StorybookHelpers/Colors';

const iconOptions = [
  'add-a-person',
  'add-a-place',
  'add-a-relationship',
  'add-a-context',
  'add-a-protocol',
];

const meta: Meta<ActionButtonProps> = {
  title: 'Components/ActionButton',
  component: ActionButton,
  argTypes: {
    disabled: {
      control: {
        type: 'boolean',
      },
    },
    icon: {
      control: {
        type: 'select',
      },
      options: iconOptions,
    },
    color: {
      control: {
        type: 'select',
      },
      options: colors,
    },
    title: {
      control: {
        type: 'text',
      },
    },
    onClick: { action: 'onClick' }
  },
};

export default meta;
type Story = StoryObj<typeof ActionButton>;

export const Basic: Story = {
  args: {
    disabled: false,
    title: 'Add a person',
    icon: 'add-a-person',
    color: 'sea-green',
  },
};

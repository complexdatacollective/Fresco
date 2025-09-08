import { type Meta, type StoryFn } from '@storybook/react';
import ActionButton from '~/components/interview/ActionButton';
import {
  type NodeColor,
  NodeColors,
  type NodeIcon,
  NodeIcons,
} from '~/schemas/protocol/entities';

export default {
  title: 'Interview/ActionButton',
  component: ActionButton,
  parameters: {
    forceTheme: 'interview',
    layout: 'centered',
  },
  argTypes: {
    iconName: {
      control: {
        type: 'select',
      },
      options: NodeIcons,
    },
    color: {
      control: {
        type: 'select',
      },
      options: NodeColors,
    },
    onClick: { action: 'clicked' }, // Action logger for click events
  },
  decorators: [
    (Story) => (
      <div className="bg-primary-background flex h-screen w-screen items-center justify-center">
        <Story />
      </div>
    ),
  ],
} as Meta;

const Template: StoryFn<{
  iconName: NodeIcon;
  color: NodeColor;
  onClick: () => void;
}> = (args) => <ActionButton {...args} />;

export const Default = Template.bind({});
Default.args = {
  iconName: 'user-round',
  color: 'node-1',
};

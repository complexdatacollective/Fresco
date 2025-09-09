import { type Meta, type StoryFn } from '@storybook/react';
import NodeIcons from 'lucide-react/dynamicIconImports';
import ActionButton, { NodeIcon } from '~/components/interview/ActionButton';
import { NodeColors, NodeColorSequence } from '~/lib/ui/components/Node';

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
      options: Object.keys(NodeIcons),
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
  color: NodeColorSequence;
  onClick: () => void;
}> = (args) => <ActionButton {...args} />;

export const Default = Template.bind({});
Default.args = {
  iconName: 'user-round',
  color: 'node-color-seq-1',
};

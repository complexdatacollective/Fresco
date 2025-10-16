import { type Meta, type StoryFn } from '@storybook/nextjs-vite';
import NodeIcons from 'lucide-react/dynamicIconImports';
import ActionButton, {
  type NodeIcon,
} from '~/components/interview/ActionButton';
import { type NodeColorSequence } from '~/lib/ui/components/Node';

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
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' }, // Action logger for click events
  },
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

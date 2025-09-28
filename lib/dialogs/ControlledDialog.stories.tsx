import { type Meta, type StoryObj } from '@storybook/nextjs-vite';
import Paragraph from '~/components/typography/Paragraph';
import { ControlledDialog } from './ControlledDialog';

const meta: Meta<typeof ControlledDialog> = {
  title: 'Systems/Dialogs/ControlledDialog',
  component: ControlledDialog,
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls whether the dialog is open or closed',
    },
    title: {
      control: 'text',
      description: 'Dialog title',
    },
    description: {
      control: 'text',
      description: 'Dialog description',
    },
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof ControlledDialog>;

export const Default: Story = {
  args: {
    open: false,
    title: 'Dialog Title',
    description: 'This is the description',
  },
  render: (args) => (
    <div>
      <Paragraph>
        Use the story controls to control the open state of the dialog.
      </Paragraph>
      <ControlledDialog {...args} />
    </div>
  ),
};

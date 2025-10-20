import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import Button from '~/components/ui/Button';
import { Dialog, type DialogProps } from './Dialog';

const meta: Meta<typeof Dialog> = {
  title: 'Systems/Dialogs/Dialog',
  component: Dialog,
  args: {
    closeDialog: fn(),
  },
  argTypes: {
    accent: {
      control: {
        type: 'select',
        options: ['default', 'danger', 'success', 'info'],
      },
    },
    title: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dialog>;

const DialogTemplate = (args: DialogProps) => (
  <Dialog
    {...args}
    open={true}
    footer={
      <>
        <Button onClick={args.closeDialog}>Cancel</Button>
        <Button color="primary" onClick={args.closeDialog}>
          Continue
        </Button>
      </>
    }
  >
    <p>This is the content inside the dialog.</p>
  </Dialog>
);

export const Default: Story = {
  args: {
    title: 'Default Dialog',
    description: 'This is a default dialog description',
  },
  render: (args) => <DialogTemplate {...args} />,
};

export const Success: Story = {
  args: {
    title: 'Success Dialog',
    description: 'This dialog indicates success.',
    accent: 'success',
  },
  render: (args) => <DialogTemplate {...args} />,
};

export const Danger: Story = {
  args: {
    title: 'Danger Dialog',
    description: 'This dialog indicates danger.',
    accent: 'danger',
  },
  render: (args) => <DialogTemplate {...args} />,
};

export const Info: Story = {
  args: {
    title: 'Info Dialog',
    description: 'This dialog provides some information.',
    accent: 'info',
  },
  render: (args) => <DialogTemplate {...args} />,
};

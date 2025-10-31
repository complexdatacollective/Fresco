/* eslint-disable no-console */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CheckCircle, Trash2 } from 'lucide-react';
import { DialogTrigger } from './DialogTrigger';

const meta: Meta<typeof DialogTrigger> = {
  title: 'Systems/Dialogs/DialogTrigger',
  component: DialogTrigger,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof DialogTrigger>;

export const AcknowledgeDialog: Story = {
  args: {
    dialog: {
      type: 'acknowledge',
      title: 'Success',
      description: 'Your changes have been saved successfully.',
      actions: { primary: { label: 'OK', value: true } },
    },
    onResult: (result) => {
      console.log('Dialog result:', result);
    },
    children: 'Show Acknowledge Dialog',
  },
};

export const ChoiceDialog: Story = {
  args: {
    dialog: {
      type: 'choice',
      title: 'Confirm Action',
      description: 'Are you sure you want to proceed with this action?',
      intent: 'default',
      actions: {
        primary: { label: 'Confirm', value: 'confirmed' },
        cancel: { label: 'Cancel', value: null },
      },
    },
    onResult: (result) => {
      console.log('Dialog result:', result);
    },
    children: 'Show Choice Dialog',
  },
};

export const DangerDialog: Story = {
  args: {
    dialog: {
      type: 'choice',
      title: 'Delete Item',
      description:
        'This action cannot be undone. Are you sure you want to delete this item?',
      intent: 'danger',
      actions: {
        primary: { label: 'Delete', value: true },
        cancel: { label: 'Cancel', value: false },
      },
    },
    onResult: (result) => {
      console.log('Delete confirmed:', result);
    },
    color: 'destructive',
    icon: <Trash2 />,
    children: 'Delete Item',
  },
};

export const SuccessDialog: Story = {
  args: {
    dialog: {
      type: 'acknowledge',
      title: 'Operation Successful',
      description: 'Your operation completed successfully!',
      intent: 'success',
      actions: { primary: { label: 'Great!', value: true } },
    },
    onResult: (result) => {
      console.log('Success acknowledged:', result);
    },
    color: 'primary',
    icon: <CheckCircle />,
    children: 'Complete Operation',
  },
};

export const InfoDialog: Story = {
  args: {
    dialog: {
      type: 'choice',
      title: 'Information',
      description: 'Here is some important information you should know about.',
      intent: 'info',
      actions: {
        primary: { label: 'I Understand', value: true },
        cancel: { label: 'Remind Me Later', value: false },
      },
    },
    onResult: (result) => {
      console.log('Info dialog result:', result);
    },
    children: 'Show Info',
  },
};

export const CustomDialog: Story = {
  args: {
    dialog: {
      type: 'custom',
      title: 'Custom Dialog Content',
      description: 'This dialog has custom content below.',
      children: (
        <div className="space-y-4 py-4">
          <p>This is custom content inside the dialog.</p>
          <p>You can put any React components here.</p>
        </div>
      ),
    },
    onResult: (result) => {
      console.log('Custom dialog result:', result);
    },
    children: 'Show Custom Dialog',
  },
};

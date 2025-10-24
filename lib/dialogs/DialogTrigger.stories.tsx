/* eslint-disable no-console */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
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

export const WithIcon: Story = {
  args: {
    dialog: {
      type: 'choice',
      title: 'Add New Item',
      description: 'Would you like to add a new item?',
      intent: 'default',
      actions: {
        primary: { label: 'Add', value: true },
        cancel: { label: 'Cancel', value: false },
      },
    },
    onResult: (result) => {
      console.log('Add item result:', result);
    },
    icon: <Plus />,
    iconPosition: 'left',
    children: 'Add Item',
  },
};

export const OutlineButton: Story = {
  args: {
    dialog: {
      type: 'choice',
      title: 'Confirm Deletion',
      description: 'Are you sure you want to delete this?',
      intent: 'danger',
      actions: {
        primary: { label: 'Delete', value: true },
        cancel: { label: 'Cancel', value: false },
      },
    },
    onResult: (result) => {
      console.log('Outline button result:', result);
    },
    variant: 'outline',
    color: 'destructive',
    children: 'Delete',
  },
};

export const SmallButton: Story = {
  args: {
    dialog: {
      type: 'acknowledge',
      title: 'Quick Info',
      description: 'This is a quick informational message.',
      actions: { primary: { label: 'OK', value: true } },
    },
    onResult: (result) => {
      console.log('Small button result:', result);
    },
    size: 'sm',
    children: 'Small Button',
  },
};

export const LargeButton: Story = {
  args: {
    dialog: {
      type: 'choice',
      title: 'Important Decision',
      description:
        'This is an important decision that requires your attention.',
      intent: 'danger',
      actions: {
        primary: { label: 'Proceed', value: true },
        cancel: { label: 'Go Back', value: false },
      },
    },
    onResult: (result) => {
      console.log('Large button result:', result);
    },
    size: 'lg',
    children: 'Large Button',
  },
};

export const AllVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-8">
      <h2 className="text-lg font-semibold">Dialog Trigger Variations</h2>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Intent Types</h3>
        <div className="flex flex-wrap gap-2">
          <DialogTrigger
            dialog={{
              type: 'acknowledge',
              title: 'Default',
              description: 'Default intent dialog',
              actions: { primary: { label: 'OK', value: true } },
            }}
            onResult={(result) => console.log('Default:', result)}
          >
            Default
          </DialogTrigger>

          <DialogTrigger
            dialog={{
              type: 'acknowledge',
              title: 'Success',
              description: 'Success intent dialog',
              intent: 'success',
              actions: { primary: { label: 'OK', value: true } },
            }}
            onResult={(result) => console.log('Success:', result)}
            color="primary"
          >
            Success
          </DialogTrigger>

          <DialogTrigger
            dialog={{
              type: 'acknowledge',
              title: 'Danger',
              description: 'Danger intent dialog',
              intent: 'danger',
              actions: { primary: { label: 'OK', value: true } },
            }}
            onResult={(result) => console.log('Danger:', result)}
            color="destructive"
          >
            Danger
          </DialogTrigger>

          <DialogTrigger
            dialog={{
              type: 'acknowledge',
              title: 'Info',
              description: 'Info intent dialog',
              intent: 'info',
              actions: { primary: { label: 'OK', value: true } },
            }}
            onResult={(result) => console.log('Info:', result)}
          >
            Info
          </DialogTrigger>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Button Variants</h3>
        <div className="flex flex-wrap gap-2">
          <DialogTrigger
            dialog={{
              type: 'acknowledge',
              title: 'Default Variant',
              description: 'Default button variant',
              actions: { primary: { label: 'OK', value: true } },
            }}
            variant="default"
          >
            Default
          </DialogTrigger>

          <DialogTrigger
            dialog={{
              type: 'acknowledge',
              title: 'Outline Variant',
              description: 'Outline button variant',
              actions: { primary: { label: 'OK', value: true } },
            }}
            variant="outline"
          >
            Outline
          </DialogTrigger>

          <DialogTrigger
            dialog={{
              type: 'acknowledge',
              title: 'Text Variant',
              description: 'Text button variant',
              actions: { primary: { label: 'OK', value: true } },
            }}
            variant="text"
          >
            Text
          </DialogTrigger>

          <DialogTrigger
            dialog={{
              type: 'acknowledge',
              title: 'Link Variant',
              description: 'Link button variant',
              actions: { primary: { label: 'OK', value: true } },
            }}
            variant="link"
          >
            Link
          </DialogTrigger>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Button Sizes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <DialogTrigger
            dialog={{
              type: 'acknowledge',
              title: 'Small Size',
              description: 'Small button size',
              actions: { primary: { label: 'OK', value: true } },
            }}
            size="sm"
          >
            Small
          </DialogTrigger>

          <DialogTrigger
            dialog={{
              type: 'acknowledge',
              title: 'Default Size',
              description: 'Default button size',
              actions: { primary: { label: 'OK', value: true } },
            }}
            size="default"
          >
            Default
          </DialogTrigger>

          <DialogTrigger
            dialog={{
              type: 'acknowledge',
              title: 'Large Size',
              description: 'Large button size',
              actions: { primary: { label: 'OK', value: true } },
            }}
            size="lg"
          >
            Large
          </DialogTrigger>
        </div>
      </div>
    </div>
  ),
};

/* eslint-disable no-console */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { fn } from 'storybook/test';
import Button from '~/components/ui/Button';
import useDialog from './useDialog';

// Component that opens a nested confirmation dialog
function NestedConfirmation({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { openDialog } = useDialog();

  const handleConfirmClick = async () => {
    const confirmed = await openDialog({
      type: 'choice',
      title: 'Final Confirmation',
      description: 'This action cannot be undone. Are you absolutely sure?',
      intent: 'destructive',
      actions: {
        primary: { label: 'Yes, delete permanently', value: true },
        cancel: { label: 'No, keep it', value: false },
      },
    });

    // Only close the outer dialog if user confirmed deletion
    // If they clicked "No, keep it", just close the nested dialog
    // and let them return to the first dialog
    if (confirmed === true) {
      onConfirm();
    }
    // Do nothing if cancelled - nested dialog closes, outer stays open
  };

  return (
    <div className="flex justify-end gap-2 pt-4">
      <Button onClick={onCancel}>Cancel</Button>
      <Button color="destructive" onClick={handleConfirmClick}>
        Delete
      </Button>
    </div>
  );
}

type ConfirmUtilityArgs = {
  onAction: (action: string) => void;
};

const meta = {
  title: 'Systems/Dialogs/useDialog',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  render: () => {
    const { openDialog, closeDialog } = useDialog();

    const acknowledgeDialog = async () => {
      // Return type is inferred as true | null
      const result = await openDialog({
        type: 'acknowledge',
        title: 'Acknowledge dialog',
        description:
          'This dialog only requires acknowledgment. Click OK to continue.',
        actions: { primary: { label: 'OK', value: true } },
      });

      console.log('acknowledge result:', result);
    };

    const choiceDialog = async () => {
      // Return type is inferred as 'yes' | 'no' | null
      const result = await openDialog({
        type: 'choice',
        title: 'Choice dialog',
        description: 'This dialog offers multiple choices.',
        intent: 'default',
        actions: {
          primary: { label: 'Yes', value: 'yes' as const },
          cancel: { label: 'No', value: 'no' as const },
        },
      });

      console.log('choice result:', result);
    };

    const nestedDialog = async () => {
      const dialogId = 'delete-item-dialog';

      // Open a custom dialog that contains the NestedConfirmation component
      // The nested dialog will open ON TOP of this one when Delete is clicked
      const result = await openDialog({
        id: dialogId,
        type: 'custom',
        title: 'Delete Item',
        description: 'Are you sure you want to delete this item?',
        intent: 'destructive',
        children: (
          <NestedConfirmation
            onConfirm={() => {
              console.log('Item deleted!');
              void closeDialog(dialogId, 'deleted');
            }}
            onCancel={() => {
              console.log('Deletion cancelled');
              void closeDialog(dialogId, 'cancelled');
            }}
          />
        ),
      });

      console.log('Outer dialog result:', result);
    };

    return (
      <div className="flex h-screen items-center justify-center gap-4 [background-image:linear-gradient(90deg,oklch(var(--surface-1))_20%,transparent_10%)] bg-size-[25px]">
        <Button onClick={acknowledgeDialog}>Acknowledge Dialog</Button>
        <Button onClick={choiceDialog}>Choice Dialog</Button>
        <Button onClick={nestedDialog} color="destructive">
          Nested Dialog (Delete)
        </Button>
      </div>
    );
  },
};

export const ConfirmUtility: StoryObj<Meta<ConfirmUtilityArgs>> = {
  args: {
    onAction: fn(),
  },
  render: (args) => {
    const { confirm } = useDialog();

    const handleDelete = () => {
      void confirm({
        confirmLabel: 'Delete',
        onConfirm: () => args.onAction('delete'),
      });
    };

    const handleReset = () => {
      void confirm({
        title: 'Reset Settings',
        description: 'This will reset all settings to their default values.',
        confirmLabel: 'Reset',
        cancelLabel: 'Keep Current',
        intent: 'default',
        onConfirm: () => args.onAction('reset'),
      });
    };

    return (
      <div className="flex h-screen items-center justify-center gap-4 [background-image:linear-gradient(90deg,oklch(var(--surface-1))_20%,transparent_10%)] bg-size-[25px]">
        <Button onClick={handleDelete} color="destructive">
          Delete Item
        </Button>
        <Button onClick={handleReset}>Reset Settings</Button>
      </div>
    );
  },
};

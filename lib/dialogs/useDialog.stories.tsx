/* eslint-disable no-console */
import type { StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import Button from '~/components/ui/Button';
import { useDialog } from './DialogProvider';

const meta = {
  title: 'Systems/Dialogs/useDialog',
  args: {
    closeDialog: fn(),
  },
  argTypes: {
    accent: {
      control: {
        type: 'select',
        options: ['default', 'danger', 'success', 'warning', 'info'],
      },
    },
    title: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
  },
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  render: () => {
    const { openDialog } = useDialog();

    const confirmDialog = async () => {
      // Return type should be boolean | null
      const result = await openDialog({
        type: 'confirm',
        title: 'Confirm dialog title',
        description:
          'confirm dialog description, which is read by screen readers',
        cancelText: 'Custom cancel text',
        confirmText: 'Custom confirm text',
      });

      console.log('got result', result);
    };

    const customDialog = async () => {
      // Return type should be inferred as string | null
      const result = await openDialog<string>({
        type: 'custom',
        title: 'Custom Dialog',
        description: 'This is a custom dialog',
        // 'resolve' should be inferred as (value: string | null) => void
        renderContent: (resolve) => {
          const handleConfirm = async () => {
            const confirmed = await openDialog({
              type: 'confirm',
              title: 'Are you really sure?',
              accent: 'danger',
              description: 'This action cannot be undone.',
            });

            if (confirmed) {
              resolve('confirmed');
            }
          };

          return (
            <>
              <Button onClick={handleConfirm} color="primary">
                Do a dangerous thing
              </Button>
              <Button onClick={() => resolve(null)}>Cancel</Button>
            </>
          );
        },
      });

      console.log('got result', result);
    };

    return (
      <div className="flex h-[100vh] items-center justify-center [background-image:linear-gradient(90deg,oklch(var(--surface-1))_20%,transparent_10%)] [background-size:25px]">
        <Button onClick={confirmDialog}>Confirm Dialog</Button>
        <Button onClick={customDialog}>Custom Dialog</Button>
      </div>
    );
  },
};

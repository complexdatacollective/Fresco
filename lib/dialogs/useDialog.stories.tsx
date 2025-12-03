/* eslint-disable no-console */
import type { StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import Button from '~/components/ui/Button';
import { STATE_VARIANTS } from './Dialog';
import useDialog from './useDialog';

const meta = {
  title: 'Systems/Dialogs/useDialog',
  args: {
    closeDialog: fn(),
  },
  argTypes: {
    accent: {
      control: {
        type: 'select',
        options: STATE_VARIANTS,
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
        type: 'acknowledge',
        title: 'Confirm dialog title',
        description:
          'confirm dialog description, which is read by screen readers',
        actions: { primary: { label: 'Continue', value: true } },
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
        actions: (resolve) => {
          const handleConfirm = async () => {
            const confirmed = await openDialog({
              type: 'choice',
              title: 'Are you really sure?',
              intent: 'danger',
              description: 'This action cannot be undone.',
              actions: {
                primary: { label: 'Yes, delete it', value: true },
                cancel: { label: 'No, cancel', value: false },
              },
            });

            if (confirmed) {
              resolve('confirmed');
            }
          };

          return {
            primary: {
              label: 'Do a dangerous thing',
              onClick: handleConfirm,
            },
            cancel: { label: 'Cancel', onClick: () => resolve(null) },
          };
        },
      });

      console.log('got result', result);
    };

    return (
      <div className="flex h-screen items-center justify-center [background-image:linear-gradient(90deg,oklch(var(--surface-1))_20%,transparent_10%)] bg-size-[25px]">
        <Button onClick={confirmDialog}>Confirm Dialog</Button>
        <Button onClick={customDialog}>Custom Dialog</Button>
      </div>
    );
  },
};

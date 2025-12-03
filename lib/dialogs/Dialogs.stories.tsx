/* eslint-disable no-console */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import Button from '~/components/ui/Button';
import { Dialog } from './Dialog';
import { DialogTrigger } from './DialogTrigger';
import useDialog from './useDialog';

/**
 * # Dialog System
 *
 * The Fresco dialog system provides a flexible, type-safe way to display modal dialogs.
 * It supports three dialog types and provides both declarative and imperative APIs.
 *
 * ## Architecture
 *
 * The system consists of four main components:
 *
 * | Component | Purpose |
 * |-----------|---------|
 * | `DialogProvider` | Context provider that manages dialog state and renders dialogs |
 * | `useDialog` | Hook providing `openDialog`, `closeDialog`, and `confirm` methods |
 * | `DialogTrigger` | Button component that opens dialogs declaratively |
 * | `Dialog` | Low-level dialog component for custom implementations |
 *
 * ## Dialog Types
 *
 * ### Acknowledge Dialog
 * Simple confirmation with a single action. Returns `true` when acknowledged, `null` if dismissed.
 *
 * ```tsx
 * const result = await openDialog({
 *   type: 'acknowledge',
 *   title: 'Success',
 *   description: 'Your changes have been saved.',
 *   actions: { primary: { label: 'OK', value: true } },
 * });
 * // result: true | null
 * ```
 *
 * ### Choice Dialog
 * Presents multiple options to the user. Supports primary, secondary (optional), and cancel actions.
 * Requires an `intent` to determine visual styling and focus behavior.
 *
 * ```tsx
 * const result = await openDialog({
 *   type: 'choice',
 *   title: 'Delete Item',
 *   description: 'This cannot be undone.',
 *   intent: 'destructive',
 *   actions: {
 *     primary: { label: 'Delete', value: 'delete' },
 *     secondary: { label: 'Archive', value: 'archive' }, // optional
 *     cancel: { label: 'Cancel', value: null },
 *   },
 * });
 * // result: 'delete' | 'archive' | null
 * ```
 *
 * ### Custom Dialog
 * For complex dialogs with custom content and actions. The dialog content is responsible
 * for calling `closeDialog` with an appropriate value.
 *
 * ```tsx
 * await openDialog({
 *   id: 'my-custom-dialog',
 *   type: 'custom',
 *   title: 'Custom Form',
 *   description: 'Fill in the details below.',
 *   children: <MyFormComponent onComplete={() => closeDialog('my-custom-dialog', formData)} />,
 * });
 * ```
 *
 * ## Intent / Accent
 *
 * Dialogs support four accent variants that affect button styling:
 *
 * - `default` - Standard dialog appearance
 * - `destructive` - Red accent for dangerous actions (auto-focuses cancel button)
 * - `success` - Green accent for positive confirmations
 * - `info` - Blue accent for informational dialogs
 *
 * ## Type Safety
 *
 * The dialog system uses TypeScript generics to infer return types from action values:
 *
 * ```tsx
 * // Type-safe return values
 * const result = await openDialog({
 *   type: 'choice',
 *   intent: 'default',
 *   actions: {
 *     primary: { label: 'Save', value: 'saved' as const },
 *     cancel: { label: 'Cancel', value: 'cancelled' as const },
 *   },
 * });
 * // result: 'saved' | 'cancelled' | null
 * ```
 *
 * ## Confirm Utility
 *
 * For simple confirmation patterns, use the `confirm` utility:
 *
 * ```tsx
 * const { confirm } = useDialog();
 *
 * await confirm({
 *   title: 'Delete Item?',
 *   description: 'This action cannot be undone.',
 *   confirmLabel: 'Delete',
 *   cancelLabel: 'Keep',
 *   intent: 'destructive',
 *   onConfirm: async () => {
 *     await deleteItem(id);
 *   },
 * });
 * ```
 */
const meta: Meta = {
  title: 'Systems/Dialogs',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      toc: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The three dialog types: Acknowledge (simple confirmation), Choice (multiple options),
 * and Custom (for complex content).
 */
export const DialogTypes: Story = {
  render: () => {
    const { openDialog, closeDialog } = useDialog();

    const showAcknowledge = async () => {
      const result = await openDialog({
        type: 'acknowledge',
        title: 'File Saved',
        description: 'Your document has been saved successfully.',
        actions: { primary: { label: 'OK', value: true } },
      });
      console.log('Acknowledge result:', result);
    };

    const showChoice = async () => {
      const result = await openDialog({
        type: 'choice',
        title: 'Unsaved Changes',
        description:
          'You have unsaved changes. What would you like to do with them?',
        intent: 'default',
        actions: {
          primary: { label: 'Save', value: 'save' as const },
          secondary: { label: 'Discard', value: 'discard' as const },
          cancel: { label: 'Cancel', value: null },
        },
      });
      console.log('Choice result:', result);
    };

    const showCustom = async () => {
      const result = await openDialog({
        id: 'custom-example',
        type: 'custom',
        title: 'Custom Dialog',
        description: 'This dialog has custom content and actions.',
        children: (
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-muted-foreground">
              Custom dialogs can contain any React content.
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => closeDialog('custom-example', false)}>
                Cancel
              </Button>
              <Button
                color="primary"
                onClick={() => closeDialog('custom-example', { custom: true })}
              >
                Submit
              </Button>
            </div>
          </div>
        ),
      });
      console.log('Custom result:', result);
    };

    return (
      <div className="flex h-screen items-center justify-center gap-4">
        <Button onClick={showAcknowledge}>Acknowledge</Button>
        <Button onClick={showChoice}>Choice</Button>
        <Button onClick={showCustom}>Custom</Button>
      </div>
    );
  },
};

/**
 * Dialogs support four intent variants that affect visual styling.
 * For destructive intents, the cancel button is auto-focused to prevent accidental actions.
 */
export const Intents: Story = {
  name: 'Intent Variants',
  render: () => {
    const { openDialog } = useDialog();

    const showDialog = async (
      intent: 'default' | 'destructive' | 'success' | 'info',
    ) => {
      const titles = {
        default: 'Confirm Action',
        destructive: 'Delete Item',
        success: 'Operation Complete',
        info: 'Important Information',
      };

      const descriptions = {
        default: 'Would you like to proceed with this action?',
        destructive:
          'This will permanently delete the item. This action cannot be undone.',
        success: 'Your operation completed successfully.',
        info: 'Please review the following information before continuing.',
      };

      const result = await openDialog({
        type: 'choice',
        title: titles[intent],
        description: descriptions[intent],
        intent,
        actions: {
          primary: { label: 'Confirm', value: true },
          cancel: { label: 'Cancel', value: false },
        },
      });
      console.log(`${intent} dialog result:`, result);
    };

    return (
      <div className="flex h-screen items-center justify-center gap-4">
        <Button onClick={() => showDialog('default')}>Default</Button>
        <Button color="destructive" onClick={() => showDialog('destructive')}>
          Destructive
        </Button>
        <Button onClick={() => showDialog('success')}>Success</Button>
        <Button onClick={() => showDialog('info')}>Info</Button>
      </div>
    );
  },
};

type DeclarativeAPIArgs = {
  onResult: (result: unknown) => void;
};

/**
 * The `DialogTrigger` component provides a declarative way to open dialogs.
 * It handles the dialog lifecycle and provides the result via `onResult` callback.
 */
export const DeclarativeAPI: StoryObj<Meta<DeclarativeAPIArgs>> = {
  name: 'Declarative API (DialogTrigger)',
  args: {
    onResult: fn(),
  },
  render: (args) => {
    return (
      <div className="flex h-screen items-center justify-center gap-4">
        <DialogTrigger
          dialog={{
            type: 'acknowledge',
            title: 'Welcome',
            description:
              'Thanks for using the declarative API! Click OK to continue.',
            actions: { primary: { label: 'OK', value: true } },
          }}
          onResult={(result) => {
            console.log('Trigger result:', result);
            args.onResult(result);
          }}
        >
          Show Welcome Dialog
        </DialogTrigger>

        <DialogTrigger
          color="destructive"
          dialog={{
            type: 'choice',
            title: 'Delete All',
            description: 'Are you sure you want to delete all items?',
            intent: 'destructive',
            actions: {
              primary: { label: 'Delete All', value: true },
              cancel: { label: 'Cancel', value: false },
            },
          }}
          onResult={(result) => {
            console.log('Delete result:', result);
            args.onResult(result);
          }}
        >
          Delete All Items
        </DialogTrigger>
      </div>
    );
  },
};

/**
 * Dialogs can be nested. The inner dialog opens on top of the outer one.
 * This is useful for confirmation flows within forms.
 */
export const NestedDialogs: Story = {
  render: () => {
    const { openDialog, closeDialog } = useDialog();

    const handleStart = async () => {
      const dialogId = 'outer-dialog';

      const result = await openDialog({
        id: dialogId,
        type: 'custom',
        title: 'Edit Settings',
        description:
          'Make changes to your settings below. Click Save to confirm.',
        intent: 'default',
        children: (
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-muted-foreground">
              Pretend there is a form here...
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => closeDialog(dialogId, null)}>
                Cancel
              </Button>
              <Button
                color="primary"
                onClick={async () => {
                  const confirmed = await openDialog({
                    type: 'choice',
                    title: 'Save Changes?',
                    description:
                      'Are you sure you want to save these changes? This will overwrite your current settings.',
                    intent: 'default',
                    actions: {
                      primary: { label: 'Save', value: true },
                      cancel: { label: 'Back', value: false },
                    },
                  });

                  if (confirmed === true) {
                    void closeDialog(dialogId, 'saved');
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        ),
      });

      console.log('Final result:', result);
    };

    return (
      <div className="flex h-screen items-center justify-center">
        <Button onClick={handleStart}>Edit Settings</Button>
      </div>
    );
  },
};

type ConfirmUtilityArgs = {
  onConfirm: () => void;
};

/**
 * The `confirm` utility provides a simple way to show confirmation dialogs.
 * It handles the dialog lifecycle and executes the `onConfirm` callback only if confirmed.
 */
export const ConfirmUtility: StoryObj<Meta<ConfirmUtilityArgs>> = {
  args: {
    onConfirm: fn(),
  },
  render: (args) => {
    const { confirm } = useDialog();

    const handleDelete = () => {
      void confirm({
        title: 'Delete Project',
        description:
          'This will permanently delete the project and all associated data.',
        confirmLabel: 'Delete Project',
        cancelLabel: 'Keep Project',
        intent: 'destructive',
        onConfirm: () => {
          console.log('Project deleted');
          args.onConfirm();
        },
      });
    };

    const handleReset = () => {
      void confirm({
        title: 'Reset to Defaults',
        description: 'This will reset all settings to their default values.',
        confirmLabel: 'Reset',
        cancelLabel: 'Cancel',
        intent: 'default',
        onConfirm: () => {
          console.log('Settings reset');
          args.onConfirm();
        },
      });
    };

    return (
      <div className="flex h-screen items-center justify-center gap-4">
        <Button onClick={handleReset}>Reset Settings</Button>
        <Button color="destructive" onClick={handleDelete}>
          Delete Project
        </Button>
      </div>
    );
  },
};

type LowLevelDialogArgs = {
  title: string;
  description: string;
  accent: 'default' | 'destructive' | 'success' | 'info';
};

/**
 * The low-level `Dialog` component can be used directly when you need full control
 * over the dialog's open state and rendering. This is useful when you need to
 * manage dialog state outside of the `DialogProvider` system.
 */
export const LowLevelDialog: StoryObj<Meta<LowLevelDialogArgs>> = {
  name: 'Low-Level Dialog Component',
  args: {
    title: 'Direct Dialog Usage',
    description: 'This dialog is rendered directly without the DialogProvider.',
    accent: 'default',
  },
  argTypes: {
    accent: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'info'],
    },
    title: { control: 'text' },
    description: { control: 'text' },
  },
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <div className="flex h-screen items-center justify-center">
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          closeDialog={() => setOpen(false)}
          title={args.title}
          description={args.description}
          accent={args.accent}
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button color="primary" onClick={() => setOpen(false)}>
                Confirm
              </Button>
            </>
          }
        >
          <p className="text-muted-foreground">
            Use this component when you need direct control over dialog state.
          </p>
        </Dialog>
      </div>
    );
  },
};

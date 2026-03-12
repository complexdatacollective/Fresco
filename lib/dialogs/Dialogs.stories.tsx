/* eslint-disable no-console */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import Button from '~/components/ui/Button';
import Dialog from './Dialog';
import DialogProvider from './DialogProvider';
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
 *
 * ## Async Confirm
 *
 * The `confirm` utility supports async `onConfirm` callbacks with built-in
 * abort and error handling. During loading, the dialog remains dismissible —
 * cancel/close/Escape trigger `AbortController.abort()`.
 *
 * ```tsx
 * const result = await confirm({
 *   title: 'Finish Interview',
 *   confirmLabel: 'Finish',
 *   onConfirm: async (signal: AbortSignal) => {
 *     await fetch('/api/action', { method: 'POST', signal });
 *   },
 * });
 * // result: true (completed) | false (cancelled) | null (aborted/error)
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
  decorators: [
    (Story) => (
      <DialogProvider>
        <Story />
      </DialogProvider>
    ),
  ],
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
            <Paragraph margin="none" className="text-current/70">
              Custom dialogs can contain any React content.
            </Paragraph>
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
            <Paragraph margin="none" className="text-current/70">
              Pretend there is a form here...
            </Paragraph>
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

/**
 * The `confirm` utility supports async `onConfirm` callbacks. When the callback
 * returns a Promise, the dialog shows a loading state on the primary button.
 *
 * During loading, the cancel button, close button, backdrop click, and Escape key
 * all trigger `AbortController.abort()` on the in-flight request. The dialog is
 * **always dismissible**.
 *
 * If the async action fails with a non-abort error, the error message is shown
 * inline in the dialog and the user can retry.
 */
export const AsyncConfirm: Story = {
  render: () => {
    const { confirm } = useDialog();

    const handleAsyncAction = async () => {
      const result = await confirm({
        title: 'Finish Interview',
        description:
          'Are you sure you want to finish? Your responses cannot be changed afterwards.',
        confirmLabel: 'Finish Interview',
        cancelLabel: 'Cancel',
        onConfirm: async (signal) => {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(resolve, 2000);
            signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new DOMException('Aborted', 'AbortError'));
            });
          });
        },
      });
      console.log('Async confirm result:', result);
    };

    return (
      <div className="flex h-screen items-center justify-center gap-4">
        <Button onClick={handleAsyncAction}>Finish Interview (2s delay)</Button>
      </div>
    );
  },
};

/**
 * When the user cancels during an async operation, the AbortController signal
 * is triggered. Try clicking "Run Action" and then "Cancel" while loading.
 */
export const AsyncConfirmWithAbort: Story = {
  name: 'Async Confirm — Abort on Cancel',
  render: () => {
    const { confirm } = useDialog();

    const handleAction = async () => {
      const result = await confirm({
        title: 'Process Data',
        description:
          'This will process the selected data. You can cancel at any time.',
        confirmLabel: 'Process',
        cancelLabel: 'Cancel',
        intent: 'default',
        onConfirm: async (signal) => {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(resolve, 5000);
            signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new DOMException('Aborted', 'AbortError'));
            });
          });
        },
      });

      const resultLabels = {
        true: 'Completed',
        false: 'Cancelled before start',
        null: 'Aborted during action',
      };
      console.log(
        'Result:',
        resultLabels[String(result) as keyof typeof resultLabels],
      );
    };

    return (
      <div className="flex h-screen items-center justify-center gap-4">
        <Button onClick={handleAction}>
          Process Data (5s — try cancelling)
        </Button>
      </div>
    );
  },
};

/**
 * When the async `onConfirm` throws a non-abort error, the error message
 * is displayed inline in the dialog. The primary button returns to its
 * normal state so the user can retry.
 */
export const AsyncConfirmWithError: Story = {
  name: 'Async Confirm — Error Handling',
  render: () => {
    const { confirm } = useDialog();

    const handleAction = async () => {
      const result = await confirm({
        title: 'Save Changes',
        description: 'Save your changes to the server.',
        confirmLabel: 'Save',
        cancelLabel: 'Cancel',
        intent: 'default',
        onConfirm: async (signal) => {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(
              () =>
                reject(new Error('Network request failed: connection refused')),
              1000,
            );
            signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new DOMException('Aborted', 'AbortError'));
            });
          });
        },
      });
      console.log('Error dialog result:', result);
    };

    return (
      <div className="flex h-screen items-center justify-center gap-4">
        <Button onClick={handleAction}>Save (always fails after 1s)</Button>
      </div>
    );
  },
};

/**
 * Dialogs automatically become scrollable when content exceeds the viewport height.
 * The content area uses a scroll container while the header and footer remain fixed.
 */
export const ScrollableContent: Story = {
  render: () => {
    const { openDialog, closeDialog } = useDialog();

    const showScrollableDialog = async () => {
      const result = await openDialog({
        id: 'scrollable-dialog',
        type: 'custom',
        title: 'Terms and Conditions',
        description:
          'Please read and accept the following terms before continuing.',
        footer: (
          <>
            <Button onClick={() => closeDialog('scrollable-dialog', false)}>
              Decline
            </Button>
            <Button
              color="primary"
              onClick={() => closeDialog('scrollable-dialog', true)}
            >
              Accept Terms
            </Button>
          </>
        ),
        children: (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-4 text-sm">
              <Heading level="h3" margin="none">
                1. Introduction
              </Heading>
              <Paragraph margin="none">
                Welcome to our platform. These Terms and Conditions govern your
                use of our services and constitute a legally binding agreement
                between you and our company. By accessing or using our platform,
                you agree to be bound by these terms.
              </Paragraph>

              <Heading level="h3" margin="none">
                2. User Responsibilities
              </Heading>
              <Paragraph margin="none">
                As a user, you are responsible for maintaining the
                confidentiality of your account credentials and for all
                activities that occur under your account. You agree to notify us
                immediately of any unauthorized use of your account.
              </Paragraph>

              <Heading level="h3" margin="none">
                3. Privacy Policy
              </Heading>
              <Paragraph margin="none">
                Your privacy is important to us. Our Privacy Policy explains how
                we collect, use, and protect your personal information. By using
                our services, you consent to the collection and use of your
                information as described in our Privacy Policy.
              </Paragraph>

              <Heading level="h3" margin="none">
                4. Intellectual Property
              </Heading>
              <Paragraph margin="none">
                All content, features, and functionality on this platform are
                owned by us and are protected by international copyright,
                trademark, and other intellectual property laws. You may not
                reproduce, distribute, or create derivative works without our
                prior written consent.
              </Paragraph>

              <Heading level="h3" margin="none">
                5. Limitation of Liability
              </Heading>
              <Paragraph margin="none">
                To the fullest extent permitted by law, we shall not be liable
                for any indirect, incidental, special, consequential, or
                punitive damages arising from your use of or inability to use
                our services, even if we have been advised of the possibility of
                such damages.
              </Paragraph>

              <Heading level="h3" margin="none">
                6. Modifications to Terms
              </Heading>
              <Paragraph margin="none">
                We reserve the right to modify these terms at any time. We will
                notify you of any material changes by posting the updated terms
                on our platform. Your continued use of our services after such
                modifications constitutes your acceptance of the revised terms.
              </Paragraph>

              <Heading level="h3" margin="none">
                7. Governing Law
              </Heading>
              <Paragraph margin="none">
                These terms shall be governed by and construed in accordance
                with the laws of the jurisdiction in which our company is
                incorporated, without regard to its conflict of law provisions.
              </Paragraph>

              <Heading level="h3" margin="none">
                8. Contact Information
              </Heading>
              <Paragraph margin="none">
                If you have any questions about these Terms and Conditions,
                please contact us at support@example.com. We are committed to
                resolving any disputes or concerns you may have.
              </Paragraph>
            </div>
          </div>
        ),
      });
      console.log('Scrollable dialog result:', result);
    };

    return (
      <div className="flex h-screen items-center justify-center">
        <Button onClick={showScrollableDialog}>View Terms & Conditions</Button>
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
          <Paragraph margin="none" className="text-current/70">
            Use this component when you need direct control over dialog state.
          </Paragraph>
        </Dialog>
      </div>
    );
  },
};

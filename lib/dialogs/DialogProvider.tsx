'use client';

import React, { createContext, useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '~/components/ui/Button';
import { type FieldValue } from '~/lib/form/components/Field/types';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { generatePublicId } from '~/utils/generatePublicId';
import Dialog from './Dialog';

type BaseDialog = {
  id?: string;
  title: string;
  description?: string;
  intent?: 'default' | 'destructive' | 'success' | 'info';
  children?: React.ReactNode;
};

export type AcknowledgeDialog = BaseDialog & {
  type: 'acknowledge';
  actions: {
    primary: {
      label: string;
      value: true;
    };
  };
};

// Make a choice - no is a valid option
export type ChoiceDialog<P = unknown, S = unknown, C = null> = BaseDialog & {
  type: 'choice';
  intent: 'default' | 'destructive' | 'success' | 'info';
  actions: {
    primary: {
      label: string;
      value: P;
    };
    secondary?: {
      label: string;
      value: S;
    };
    cancel: {
      label: string;
      value: C;
    };
  };
};

export type CustomDialog = BaseDialog & {
  type: 'custom';
};

export type FormDialog = BaseDialog & {
  type: 'form';
  submitLabel?: string;
  cancelLabel?: string;
};

// Helper type to extract return type from a dialog
export type DialogReturnType<D> = D extends AcknowledgeDialog
  ? true | null
  : D extends ChoiceDialog<infer P, infer S, infer C>
    ? P | S | C | null
    : D extends FormDialog
      ? Record<string, FieldValue> | null
      : unknown;

export type AnyDialog =
  | AcknowledgeDialog
  | ChoiceDialog<unknown, unknown, unknown>
  | CustomDialog
  | FormDialog;

type DialogState = AnyDialog & {
  id: string;
  resolveCallback: (value: unknown) => void;
  open: boolean;
};

export type ConfirmOptions = {
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  intent?: 'default' | 'destructive';
};

export type DialogContextType = {
  closeDialog: <T = boolean>(id: string, value: T | null) => Promise<void>;
  openDialog: <D extends AnyDialog>(
    dialogProps: D,
  ) => Promise<DialogReturnType<D>>;
  confirm: (options: ConfirmOptions) => Promise<void>;
};

export const DialogContext = createContext<DialogContextType | null>(null);

const DialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);

  const openDialog = useCallback(
    <D extends AnyDialog>(dialogProps: D): Promise<DialogReturnType<D>> => {
      return new Promise((resolveCallback) => {
        flushSync(() =>
          setDialogs((prevDialogs) => [
            ...prevDialogs,
            {
              ...dialogProps,
              id: dialogProps.id ?? generatePublicId(),
              resolveCallback,
              open: true,
            } as DialogState,
          ]),
        );
      });
    },
    [setDialogs],
  );

  const closeDialog = useCallback(
    async <T = boolean,>(id: string, value: T | null = null) => {
      // Use functional update to access current dialogs state
      // This avoids stale closure issues when closeDialog is captured in children
      let dialogToResolve: DialogState | undefined;

      setDialogs((prevDialogs) => {
        dialogToResolve = prevDialogs.find((dialog) => dialog.id === id);

        if (!dialogToResolve) {
          return prevDialogs; // No change if dialog not found
        }

        // Set open to false to trigger exit animation
        return prevDialogs.map((d) =>
          d.id === id ? { ...d, open: false } : d,
        );
      });

      if (!dialogToResolve) {
        throw new Error(`Dialog with ID ${id} does not exist`);
      }

      dialogToResolve.resolveCallback(value);

      // Wait for the animation to finish before removing from state
      await new Promise((resolve) => setTimeout(resolve, 500));

      setDialogs((prevDialogs) =>
        prevDialogs.filter((dialog) => dialog.id !== id),
      );
    },
    [setDialogs],
  );

  const confirm = useCallback(
    async (options: ConfirmOptions): Promise<void> => {
      const result = await openDialog({
        type: 'choice',
        title: options.title ?? 'Are you sure?',
        description: options.description ?? 'This action cannot be undone.',
        intent: options.intent ?? 'destructive',
        actions: {
          primary: { label: options.confirmLabel, value: true },
          cancel: { label: options.cancelLabel ?? 'Cancel', value: false },
        },
      });
      if (result === true) {
        await options.onConfirm();
      }
    },
    [openDialog],
  );

  const contextValue: DialogContextType = {
    closeDialog,
    openDialog,
    confirm,
  };

  const renderDialogActions = (dialog: DialogState) => {
    if (dialog.type === 'acknowledge') {
      return (
        <Button
          color="primary"
          onClick={() => closeDialog(dialog.id, dialog.actions.primary.value)}
        >
          {dialog.actions.primary.label}
        </Button>
      );
    }

    if (dialog.type === 'choice') {
      // Calculate which button should be auto-focused based on the dialog intent
      // Aim: least destructive action
      // If destructive, focus cancel
      // Otherwise, focus primary
      const autoFocusButton: 'primary' | 'cancel' =
        dialog.intent === 'destructive' ? 'cancel' : 'primary';

      // Render buttons in order: secondary, cancel, primary
      // Primary is visually highlighted
      // Cancel is not always present
      // Secondary is optional
      return (
        <>
          {dialog.actions.secondary && (
            <Button
              onClick={() =>
                closeDialog(dialog.id, dialog.actions.secondary!.value)
              }
            >
              {dialog.actions.secondary.label}
            </Button>
          )}
          {dialog.actions.cancel && (
            <Button
              onClick={() =>
                closeDialog(dialog.id, dialog.actions.cancel.value)
              }
              autoFocus={autoFocusButton === 'cancel'}
            >
              {dialog.actions.cancel.label}
            </Button>
          )}
          <Button
            color="primary"
            onClick={() => closeDialog(dialog.id, dialog.actions.primary.value)}
            autoFocus={autoFocusButton === 'primary'}
          >
            {dialog.actions.primary.label}
          </Button>
        </>
      );
    }

    return null;
  };

  const renderDialog = (dialog: DialogState) => {
    if (dialog.type === 'form') {
      const formId = `dialog-form-${dialog.id}`;
      return (
        <FormStoreProvider key={dialog.id}>
          <Dialog
            title={dialog.title}
            description={dialog.description}
            closeDialog={() => closeDialog(dialog.id)}
            accent={dialog.intent}
            open={dialog.open}
            footer={
              <>
                <Button onClick={() => closeDialog(dialog.id, null)}>
                  {dialog.cancelLabel ?? 'Cancel'}
                </Button>
                <SubmitButton form={formId}>
                  {dialog.submitLabel ?? 'Submit'}
                </SubmitButton>
              </>
            }
          >
            <FormWithoutProvider
              id={formId}
              onSubmit={(values) => {
                void closeDialog(dialog.id, values);
                return { success: true };
              }}
            >
              {dialog.children}
            </FormWithoutProvider>
          </Dialog>
        </FormStoreProvider>
      );
    }

    return (
      <Dialog
        key={dialog.id}
        title={dialog.title}
        description={dialog.description}
        closeDialog={() => closeDialog(dialog.id)}
        accent={dialog.intent}
        open={dialog.open}
        footer={renderDialogActions(dialog)}
      >
        {dialog.children}
      </Dialog>
    );
  };

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialogs.map(renderDialog)}
    </DialogContext.Provider>
  );
};

export default DialogProvider;

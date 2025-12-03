'use client';

import React, { createContext, useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '~/components/ui/Button';
import { generatePublicId } from '~/utils/generatePublicId';
import { Dialog } from './Dialog';

export type BaseDialog = {
  id?: string;
  title: string;
  description: string;
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

// Helper type to extract return type from a dialog
export type DialogReturnType<D> = D extends AcknowledgeDialog
  ? true | null
  : D extends ChoiceDialog<infer P, infer S, infer C>
    ? P | S | C | null
    : unknown;

export type AnyDialog =
  | AcknowledgeDialog
  | ChoiceDialog<unknown, unknown, unknown>
  | CustomDialog;

type DialogState = AnyDialog & {
  id: string;
  resolveCallback: (value: unknown) => void;
  open: boolean;
};

export type DialogContextType = {
  closeDialog: <T = boolean>(id: string, value: T | null) => Promise<void>;
  openDialog: <D extends AnyDialog>(
    dialogProps: D,
  ) => Promise<DialogReturnType<D>>;
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
      const dialog = dialogs.find((dialog) => dialog.id === id);

      if (!dialog) {
        throw new Error(`Dialog with ID ${id} does not exist`);
      }

      // Set open to false to trigger exit animation
      setDialogs((prevDialogs) =>
        prevDialogs.map((d) => (d.id === id ? { ...d, open: false } : d)),
      );

      dialog.resolveCallback(value);

      // Wait for the animation to finish before removing from state
      await new Promise((resolve) => setTimeout(resolve, 500));

      setDialogs((prevDialogs) =>
        prevDialogs.filter((dialog) => dialog.id !== id),
      );
    },
    [dialogs, setDialogs],
  );

  const contextValue: DialogContextType = {
    closeDialog,
    openDialog,
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

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialogs.map((dialog) => (
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
      ))}
    </DialogContext.Provider>
  );
};

export default DialogProvider;

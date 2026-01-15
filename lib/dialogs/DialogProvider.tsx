'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import { generatePublicId } from '~/utils/generatePublicId';
import { Button } from '../ui/components';
import Dialog from './Dialog';

type ConfirmDialog = {
  type: 'confirm';
  hideCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
};

type CustomDialog<T> = {
  type: 'custom';
  renderContent: (resolve: (value: T | null) => void) => React.ReactNode;
};

type Dialog<T> = {
  id?: string;
  title: string;
  description: string;
  accent?: 'default' | 'danger' | 'success' | 'warning' | 'info';
} & (ConfirmDialog | CustomDialog<T>);

type DialogState = Dialog<unknown> & {
  id: string;
  resolveCallback: (value: unknown) => void;
  ref: RefObject<HTMLDialogElement>;
};

type DialogContextType = {
  closeDialog: <T = boolean>(id: string, value: T | null) => Promise<void>;
  openDialog: <T = boolean>(dialogProps: Dialog<T>) => Promise<T | null>;
};

const DialogContext = createContext<DialogContextType | null>(null);

const DialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);

  const openDialog = useCallback(
    async <T = boolean,>(dialogProps: Dialog<T>): Promise<T | null> => {
      const dialogRef = React.createRef<HTMLDialogElement>();

      return new Promise((resolveCallback) => {
        flushSync(() =>
          setDialogs((prevDialogs) => [
            ...prevDialogs,
            {
              ...dialogProps,
              id: dialogProps.id ?? generatePublicId(),
              resolveCallback,
              ref: dialogRef,
            } as DialogState,
          ]),
        );

        if (dialogRef.current) {
          dialogRef.current.showModal();
        }
      });
    },
    [setDialogs],
  );

  const closeDialog = useCallback(
    async <T = boolean,>(id: string, value: T | null) => {
      const dialog = dialogs.find((dialog) => dialog.id === id);

      if (!dialog) {
        throw new Error(`Dialog with ID ${id} does not exist`);
      }

      if (dialog.ref.current) {
        dialog.ref.current.close();
        dialog.resolveCallback(value);
      }

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

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialogs.map((dialog) => {
        if (dialog.type === 'confirm') {
          return (
            <Dialog
              key={dialog.id}
              title={dialog.title}
              description={dialog.description}
              closeDialog={() => closeDialog(dialog.id, null)}
              accent={dialog.accent}
              ref={dialog.ref}
            >
              {dialog.children}
              <Button
                onClick={() => closeDialog(dialog.id, true)}
                color="primary"
              >
                {dialog.confirmText ?? 'Acknowledge'}
              </Button>
              {!dialog.hideCancel && (
                <Button onClick={() => closeDialog(dialog.id, null)}>
                  {dialog.cancelText ?? 'Cancel'}
                </Button>
              )}
            </Dialog>
          );
        }

        if (dialog.type === 'custom') {
          return (
            <Dialog
              key={dialog.id}
              title={dialog.title}
              description={dialog.description}
              closeDialog={() => closeDialog(dialog.id, null)}
              accent={dialog.accent}
              ref={dialog.ref}
            >
              {dialog.renderContent((value) => closeDialog(dialog.id, value))}
            </Dialog>
          );
        }
      })}
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }

  return context;
};

export default DialogProvider;

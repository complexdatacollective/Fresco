'use client';

import { Loader2 } from 'lucide-react';
import React, { createContext, useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import { type FieldValue } from '~/lib/form/components/Field/types';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { generatePublicId } from '~/utils/generatePublicId';
import Dialog from './Dialog';
import useWizardState from './useWizardState';

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
  footer?: React.ReactNode;
};

export type FormDialog = BaseDialog & {
  type: 'form';
  submitLabel?: string;
  cancelLabel?: string;
};

export type WizardStep = {
  title: string;
  description?: string;
  content: React.ComponentType;
  nextLabel?: string;
  backLabel?: string;
  skip?: (data: Record<string, unknown>) => boolean;
};

export type WizardDialog = BaseDialog & {
  type: 'wizard';
  steps: WizardStep[];
  progress?: React.ComponentType<{
    currentStep: number;
    totalSteps: number;
  }> | null;
  onFinish?: (data: Record<string, unknown>) => unknown;
};

// Helper type to extract return type from a dialog
export type DialogReturnType<D> = D extends AcknowledgeDialog
  ? true | null
  : D extends ChoiceDialog<infer P, infer S, infer C>
    ? P | S | C | null
    : D extends FormDialog
      ? Record<string, FieldValue> | null
      : D extends WizardDialog
        ? unknown
        : unknown;

export type AnyDialog =
  | AcknowledgeDialog
  | ChoiceDialog<unknown, unknown, unknown>
  | CustomDialog
  | FormDialog
  | WizardDialog;

type DialogState = AnyDialog & {
  id: string;
  resolveCallback: (value: unknown) => void;
  open: boolean;
  abortController: AbortController | null;
  onConfirmHandler: (() => void | Promise<void>) | null;
  error: string | null;
};

export type ConfirmOptions = {
  onConfirm: (signal: AbortSignal) => void | Promise<void>;
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
  confirm: (options: ConfirmOptions) => Promise<true | false | null>;
};

export const DialogContext = createContext<DialogContextType | null>(null);

function WizardDialogRenderer({
  dialog,
  closeDialog,
}: {
  dialog: DialogState & { type: 'wizard' };
  closeDialog: DialogContextType['closeDialog'];
}) {
  const wizardProps = useWizardState({
    dialog,
    dialogId: dialog.id,
    closeDialog,
  });

  if (!wizardProps) return null;

  return (
    <Dialog
      title={wizardProps.title}
      description={wizardProps.description}
      closeDialog={() => closeDialog(dialog.id, null)}
      accent={dialog.intent}
      open={dialog.open}
      footer={wizardProps.footer}
    >
      {wizardProps.children}
    </Dialog>
  );
}

const DialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);
  const dialogsRef = useRef<DialogState[]>([]);

  const setDialogsAndRef = useCallback(
    (updater: (prev: DialogState[]) => DialogState[]) => {
      setDialogs((prev) => {
        const next = updater(prev);
        dialogsRef.current = next;
        return next;
      });
    },
    [],
  );

  const openDialog = useCallback(
    <D extends AnyDialog>(dialogProps: D): Promise<DialogReturnType<D>> => {
      return new Promise((resolveCallback) => {
        flushSync(() =>
          setDialogsAndRef((prevDialogs) => [
            ...prevDialogs,
            {
              onConfirmHandler: null,
              ...dialogProps,
              id: dialogProps.id ?? generatePublicId(),
              resolveCallback,
              open: true,
              abortController: null,
              error: null,
            } as DialogState,
          ]),
        );
      });
    },
    [setDialogsAndRef],
  );

  const closeDialog = useCallback(
    async <T = boolean,>(id: string, value: T | null = null) => {
      const dialog = dialogsRef.current.find((d) => d.id === id);

      if (!dialog || !dialog.open) {
        return;
      }

      if (dialog.abortController) {
        dialog.abortController.abort();
      }

      setDialogsAndRef((prevDialogs) =>
        prevDialogs.map((d) => (d.id === id ? { ...d, open: false } : d)),
      );

      dialog.resolveCallback(value);

      await new Promise((resolve) => setTimeout(resolve, 500));

      setDialogsAndRef((prevDialogs) => prevDialogs.filter((d) => d.id !== id));
    },
    [setDialogsAndRef],
  );

  const setDialogAbortController = useCallback(
    (id: string, abortController: AbortController | null) => {
      setDialogsAndRef((prevDialogs) =>
        prevDialogs.map((d) => (d.id === id ? { ...d, abortController } : d)),
      );
    },
    [setDialogsAndRef],
  );

  const setDialogError = useCallback(
    (id: string, error: string | null) => {
      setDialogsAndRef((prevDialogs) =>
        prevDialogs.map((d) => (d.id === id ? { ...d, error } : d)),
      );
    },
    [setDialogsAndRef],
  );

  const confirm = useCallback(
    async (options: ConfirmOptions): Promise<true | false | null> => {
      const dialogId = generatePublicId();

      const handleConfirm = async () => {
        setDialogError(dialogId, null);

        const abortController = new AbortController();

        let maybePromise: void | Promise<void>;
        try {
          maybePromise = options.onConfirm(abortController.signal);
        } catch (e) {
          setDialogError(
            dialogId,
            e instanceof Error ? e.message : 'An error occurred',
          );
          return;
        }

        if (!(maybePromise instanceof Promise)) {
          await closeDialog(dialogId, true);
          return;
        }

        setDialogAbortController(dialogId, abortController);

        try {
          await maybePromise;
          await closeDialog(dialogId, true);
        } catch (e) {
          if (e instanceof DOMException && e.name === 'AbortError') {
            return;
          }

          setDialogAbortController(dialogId, null);
          setDialogError(
            dialogId,
            e instanceof Error ? e.message : 'An error occurred',
          );
        }
      };

      const result = await openDialog({
        id: dialogId,
        type: 'choice',
        title: options.title ?? 'Are you sure?',
        description: options.description ?? 'This action cannot be undone.',
        intent: options.intent ?? 'destructive',
        actions: {
          primary: { label: options.confirmLabel, value: true },
          cancel: {
            label: options.cancelLabel ?? 'Cancel',
            value: false,
          },
        },
        onConfirmHandler: handleConfirm,
      } as ChoiceDialog<boolean, never, boolean> & {
        id: string;
        onConfirmHandler: () => void | Promise<void>;
      });

      return result ?? null;
    },
    [openDialog, closeDialog, setDialogAbortController, setDialogError],
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
      const autoFocusButton: 'primary' | 'cancel' =
        dialog.intent === 'destructive' ? 'cancel' : 'primary';

      const isLoading = dialog.abortController !== null;

      const handlePrimaryClick = () => {
        if (dialog.onConfirmHandler) {
          void dialog.onConfirmHandler();
        } else {
          void closeDialog(dialog.id, dialog.actions.primary.value);
        }
      };

      return (
        <>
          {dialog.error && (
            <Paragraph className="text-destructive w-full text-sm">
              {dialog.error}
            </Paragraph>
          )}
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
            onClick={handlePrimaryClick}
            autoFocus={autoFocusButton === 'primary'}
            disabled={isLoading}
            icon={isLoading ? <Loader2 className="animate-spin" /> : undefined}
          >
            {isLoading ? 'Please wait...' : dialog.actions.primary.label}
          </Button>
        </>
      );
    }

    return null;
  };

  const renderDialog = (dialog: DialogState) => {
    if (dialog.type === 'wizard') {
      return (
        <WizardDialogRenderer
          key={dialog.id}
          dialog={dialog}
          closeDialog={closeDialog}
        />
      );
    }

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

    const footer =
      dialog.type === 'custom' ? dialog.footer : renderDialogActions(dialog);

    return (
      <Dialog
        key={dialog.id}
        title={dialog.title}
        description={dialog.description}
        closeDialog={() => closeDialog(dialog.id)}
        accent={dialog.intent}
        open={dialog.open}
        footer={footer}
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

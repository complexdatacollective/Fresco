'use client';

import { type ReactNode } from 'react';

import Dialog, { type DialogProps } from '@codaco/fresco-ui/dialogs/Dialog';
import useFormStore from '@codaco/fresco-ui/form/hooks/useFormStore';

type FormDialogProps = Omit<DialogProps, 'dismissible' | 'footer'> & {
  /**
   * Work in flight outside the form's own submission that must also hold the
   * dialog open, such as a passkey ceremony started from a button.
   */
  busy?: boolean;
  /**
   * Given whether the dialog is being held open, so a Cancel action in it can
   * be disabled to match.
   */
  footer?: (heldOpen: boolean) => ReactNode;
};

/**
 * A `Dialog` around a form whose `FormStoreProvider` sits above it — the shape
 * a dialog takes when its submit button lives in the footer. Render it INSIDE
 * that provider: it reads the store's `isSubmitting` and refuses Escape, an
 * outside press and the close button while the submission runs.
 *
 * A submission cannot be called back once sent — the server action still
 * lands — so a dialog that let itself be dismissed mid-way would look
 * cancelled while the work completed behind it.
 */
export default function FormDialog({
  busy = false,
  footer,
  ...props
}: FormDialogProps) {
  const isSubmitting = useFormStore((state) => state.isSubmitting);
  const heldOpen = isSubmitting || busy;

  return (
    <Dialog {...props} dismissible={!heldOpen} footer={footer?.(heldOpen)} />
  );
}

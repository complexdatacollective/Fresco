import { useEffect, useRef } from 'react';
import { Dialog, type DialogProps } from './Dialog';

/**
 * A variation of Dialog that has an internal useEffect to handle triggering
 * the native dialog's showModal and close methods.
 */
export const ControlledDialog = ({ open, ...rest }: DialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [open]);

  return <Dialog {...rest} ref={ref} />;
};

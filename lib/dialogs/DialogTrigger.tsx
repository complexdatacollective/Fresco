'use client';

import React from 'react';
import { Button, type ButtonProps } from '~/components/ui/Button';
import { type AnyDialog, type DialogReturnType } from './DialogProvider';
import useDialog from './useDialog';

type DialogTriggerProps<D extends AnyDialog> = Omit<ButtonProps, 'onClick'> & {
  dialog: D;
  onResult?: (result: DialogReturnType<D>) => void | Promise<void>;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export function DialogTrigger<D extends AnyDialog>({
  dialog,
  onResult,
  onClick,
  children,
  ...buttonProps
}: DialogTriggerProps<D>) {
  const { openDialog } = useDialog();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);

    const result = await openDialog(dialog);

    if (onResult) {
      await onResult(result);
    }
  };

  return (
    <Button onClick={handleClick} {...buttonProps}>
      {children}
    </Button>
  );
}

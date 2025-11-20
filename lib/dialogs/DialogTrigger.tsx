'use client';

import React from 'react';
import { Button, type ButtonProps } from '~/components/ui/Button';
import { useDialog } from './DialogProvider';

type DialogActions<P = unknown, S = unknown, C = unknown> = {
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

type BaseDialog = {
  id?: string;
  title: string;
  description: string;
  intent?: 'default' | 'danger' | 'success' | 'info';
  children?: React.ReactNode;
};

type AcknowledgeDialog = BaseDialog & {
  type: 'acknowledge';
  actions: Omit<DialogActions<boolean>, 'secondary' | 'cancel'>;
};

type ChoiceDialog<P = unknown, S = unknown, C = null> = BaseDialog & {
  type: 'choice';
  intent: 'default' | 'danger' | 'success' | 'info';
  actions: DialogActions<P, S, C>;
};

type CustomDialog = BaseDialog & {
  type: 'custom';
};

type Dialog<P, S, C> = AcknowledgeDialog | ChoiceDialog<P, S, C> | CustomDialog;

type DialogTriggerProps<P = unknown, S = unknown, C = unknown> = Omit<
  ButtonProps,
  'onClick'
> & {
  dialog: Dialog<P, S, C>;
  onResult?: (result: P | S | C | null) => void | Promise<void>;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export function DialogTrigger<P = unknown, S = unknown, C = unknown>({
  dialog,
  onResult,
  onClick,
  children,
  ...buttonProps
}: DialogTriggerProps<P, S, C>) {
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

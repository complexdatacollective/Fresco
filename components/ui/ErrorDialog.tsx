'use client';

import type { AlertDialogProps } from '@radix-ui/react-alert-dialog';
import React from 'react';
import { ControlledDialog } from '~/lib/dialogs/ControlledDialog';
import Button from './Button';
import { Divider } from './Divider';

type ErrorDialogProps = AlertDialogProps & {
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  additionalContent?: React.ReactNode;
  onConfirm?: () => void;
};

const ErrorDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title = 'Error',
  description,
  confirmLabel = 'OK',
  additionalContent,
}: ErrorDialogProps) => {
  return (
    <ControlledDialog
      open={open}
      closeDialog={onOpenChange}
      title={title}
      description={description}
      footer={<Button onClick={onConfirm}>{confirmLabel}</Button>}
    >
      {additionalContent && (
        <>
          <Divider className="w-full" />
          {additionalContent}
        </>
      )}
    </ControlledDialog>
  );
};

export default ErrorDialog;

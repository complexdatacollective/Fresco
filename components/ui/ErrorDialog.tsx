'use client';

import type { AlertDialogProps } from '@radix-ui/react-alert-dialog';
import React from 'react';
import {
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogAction,
} from '~/components/ui/AlertDialog';

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-500">{title}</AlertDialogTitle>
          {description}
        </AlertDialogHeader>
        {additionalContent}
        <AlertDialogFooter>
          <AlertDialogAction className="bg-red-500" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ErrorDialog;

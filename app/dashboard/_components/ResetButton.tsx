'use client';

import { useState } from 'react';
import { resetAppSettings } from '~/actions/reset';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/AlertDialog';
import { Button } from '~/components/ui/Button';

const ResetButton = () => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  return (
    <>
      <Button
        type="submit"
        variant="destructive"
        onClick={() => setShowConfirmDialog(true)}
      >
        Reset all app data
      </Button>
      <AlertDialog
        open={showConfirmDialog}
        onOpenChange={(state) => setShowConfirmDialog(state)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete ALL application data, including interviews
              and protocols. This action cannot be undone. Do you want to
              continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => setShowConfirmDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsResetting(true);
                resetAppSettings();
              }}
              variant="destructive"
            >
              {isResetting ? 'Resetting...' : 'Delete all data'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ResetButton;

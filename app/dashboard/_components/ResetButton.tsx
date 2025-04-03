'use client';

import { Loader2 } from 'lucide-react';
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
        data-testid="reset-app-button"
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
              disabled={isResetting}
              onClick={async () => {
                setIsResetting(true);
                const result = await resetAppSettings();
                if (result.error) {
                  setIsResetting(false);
                  // eslint-disable-next-line no-console
                  console.log(result.error);
                  alert(
                    'Failed to reset app settings. See console for details.',
                  );
                }
              }}
              variant="destructive"
              data-testid="confirm-reset-app-button"
            >
              {isResetting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isResetting ? 'Resetting...' : 'Delete all data'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ResetButton;

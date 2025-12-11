'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { resetAppSettings } from '~/actions/reset';
import { Button } from '~/components/ui/Button';
import { Dialog } from '~/lib/dialogs/Dialog';

const ResetButton = () => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  return (
    <>
      <Button
        type="submit"
        color="destructive"
        onClick={() => setShowConfirmDialog(true)}
      >
        Reset all app data
      </Button>
      <Dialog
        accent="destructive"
        open={showConfirmDialog}
        closeDialog={() => setShowConfirmDialog(false)}
        title="Are you sure?"
        description="This action will delete ALL application data, including interviews and protocols. This action cannot be undone. Do you want to continue?"
        footer={
          <>
            <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
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
              color="primary"
            >
              {isResetting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isResetting ? 'Resetting...' : 'Delete all data'}
            </Button>
          </>
        }
      ></Dialog>
    </>
  );
};

export default ResetButton;

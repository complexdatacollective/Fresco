import type { Interview } from '@prisma/client';
import { Loader2, Trash2 } from 'lucide-react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { deleteInterviews } from '~/actions/interviews';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';
import { ControlledDialog } from '~/lib/dialogs/ControlledDialog';

type DeleteInterviewsDialog = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  interviewsToDelete: Interview[];
};

export const DeleteInterviewsDialog = ({
  open,
  setOpen,
  interviewsToDelete,
}: DeleteInterviewsDialog) => {
  const [hasUnexported, setHasUnexported] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setHasUnexported(
      interviewsToDelete?.some((interview) => !interview.exportTime),
    );
  }, [interviewsToDelete]);

  const handleConfirm = async () => {
    await deleteInterviews(interviewsToDelete.map((d) => ({ id: d.id })));
    setHasUnexported(false);

    setOpen(false);
  };

  const handleCancelDialog = () => {
    setHasUnexported(false);
    setOpen(false);
  };

  return (
    <ControlledDialog
      accent="danger"
      open={open}
      closeDialog={handleCancelDialog}
      title="Are you absolutely sure?"
      description={
        <>
          This action cannot be undone. This will permanently delete{' '}
          <strong>
            {interviewsToDelete.length}{' '}
            {interviewsToDelete.length > 1 ? <>interviews.</> : <>interview.</>}
          </strong>
        </>
      }
      footer={
        <>
          <Button disabled={isDeleting} onClick={handleCancelDialog}>
            Cancel
          </Button>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true);
              await handleConfirm();
              setIsDeleting(false);
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </>
            )}
          </Button>
        </>
      }
    >
      {hasUnexported && (
        <Alert variant="destructive">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            {interviewsToDelete.length > 1 ? (
              <>
                One or more of the selected interviews
                <strong> has not yet been exported.</strong>
              </>
            ) : (
              <>
                The selected interview
                <strong> has not yet been exported.</strong>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </ControlledDialog>
  );
};

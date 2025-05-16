import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/AlertDialog';
import { Button } from '~/components/ui/Button';

type DeleteParticipantsDialog = {
  open: boolean;
  participantCount: number;
  haveInterviews: boolean;
  haveUnexportedInterviews: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DeleteParticipantsDialog = ({
  open,
  participantCount,
  haveInterviews,
  haveUnexportedInterviews,
  onConfirm,
  onCancel,
}: DeleteParticipantsDialog) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const dialogContent = useMemo(() => {
    if (!haveInterviews) {
      return null;
    }

    if (haveUnexportedInterviews) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            {participantCount > 1 ? (
              <>
                One or more of the selected participants have interview data
                that <strong> has not yet been exported.</strong> Deleting these
                participants will also delete their interview data.
              </>
            ) : (
              <>
                The selected participant has interview data that
                <strong> has not yet been exported.</strong> Deleting this
                participant will also delete their interview data.
              </>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          {participantCount > 1 ? (
            <>
              One or more of the selected participants have interview data that
              will also be deleted. This data is marked as having been exported,
              but you may wish to confirm this before proceeding.
            </>
          ) : (
            <>
              The selected participant has interview data that will also be
              deleted. This data is marked as having been exported, but you may
              wish to confirm this before proceeding.
            </>
          )}
        </AlertDescription>
      </Alert>
    );
  }, [haveInterviews, haveUnexportedInterviews, participantCount]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            <strong>
              {`${participantCount} participant${
                participantCount > 1 ? 's' : ''
              }`}
            </strong>
            .
          </AlertDialogDescription>
          {dialogContent}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true);
              await onConfirm();
              setIsDeleting(false);
            }}
            variant="destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> Permanently Delete
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

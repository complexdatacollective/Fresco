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
};

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
      <Alert className="p-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          {participantCount > 1 ? (
            <>
              One or more of the selected participants have interview data that
              will also be deleted.
            </>
          ) : (
            <>
              The selected participant has interview data that will also be
              deleted.
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
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <Button
            onClick={async () => {
              setIsDeleting(true);
              await onConfirm();
              setIsDeleting(false);
            }}
            variant="destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

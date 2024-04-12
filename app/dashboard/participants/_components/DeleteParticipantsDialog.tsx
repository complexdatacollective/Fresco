import { AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/AlertDialog';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { useMemo } from 'react';

type DeleteParticipantsDialog = {
  open: boolean;
  participantCount: number;
  haveInterviews: boolean;
  haveUnexportedInterviews: boolean;
  onConfirm: () => void;
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
          <Button onClick={onConfirm} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Permanently Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

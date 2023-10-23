import { Loader2, AlertCircle, Trash2 } from 'lucide-react';
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

interface DeleteParticipantConfirmationDialog {
  open: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  numberOfParticipants?: number;
  hasInterviews?: boolean;
  hasUnexportedInterviews?: boolean;
  isDeleting?: boolean;
}

export const DeleteParticipantConfirmationDialog = ({
  open,
  onConfirm,
  onCancel,
  numberOfParticipants,
  hasInterviews,
  hasUnexportedInterviews,
  isDeleting,
}: DeleteParticipantConfirmationDialog) => {
  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            <strong>
              {numberOfParticipants}{' '}
              {numberOfParticipants && numberOfParticipants > 1 ? (
                <>participants.</>
              ) : (
                <>participant.</>
              )}
            </strong>
          </AlertDialogDescription>
          {hasInterviews && !hasUnexportedInterviews && (
            <Alert className="p-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                {numberOfParticipants && numberOfParticipants > 1 ? (
                  <>
                    One or more of the selected participants have interview data
                    that will also be deleted.
                  </>
                ) : (
                  <>
                    The selected participant has interview data that will also
                    be deleted.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          {hasUnexportedInterviews && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                {numberOfParticipants && numberOfParticipants > 1 ? (
                  <>
                    One or more of the selected participants have interview data
                    that <strong> has not yet been exported.</strong> Deleting
                    these participants will also delete their interview data.
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
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <Button onClick={() => void onConfirm()} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

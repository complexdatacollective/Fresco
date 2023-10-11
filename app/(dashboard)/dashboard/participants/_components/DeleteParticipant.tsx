import { type Participant } from '@prisma/client';
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
} from '~/components/ui/alert-dialog';

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';

// Check if participant has interviews
// Check if participant interviews have been exported using exportTime

interface DeleteParticipantProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // get correct ParticipantWithInterviews type
  selectedParticipants: Participant[];
  isDeleting: boolean;
}

export const DeleteParticipant = ({
  open,
  onConfirm,
  onCancel,
  selectedParticipants,
  isDeleting,
}: DeleteParticipantProps) => {
  const hasInterviews = selectedParticipants.some(
    (participant) => participant.interviews.length > 0,
  );

  const hasInterviewsNotYetExported = selectedParticipants.some((participant) =>
    participant.interviews.some((interview) => !interview.exportTime),
  );

  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            <strong>
              {selectedParticipants.length}{' '}
              {selectedParticipants.length > 1 ? (
                <>participants.</>
              ) : (
                <>participant.</>
              )}
            </strong>
          </AlertDialogDescription>
          {hasInterviews && !hasInterviewsNotYetExported && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                {selectedParticipants.length > 1 ? (
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
          {hasInterviewsNotYetExported && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                {selectedParticipants.length > 1 ? (
                  <>
                    One or more of the selected participants have{' '}
                    <strong> unexported </strong>
                    interview data that will also be deleted.
                  </>
                ) : (
                  <>
                    The selected participant has <strong> unexported </strong>
                    interview data that will also be deleted.
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
          <Button onClick={onConfirm} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

import { type Participant } from '@prisma/client';
import { Loader2 } from 'lucide-react';
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

// Check if participant has interviews
// Check if participant interviews have been exported using exportTime

interface DeleteParticipantProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // get correct ParticipantWithInterviews type
  selectedParticipants: Participant[];
}

export const DeleteParticipant = ({
  open,
  onConfirm,
  onCancel,
  selectedParticipants,
}: DeleteParticipantProps) => {
  // TODO: get isLoading from parent
  const isLoading = false;

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
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            <strong>{selectedParticipants.length} participant(s).</strong>
          </AlertDialogDescription>
          {hasInterviews && (
            <div>
              <strong>Warning:</strong> One or more of the selected participants
              has interview data that will also be deleted.
            </div>
          )}
          {hasInterviewsNotYetExported && (
            <div>
              <strong>Warning:</strong> This interview data has not yet been
              exported.
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <Button onClick={onConfirm}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Deleting...' : 'Continue'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

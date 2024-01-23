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
import { api } from '~/trpc/client';
import type { ParticipantWithInterviews } from '~/shared/types';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

type DeleteParticipantsDialog = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  participantsToDelete: ParticipantWithInterviews[];
};

export const DeleteParticipantsDialog = ({
  open,
  setOpen,
  participantsToDelete,
}: DeleteParticipantsDialog) => {
  const [participantsInfo, setParticipantsInfo] = useState<{
    hasInterviews: boolean;
    hasUnexportedInterviews: boolean;
  }>({
    hasInterviews: false,
    hasUnexportedInterviews: false,
  });

  useEffect(() => {
    setParticipantsInfo({
      hasInterviews: participantsToDelete?.some(
        (participant) => participant._count.interviews > 0,
      ),
      hasUnexportedInterviews: participantsToDelete?.some((participant) =>
        participant.interviews.some((interview) => !interview.exportTime),
      ),
    });
  }, [participantsToDelete]);

  const { mutateAsync: deleteParticipants, isLoading: isDeleting } =
    api.participant.delete.byId.useMutation({
      onError(error) {
        throw new Error(error.message);
      },
    });
  const utils = api.useUtils();

  const handleConfirm = async () => {
    // Delete selected participants
    await deleteParticipants(participantsToDelete.map((d) => d.identifier));
    await utils.participant.get.all.refetch();
    setParticipantsInfo({
      hasInterviews: false,
      hasUnexportedInterviews: false,
    });
    setOpen(false);
  };

  const handleCancelDialog = () => {
    setParticipantsInfo({
      hasInterviews: false,
      hasUnexportedInterviews: false,
    });
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleCancelDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            <strong>
              {participantsToDelete.length}{' '}
              {participantsToDelete.length > 1 ? (
                <>participants.</>
              ) : (
                <>participant.</>
              )}
            </strong>
          </AlertDialogDescription>
          {participantsInfo.hasInterviews &&
            !participantsInfo.hasUnexportedInterviews && (
              <Alert className="p-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  {participantsToDelete.length > 1 ? (
                    <>
                      One or more of the selected participants have interview
                      data that will also be deleted.
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
          {participantsInfo.hasUnexportedInterviews && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                {participantsToDelete.length > 1 ? (
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
          <AlertDialogCancel disabled={isDeleting} onClick={handleCancelDialog}>
            Cancel
          </AlertDialogCancel>
          <Button onClick={() => void handleConfirm()} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

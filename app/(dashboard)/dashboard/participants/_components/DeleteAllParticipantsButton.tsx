'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
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

export const DeleteAllParticipantsButton = () => {
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const utils = trpc.useContext();
  const { mutate: deleteAllParticipants, isLoading } =
    trpc.participant.delete.all.useMutation({
      async onSuccess() {
        await utils.participant.get.all.refetch();
        setShowAlertDialog(false);
      },
    });
  return (
    <>
      <Button variant="destructive" onClick={() => setShowAlertDialog(true)}>
        Delete All Participants
      </Button>
      <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <strong>all</strong> participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <Button
              onClick={() => deleteAllParticipants()}
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Deleting...' : 'Continue'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
